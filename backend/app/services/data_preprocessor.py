import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import os
import yfinance as yf

class DataPreprocessor:
    def __init__(self, lookback=60):
        self.lookback = lookback
        self.scaler = MinMaxScaler(feature_range=(0, 1))

    def add_technical_indicators(self, df):
        """Adds SMA, RSI, and MACD technical indicators to the dataframe."""
        # Moving Averages
        df['SMA_20'] = df['Close'].rolling(window=20).mean()
        df['SMA_50'] = df['Close'].rolling(window=50).mean()

        # RSI
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))

        # MACD
        exp1 = df['Close'].ewm(span=12, adjust=False).mean()
        exp2 = df['Close'].ewm(span=26, adjust=False).mean()
        df['MACD'] = exp1 - exp2
        df['Signal_Line'] = df['MACD'].ewm(span=9, adjust=False).mean()

        return df.dropna()

    def load_data(self, file_path):
        """Loads stock data from CSV, adds indicators, and handles missing values."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        df = pd.read_csv(file_path)
        return self.process_dataframe(df)

    def process_dataframe(self, df):
        """Adds indicators and handles missing values for a given dataframe."""
        df = self.add_technical_indicators(df)
        df = df.ffill().bfill()
        return df

    def fetch_yfinance_data(self, ticker, period="2y"):
        """Fetches historical data from yfinance and processes it."""
        df = yf.download(ticker, period=period)
        if df.empty:
            return None
        
        # yfinance returns MultiIndex columns sometimes, flatten them
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
            
        df = df.reset_index()
        return self.process_dataframe(df)

    def preprocess(self, df, columns=['Close', 'SMA_20', 'SMA_50', 'RSI', 'MACD', 'Signal_Line']):
        """Normalizes data and creates sequences for LSTM using multiple features."""
        data = df[columns].values
        
        # Normalize
        scaled_data = self.scaler.fit_transform(data)
        
        X, y = [], []
        for i in range(self.lookback, len(scaled_data)):
            X.append(scaled_data[i-self.lookback:i, :])
            y.append(scaled_data[i, 0]) # Predicting 'Close' (index 0)
            
        X, y = np.array(X), np.array(y)
        
        return X, y

    def get_train_test_split(self, X, y, split_ratio=0.8):
        """Splits data into training and testing sets."""
        split = int(len(X) * split_ratio)
        X_train, X_test = X[:split], X[split:]
        y_train, y_test = y[:split], y[split:]
        
        return X_train, X_test, y_train, y_test

if __name__ == "__main__":
    # Example usage
    preprocessor = DataPreprocessor(lookback=60)
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
    
    for ticker in ["AAPL", "TSLA", "INFY"]:
        file_path = os.path.join(data_dir, f"{ticker}_data.csv")
        try:
            df = preprocessor.load_data(file_path)
            X, y = preprocessor.preprocess(df)
            X_train, X_test, y_train, y_test = preprocessor.get_train_test_split(X, y)
            
            print(f"--- {ticker} Preprocessing Complete ---")
            print(f"X_train shape: {X_train.shape}")
            print(f"y_train shape: {y_train.shape}")
            print(f"X_test shape: {X_test.shape}")
            print(f"y_test shape: {y_test.shape}\n")
        except Exception as e:
            print(f"Error processing {ticker}: {e}")
