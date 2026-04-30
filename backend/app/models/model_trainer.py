import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, GRU
import os
import numpy as np
from app.services.data_preprocessor import DataPreprocessor

class StockModel:
    def __init__(self, input_shape, model_type='LSTM'):
        self.input_shape = input_shape
        self.model_type = model_type
        self.model = self._build_model()

    def _build_model(self):
        model = Sequential()
        if self.model_type == 'LSTM':
            model.add(LSTM(units=50, return_sequences=True, input_shape=self.input_shape))
            model.add(Dropout(0.2))
            model.add(LSTM(units=50, return_sequences=False))
        else:
            model.add(GRU(units=50, return_sequences=True, input_shape=self.input_shape))
            model.add(Dropout(0.2))
            model.add(GRU(units=50, return_sequences=False))
            
        model.add(Dropout(0.2))
        model.add(Dense(units=25))
        model.add(Dense(units=1))
        
        model.compile(optimizer='adam', loss='mean_squared_error')
        return model

    def train(self, X_train, y_train, epochs=25, batch_size=32):
        self.model.fit(X_train, y_train, epochs=epochs, batch_size=batch_size, verbose=1)

    def save(self, path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        self.model.save(path)

if __name__ == "__main__":
    preprocessor = DataPreprocessor(lookback=60)
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
    save_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models")
    
    for ticker in ["AAPL", "TSLA", "INFY"]:
        file_path = os.path.join(data_dir, f"{ticker}_data.csv")
        try:
            df = preprocessor.load_data(file_path)
            X, y = preprocessor.preprocess(df)
            X_train, X_test, y_train, y_test = preprocessor.get_train_test_split(X, y)
            
            print(f"Training {ticker} model...")
            model = StockModel(input_shape=(X_train.shape[1], X_train.shape[2]))
            model.train(X_train, y_train, epochs=10) # Using 10 epochs for demo speed
            
            model_path = os.path.join(save_dir, f"{ticker}_model.h5")
            model.save(model_path)
            print(f"Saved {ticker} model to {model_path}")
            
        except Exception as e:
            print(f"Error training {ticker}: {e}")
