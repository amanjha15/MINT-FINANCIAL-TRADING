from fastapi import FastAPI, HTTPException
import requests
from datetime import datetime, timedelta
import pandas as pd
import traceback

app = FastAPI(
    title="News Sentiment API",
    description="Fetch recent news + sentiment from Alpha Vantage",
    version="2.0.0"
)

ALPHAVANTAGE_API_KEY = "XL7OPGV0RZA9XK06"


@app.post("/news_sentiment")
def news_sentiment(req: dict):
    try:
        if "symbol" not in req:
            raise HTTPException(400, "Missing field: symbol")

        symbol = req["symbol"].upper()

        today = datetime.utcnow().date()
        from_date = today - timedelta(days=5)

        url = "https://www.alphavantage.co/query"
        params = {
            "function": "NEWS_SENTIMENT",
            "tickers": symbol,
            "apikey": ALPHAVANTAGE_API_KEY,
            "sort": "LATEST"
        }

        response = requests.get(url, params=params)
        data = response.json()

        if "feed" not in data or not data["feed"]:
            return {
                "symbol": symbol,
                "message": "No recent news found",
                "articles": [],
                "daily_avg_sentiment": [],
                "overall_sentiment": {
                    "score": 0,
                    "label": "neutral",
                    "confidence": "low",
                    "verdict": "Not enough news to determine sentiment."
                }
            }

        # Convert to DataFrame
        df = pd.DataFrame(data["feed"])
        df["time_published"] = pd.to_datetime(df["time_published"])
        df["date"] = df["time_published"].dt.date

        # Filter last 5 days
        mask = (df["date"] >= from_date) & (df["date"] <= today)
        df = df.loc[mask]

        if df.empty:
            return {
                "symbol": symbol,
                "message": "No news in last 5 days",
                "articles": [],
                "daily_avg_sentiment": [],
                "overall_sentiment": {
                    "score": 0,
                    "label": "neutral",
                    "confidence": "low",
                    "verdict": "No recent sentiment activity detected."
                }
            }

        # Useful columns
        df = df[
            [
                "date",
                "title",
                "summary",
                "url",
                "overall_sentiment_label",
                "overall_sentiment_score"
            ]
        ].sort_values("date", ascending=False)

        # JSON articles
        articles_json = df.to_dict(orient="records")

        # Daily average sentiment
        sentiment_df = (
            df.groupby("date")["overall_sentiment_score"]
              .mean()
              .reset_index()
              .rename(columns={"overall_sentiment_score": "avg_sentiment"})
        )
        daily_avg_json = sentiment_df.to_dict(orient="records")

        # ============================================================
        #            COMPUTE OVERALL SENTIMENT SCORE
        # ============================================================

        overall_score = float(df["overall_sentiment_score"].mean())

        # Label based on score
        if overall_score > 0.2:
            label = "bullish"
        elif overall_score < -0.2:
            label = "bearish"
        else:
            label = "neutral"

        # Confidence (strength of sentiment)
        strength = abs(overall_score)
        if strength > 0.35:
            confidence = "high"
        elif strength > 0.15:
            confidence = "medium"
        else:
            confidence = "low"

        # AI-friendly verdict text
        if label == "bullish":
            verdict_text = "Recent news sentiment suggests upward/positive influence."
        elif label == "bearish":
            verdict_text = "Recent news sentiment suggests downward/negative influence."
        else:
            verdict_text = "News sentiment is mixed or neutral."

        return {
    "symbol": symbol,
    "summary_sentiment": {
        "label": label,
        "score": overall_score,
        "confidence": confidence,
        "verdict": verdict_text
    },
    "from_date": str(from_date),
    "to_date": str(today),
    "daily_avg_sentiment": daily_avg_json,
    "articles": articles_json
}


    except Exception as e:
        print("\n🔥 ERROR in /news_sentiment 🔥")
        print(traceback.format_exc())
        raise HTTPException(500, str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("news_server:app", host="127.0.0.1", port=9876, reload=False)
