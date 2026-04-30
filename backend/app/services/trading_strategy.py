class TradingStrategy:
    def __init__(self, risk_level="Moderate Risk"):
        self.risk_level = risk_level

    def generate_signal(self, current_price, predicted_price, rsi, macd, signal_line, risk_score=None, sentiment_score=0.0):
        """
        Generates a trading signal based on technical indicators and price predictions.
        """
        reasons = []
        confidence = 50
        
        # Price Trend
        price_diff_pct = (predicted_price - current_price) / current_price
        trend_up = price_diff_pct > 0
        
        # RSI Rules
        oversold = rsi < 30
        overbought = rsi > 70
        
        # MACD Rules
        macd_cross_up = macd > signal_line
        macd_cross_down = macd < signal_line
        
        # Logic based on User Requirements
        signal = "Hold"
        
        if trend_up and self.risk_level == "Low Risk":
            signal = "Buy"
            reasons.append("Bullish prediction coupled with low volatility risk.")
            confidence += 30
        elif not trend_up and self.risk_level == "High Risk":
            signal = "Sell"
            reasons.append("Bearish prediction coupled with high volatility risk.")
            confidence += 30
        else:
            signal = "Hold"
            if trend_up:
                reasons.append(f"Bullish prediction but risk level is {self.risk_level}, maintaining Hold.")
            else:
                reasons.append(f"Bearish prediction but risk level is {self.risk_level}, maintaining Hold.")

        # Technical Indicator Overlays (Add to confidence but don't change signal)
        if (oversold or macd_cross_up) and signal == "Buy":
            confidence += 15
            reasons.append("Bullish technical indicators confirm the signal.")
        if (overbought or macd_cross_down) and signal == "Sell":
            confidence += 15
            reasons.append("Bearish technical indicators confirm the signal.")

        # Risk Adjustment
        if self.risk_level == "High Risk":
            confidence -= 10
        elif self.risk_level == "Low Risk":
            confidence += 10

        # Fine-grained risk score adjustment (0-100, higher means riskier)
        if risk_score is not None:
            if risk_score > 70:
                confidence -= 10
                reasons.append("High risk score reduced conviction.")
            elif risk_score < 35:
                confidence += 5
                reasons.append("Low risk score improved conviction.")

        # Sentiment adjustment (-1 to +1)
        if sentiment_score > 0.2:
            confidence += 5
            reasons.append("Positive market sentiment supports bullish bias.")
        elif sentiment_score < -0.2:
            confidence -= 5
            reasons.append("Negative market sentiment increases caution.")
            
        confidence = min(max(confidence, 0), 100)
        
        return {
            "signal": signal,
            "reason": " ".join(reasons),
            "confidence": f"{confidence}%"
        }

if __name__ == "__main__":
    strategy = TradingStrategy(risk_level="Moderate Risk")
    
    # Example Input
    test_case = {
        "current_price": 150.0,
        "predicted_price": 155.0,
        "rsi": 25.0,
        "macd": 0.5,
        "signal_line": 0.2
    }
    
    result = strategy.generate_signal(**test_case)
    print("--- Trading Signal ---")
    print(f"Signal: {result['signal']}")
    print(f"Reason: {result['reason']}")
    print(f"Confidence: {result['confidence']}")
