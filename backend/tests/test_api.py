import unittest
from fastapi.testclient import TestClient

from app.main import app


class ApiIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.ticker = "AAPL"
        cls.headlines = [
            "Apple reports stronger than expected earnings.",
            "Analysts remain positive about Apple's product pipeline.",
        ]

    def test_root(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.json())

    def test_predict_lstm(self):
        response = self.client.post("/predict", json={"ticker": self.ticker, "model_type": "LSTM"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("predicted_price", data)
        self.assertIn("trend", data)

    def test_history(self):
        response = self.client.get(f"/history/{self.ticker}?days=10")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["dates"]), len(data["close_prices"]))
        self.assertGreater(len(data["dates"]), 0)

    def test_recommend(self):
        response = self.client.post(
            "/recommend",
            json={"ticker": self.ticker, "headlines": self.headlines},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn(data["signal"], ["Buy", "Sell", "Hold"])
        self.assertIn("confidence", data)
        self.assertIn("risk_score", data)

    def test_sentiment(self):
        response = self.client.post("/sentiment", json={"headlines": self.headlines})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("score", data)
        self.assertIn("sentiment", data)

    def test_portfolio(self):
        response = self.client.get("/portfolio")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("weights", data)
        self.assertIn("sharpe_ratio", data)

    def test_risk(self):
        response = self.client.post("/risk", json={"ticker": self.ticker})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("risk_level", data)
        self.assertIn("annualized_volatility", data)

    def test_simulate(self):
        response = self.client.post("/simulate", json={"ticker": self.ticker, "initial_capital": 10000})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("roi_percent", data)
        self.assertIn("total_trades", data)
        self.assertIn("growth_curve", data)


if __name__ == "__main__":
    unittest.main()
