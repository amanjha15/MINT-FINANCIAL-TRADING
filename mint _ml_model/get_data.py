from fastapi import FastAPI, HTTPException
import xgboost as xgb
import pickle
import numpy as np
import pandas as pd
import shap
import yfinance as yf
import traceback
import math

app = FastAPI()

# -------------------- LOAD SCALER --------------------
with open("scaler.pkl", "rb") as f:
    scaler = pickle.load(f)

EXPECTED_FEATURES = scaler.n_features_in_

ALL_FEATURES = [
    "sma_20", "ema_10", "rsi_14", "macd", "atr_14",
    "vol_sma_5", "daily_return", "prev_close",
    "return_1d", "return_5d", "close_30_sma",
    "open", "boll_lb"
]

feature_cols = ALL_FEATURES[:EXPECTED_FEATURES]

# -------------------- LOAD MODEL --------------------
model = xgb.Booster()
model.load_model("xgb_stock_model.json")

# -------------------- LOAD SHAP --------------------
explainer = shap.TreeExplainer(model)


# -------------------- HELPERS --------------------
def require_history(df: pd.DataFrame, required_days: int, symbol: str):
    if len(df) < required_days:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Not enough history for {symbol}. "
                f"Need at least {required_days} rows, got {len(df)}. "
                "Try increasing `period` in yf.download."
            )
        )


def safe_float(x, name):
    if x is None or (isinstance(x, float) and (math.isnan(x) or math.isinf(x))):
        raise HTTPException(status_code=400, detail=f"Indicator '{name}' is NaN or missing.")
    return float(x)


def compute_macd(series: pd.Series):
    """
    Compute MACD (12,26,9) using pandas EWMA. Returns macd_series and signal_series.
    """
    ema12 = series.ewm(span=12, adjust=False).mean()
    ema26 = series.ewm(span=26, adjust=False).mean()
    macd = ema12 - ema26
    signal = macd.ewm(span=9, adjust=False).mean()
    hist = macd - signal
    return macd, signal, hist


def compute_bb(series: pd.Series, length=20, std_mult=2.0):
    sma = series.rolling(window=length).mean()
    std = series.rolling(window=length).std(ddof=0)
    upper = sma + std_mult * std
    lower = sma - std_mult * std
    return upper, sma, lower


def compute_atr(df: pd.DataFrame, length=14):
    high = df["High"]
    low = df["Low"]
    close = df["Close"]
    tr1 = high - low
    tr2 = (high - close.shift(1)).abs()
    tr3 = (low - close.shift(1)).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    atr = tr.rolling(window=length).mean()
    return atr


# =====================================================
#        FUNCTION: FETCH LATEST INDICATORS (robust)
# =====================================================
def fetch_indicators(symbol: str):
    try:
        # Request more history to safely compute indicators (30-120 days)
        data = yf.download(symbol, period="120d", interval="1d", progress=False)

        if data.empty or len(data) < 30:
            raise HTTPException(status_code=400, detail=f"No or insufficient data for symbol {symbol} (rows={len(data)})")

        df = data.copy()

        # Ensure index sorted and no duplicate indices
        df = df[~df.index.duplicated(keep="last")]
        df = df.sort_index()

        # Require minimal history for indicators
        require_history(df, required_days=40, symbol=symbol)

        # SMA 20
        df["sma_20"] = df["Close"].rolling(window=20, min_periods=15).mean()

        # EMA 10
        df["ema_10"] = df["Close"].ewm(span=10, adjust=False).mean()

        # RSI 14 (classic implementation)
        delta = df["Close"].diff()
        gain = delta.clip(lower=0)
        loss = -1 * delta.clip(upper=0)
        avg_gain = gain.rolling(window=14, min_periods=14).mean()
        avg_loss = loss.rolling(window=14, min_periods=14).mean()
        rs = avg_gain / avg_loss
        df["rsi_14"] = 100 - (100 / (1 + rs))

        # MACD (12,26,9) using pandas
        macd, macd_signal, macd_hist = compute_macd(df["Close"])
        df["macd"] = macd  # you can choose macd or hist; original used MACD line
        df["macd_signal"] = macd_signal
        df["macd_hist"] = macd_hist

        # ATR 14
        df["atr_14"] = compute_atr(df, length=14)

        # vol_sma_5
        df["vol_sma_5"] = df["Volume"].rolling(window=5, min_periods=3).mean()

        # daily_return, return_1d, return_5d
        df["daily_return"] = df["Close"].pct_change()
        df["return_1d"] = df["Close"].pct_change(1)
        df["return_5d"] = df["Close"].pct_change(5)

        # close_30_sma
        df["close_30_sma"] = df["Close"].rolling(window=30, min_periods=20).mean()

        # Bollinger Bands (lower band)
        bb_upper, bb_mid, bb_lower = compute_bb(df["Close"], length=20, std_mult=2.0)
        df["boll_ub"] = bb_upper
        df["boll_mb"] = bb_mid
        df["boll_lb"] = bb_lower

        # take last valid (non-NaN) row for each indicator
        last_idx = df.index.max()
        # find last row with non-null Close
        # use iloc to find last valid index for each series
        def last_valid_value(series: pd.Series):
            v = series.dropna()
            if v.empty:
                return None
            return v.iloc[-1]

        features = {
            "sma_20": last_valid_value(df["sma_20"]),
            "ema_10": last_valid_value(df["ema_10"]),
            "rsi_14": last_valid_value(df["rsi_14"]),
            "macd": last_valid_value(df["macd"]),           # MACD line
            "atr_14": last_valid_value(df["atr_14"]),
            "vol_sma_5": last_valid_value(df["vol_sma_5"]),
            "daily_return": last_valid_value(df["daily_return"]),
            "prev_close": None,
            "return_1d": last_valid_value(df["return_1d"]),
            "return_5d": last_valid_value(df["return_5d"]),
            "close_30_sma": last_valid_value(df["close_30_sma"]),
            "open": last_valid_value(df["Open"]),
            "boll_lb": last_valid_value(df["boll_lb"]),
        }

        # prev_close: previous valid Close value
        close_series = df["Close"].dropna()
        if len(close_series) >= 2:
            features["prev_close"] = close_series.iloc[-2]
        else:
            features["prev_close"] = None

        # Validate and convert to floats (or raise clear error)
        for k, v in features.items():
            if v is None or (isinstance(v, float) and (math.isnan(v) or math.isinf(v))):
                raise HTTPException(status_code=400, detail=f"Indicator '{k}' missing or NaN for {symbol}. (history_rows={len(df)})")

            features[k] = float(v)

        return features

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))


# =====================================================
#                     ROOT
# =====================================================
@app.get("/")
def root():
    return {"status": "running", "expected_features": feature_cols}


# =====================================================
#          ENDPOINT: GET INDICATORS + EXPLAIN
# =====================================================
@app.post("/predict_stock")
def predict_stock(req: dict):
    try:
        if "symbol" not in req:
            raise HTTPException(400, "Missing field: symbol")

        symbol = req["symbol"]

        # Fetch indicators
        features = fetch_indicators(symbol)

        # Model input
        X = np.array([features[f] for f in feature_cols]).reshape(1, -1)
        X_scaled = scaler.transform(X)
        dmat = xgb.DMatrix(X_scaled)

        # Prediction
        prediction = float(model.predict(dmat)[0])

        # SHAP values
        shap_vals = explainer.shap_values(X_scaled)

        # Ensure 1D numpy array
        if isinstance(shap_vals, list):
            shap_vals = shap_vals[0]

        shap_vals = np.array(shap_vals).flatten()

        # Net bullish/bearish force
        total_positive = float(np.sum(shap_vals[shap_vals > 0]))
        total_negative = float(np.sum(np.abs(shap_vals[shap_vals < 0])))

        net_strength = total_positive - total_negative

        # Verdict logic
        if net_strength > 0.2:
            verdict = "increase"
            confidence = "high" if net_strength > 0.5 else "medium"
        elif net_strength < -0.2:
            verdict = "decrease"
            confidence = "high" if net_strength < -0.5 else "medium"
        else:
            verdict = "neutral"
            confidence = "low"

        return {
            "symbol": symbol,
            "prediction": prediction,
            "verdict": verdict,
            "confidence": confidence,
            "net_strength": net_strength
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("get_data:app", host="127.0.0.1", port=1234, reload=False)
