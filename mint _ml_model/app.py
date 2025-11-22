from fastapi import FastAPI, HTTPException
import xgboost as xgb
import pickle
import numpy as np
import shap
import traceback

# ----------------- INIT APP FIRST -----------------
app = FastAPI()

# ----------------- LOAD SCALER + FEATURES -----------------
with open("scaler.pkl", "rb") as f:
    scaler = pickle.load(f)

# Get real feature count used during training
EXPECTED_FEATURES = scaler.n_features_in_

# Your original feature list (keep full list for mapping)
ALL_FEATURES = [
    "sma_20", "ema_10", "rsi_14", "macd", "atr_14",
    "vol_sma_5", "daily_return", "prev_close",
    "return_1d", "return_5d", "close_30_sma",
    "open", "boll_lb"
]

# Trim to correct number used when scaler was trained
feature_cols = ALL_FEATURES[:EXPECTED_FEATURES]

# ----------------- LOAD MODEL -----------------
model = xgb.Booster()
model.load_model("xgb_stock_model.json")

# ----------------- LOAD SHAP EXPLAINER -----------------
explainer = shap.TreeExplainer(model)

@app.get("/")
def root():
    return {"status": "Server Running ✅"}

@app.post("/explain")
def explain(data: dict):
    try:
        # Convert JSON → values
        X = np.array([data[f] for f in feature_cols]).reshape(1, -1)

        # Scale
        X_scaled = scaler.transform(X)

        # Convert to DMatrix
        dmat = xgb.DMatrix(X_scaled)

        # Prediction
        _ = model.predict(dmat)

        # SHAP
        shap_vals = explainer.shap_values(X_scaled)

        # Fix binary/multi output
        if isinstance(shap_vals, list):
            shap_vals = shap_vals[0]

        shap_vals = shap_vals[0]

        result = sorted(
            [
                {
                    "feature": feature_cols[i],
                    "value": float(X[0][i]),
                    "impact": float(shap_vals[i]),
                    "direction": "positive" if shap_vals[i] > 0 else "negative"
                }
                for i in range(len(feature_cols))
            ],
            key=lambda x: abs(x["impact"]),
            reverse=True
        )

        return {
            "message": "Technical explanation generated ✅",
            "features_used": feature_cols,
            "explanations": result
        }

    except Exception as e:
        print("\n🔥 FULL TRACEBACK 🔥\n")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
