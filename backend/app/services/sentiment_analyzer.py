from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

class StockSentimentAnalyzer:
    def __init__(self):
        self.analyzer = SentimentIntensityAnalyzer()

    def analyze_text(self, text):
        """
        Analyzes the sentiment of a given text (e.g., news headline).
        Returns sentiment category and compound score.
        """
        scores = self.analyzer.polarity_scores(text)
        compound = scores['compound']
        
        if compound >= 0.05:
            sentiment = "Positive"
        elif compound <= -0.05:
            sentiment = "Negative"
        else:
            sentiment = "Neutral"
            
        return {
            "sentiment": sentiment,
            "score": compound,
            "details": scores
        }

    def analyze_headlines(self, headlines):
        """
        Analyzes a list of headlines and returns the average sentiment score.
        """
        if not headlines:
            return {"sentiment": "Neutral", "score": 0.0}
            
        total_score = 0
        for headline in headlines:
            result = self.analyze_text(headline)
            total_score += result['score']
            
        avg_score = total_score / len(headlines)
        
        if avg_score >= 0.05:
            sentiment = "Positive"
        elif avg_score <= -0.05:
            sentiment = "Negative"
        else:
            sentiment = "Neutral"
            
        return {
            "sentiment": sentiment,
            "score": round(avg_score, 4)
        }

    def get_ticker_sentiment(self, ticker):
        """
        Generates a pseudo-random but consistent sentiment for a ticker.
        Useful when no live headlines are available.
        """
        import random
        random.seed(sum(ord(c) for c in ticker))
        
        # Generate a score between -0.6 and 0.8
        score = round(random.uniform(-0.4, 0.7), 4)
        
        if score >= 0.1:
            sentiment = "Positive"
        elif score <= -0.1:
            sentiment = "Negative"
        else:
            sentiment = "Neutral"
            
        return {
            "ticker": ticker,
            "sentiment": sentiment,
            "score": score,
            "simulated": True
        }

if __name__ == "__main__":
    analyzer = StockSentimentAnalyzer()
    
    # Example News
    news_items = [
        "Apple reports record-breaking quarterly earnings, beating expectations.",
        "Tesla stock plunges as supply chain issues persist.",
        "Infosys signs major cloud transformation deal with European bank.",
        "Market remains cautious ahead of Federal Reserve meeting."
    ]
    
    print("--- News Sentiment Analysis ---")
    for news in news_items:
        res = analyzer.analyze_text(news)
        print(f"[{res['sentiment']}] (Score: {res['score']}) : {news}")
        
    print("\n--- Overall Portfolio Sentiment ---")
    overall = analyzer.analyze_headlines(news_items)
    print(f"Overall Sentiment: {overall['sentiment']} (Average Score: {overall['score']})")
