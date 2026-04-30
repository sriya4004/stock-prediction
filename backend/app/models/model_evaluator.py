import tensorflow as tf
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.metrics import mean_squared_error, mean_absolute_error
import os
from app.services.data_preprocessor import DataPreprocessor

class ModelEvaluator:
    def __init__(self, ticker):
        self.ticker = ticker
        self.preprocessor = DataPreprocessor(lookback=60)
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
        self.model_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models")
        self.model_path = os.path.join(self.model_dir, f"{ticker}_model.h5")
        
    def evaluate(self):
        # Load data
        file_path = os.path.join(self.data_dir, f"{self.ticker}_data.csv")
        df = self.preprocessor.load_data(file_path)
        X, y = self.preprocessor.preprocess(df)
        _, X_test, _, y_test = self.preprocessor.get_train_test_split(X, y)
        
        # Load model
        model = tf.keras.models.load_model(self.model_path)
        
        # Predict
        predictions = model.predict(X_test)
        
        # Inverse Scaling
        # We need a dummy matrix to inverse scale only the 'Close' column
        n_features = X_test.shape[2]
        
        # Dummy matrix for predictions
        pred_dummy = np.zeros((len(predictions), n_features))
        pred_dummy[:, 0] = predictions[:, 0]
        inv_predictions = self.preprocessor.scaler.inverse_transform(pred_dummy)[:, 0]
        
        # Dummy matrix for actual values
        test_dummy = np.zeros((len(y_test), n_features))
        test_dummy[:, 0] = y_test
        inv_y_test = self.preprocessor.scaler.inverse_transform(test_dummy)[:, 0]
        
        # Metrics
        rmse = np.sqrt(mean_squared_error(inv_y_test, inv_predictions))
        mae = mean_absolute_error(inv_y_test, inv_predictions)
        
        print(f"--- {self.ticker} Evaluation ---")
        print(f"RMSE: {rmse:.2f}")
        print(f"MAE: {mae:.2f}")
        
        # Plotting
        plt.figure(figsize=(12, 6))
        plt.plot(inv_y_test, label="Actual Price", color='blue')
        plt.plot(inv_predictions, label="Predicted Price", color='red', linestyle='--')
        plt.title(f"{self.ticker} Stock Price Prediction")
        plt.xlabel("Time")
        plt.ylabel("Price")
        plt.legend()
        
        plot_path = os.path.join(self.model_dir, f"{self.ticker}_evaluation.png")
        plt.savefig(plot_path)
        print(f"Plot saved to {plot_path}")
        plt.close()

if __name__ == "__main__":
    for ticker in ["AAPL", "TSLA", "INFY"]:
        try:
            evaluator = ModelEvaluator(ticker)
            evaluator.evaluate()
        except Exception as e:
            print(f"Error evaluating {ticker}: {e}")
