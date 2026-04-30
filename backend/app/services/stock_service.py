import yfinance as yf
import pandas as pd
import os
from datetime import datetime, timedelta

def fetch_stock_data(tickers, period="5y"):
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
    
    for ticker in tickers:
        print(f"Fetching data for {ticker}...")
        stock = yf.Ticker(ticker)
        df = stock.history(period=period)
        
        file_path = os.path.join(data_dir, f"{ticker}_data.csv")
        df.to_csv(file_path)
        print(f"Saved {ticker} data to {file_path}")

if __name__ == "__main__":
    stock_tickers = ["AAPL", "TSLA", "INFY"]
    fetch_stock_data(stock_tickers)
