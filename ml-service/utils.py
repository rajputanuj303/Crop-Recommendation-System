import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

def create_dummy_model():
    """
    Create a dummy model for testing purposes when no trained model is available.
    This function creates a simple Random Forest classifier with sample data.
    """
    try:
        # Create sample data for demonstration
        np.random.seed(42)
        n_samples = 1000
        
        # Generate synthetic soil and climate data
        N = np.random.uniform(0, 140, n_samples)
        P = np.random.uniform(5, 145, n_samples)
        K = np.random.uniform(5, 205, n_samples)
        temperature = np.random.uniform(8.8, 43.7, n_samples)
        humidity = np.random.uniform(14, 100, n_samples)
        ph = np.random.uniform(3.5, 10.0, n_samples)
        rainfall = np.random.uniform(20, 300, n_samples)
        
        # Create feature matrix
        X = np.column_stack([N, P, K, temperature, humidity, ph, rainfall])
        
        # Create synthetic labels (crop types)
        crops = ['rice', 'wheat', 'maize', 'chickpea', 'kidneybeans', 'pigeonpeas',
                'mothbeans', 'mungbean', 'blackgram', 'lentil', 'pomegranate',
                'banana', 'mango', 'grapes', 'watermelon', 'muskmelon', 'apple',
                'orange', 'papaya', 'coconut', 'cotton', 'jute', 'coffee']
        
        # Simple rule-based labeling for demonstration
        y = []
        for i in range(n_samples):
            if N[i] > 70 and P[i] > 40 and temperature[i] > 25:
                y.append('rice')
            elif P[i] > 60 and K[i] > 100 and temperature[i] < 20:
                y.append('wheat')
            elif N[i] > 80 and rainfall[i] > 150:
                y.append('maize')
            elif ph[i] > 7.0 and temperature[i] > 30:
                y.append('cotton')
            else:
                y.append(np.random.choice(crops))
        
        # Train a simple Random Forest classifier
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X, y)
        
        return model
        
    except Exception as e:
        print(f"Error creating dummy model: {e}")
        return None

def save_model(model, filepath):
    """
    Save a trained model to disk
    
    Args:
        model: Trained scikit-learn model
        filepath (str): Path where to save the model
    """
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # Save the model
        joblib.dump(model, filepath)
        print(f"Model saved successfully to {filepath}")
        return True
        
    except Exception as e:
        print(f"Error saving model: {e}")
        return False

def load_model(filepath):
    """
    Load a trained model from disk
    
    Args:
        filepath (str): Path to the saved model
        
    Returns:
        Loaded model or None if loading fails
    """
    try:
        model = joblib.load(filepath)
        print(f"Model loaded successfully from {filepath}")
        return model
        
    except Exception as e:
        print(f"Error loading model: {e}")
        return None

def validate_input_data(data):
    """
    Validate input data for crop prediction
    
    Args:
        data (dict): Input data dictionary
        
    Returns:
        tuple: (is_valid, error_message)
    """
    required_fields = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
    
    # Check required fields
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
    
    # Check data types and ranges
    try:
        N = float(data['N'])
        P = float(data['P'])
        K = float(data['K'])
        temperature = float(data['temperature'])
        humidity = float(data['humidity'])
        ph = float(data['ph'])
        rainfall = float(data['rainfall'])
        
        # Range validation
        if not (0 <= N <= 140):
            return False, "Nitrogen (N) must be between 0-140 kg/ha"
        if not (5 <= P <= 145):
            return False, "Phosphorus (P) must be between 5-145 kg/ha"
        if not (5 <= K <= 205):
            return False, "Potassium (K) must be between 5-205 kg/ha"
        if not (8.8 <= temperature <= 43.7):
            return False, "Temperature must be between 8.8-43.7°C"
        if not (14 <= humidity <= 100):
            return False, "Humidity must be between 14-100%"
        if not (3.5 <= ph <= 10.0):
            return False, "pH must be between 3.5-10.0"
        if not (20 <= rainfall <= 300):
            return False, "Rainfall must be between 20-300 mm"
            
        return True, "Data validation successful"
        
    except ValueError:
        return False, "All parameters must be valid numbers"

def preprocess_data(data):
    """
    Preprocess input data for model prediction
    
    Args:
        data (dict): Raw input data
        
    Returns:
        numpy.ndarray: Preprocessed feature array
    """
    try:
        # Extract features in the correct order
        feature_names = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
        feature_values = [float(data[name]) for name in feature_names]
        
        # Convert to numpy array and reshape
        X = np.array(feature_values).reshape(1, -1)
        
        return X
        
    except Exception as e:
        print(f"Error preprocessing data: {e}")
        return None

def get_crop_info(crop_name):
    """
    Get information about a specific crop
    
    Args:
        crop_name (str): Name of the crop
        
    Returns:
        dict: Crop information
    """
    crop_info = {
        'rice': {
            'description': 'Rice is a cereal grain and the most important staple food for a large part of the world population.',
            'optimal_temp': '20-35°C',
            'optimal_ph': '5.5-6.5',
            'water_requirement': 'High',
            'season': 'Monsoon'
        },
        'wheat': {
            'description': 'Wheat is a cereal grain that is a worldwide staple food.',
            'optimal_temp': '15-25°C',
            'optimal_ph': '6.0-7.5',
            'water_requirement': 'Medium',
            'season': 'Winter'
        },
        'maize': {
            'description': 'Maize, also known as corn, is a cereal grain first domesticated by indigenous peoples in Mexico.',
            'optimal_temp': '18-32°C',
            'optimal_ph': '5.5-7.5',
            'water_requirement': 'High',
            'season': 'Summer'
        },
        'cotton': {
            'description': 'Cotton is a soft, fluffy staple fiber that grows in a boll around the seeds of cotton plants.',
            'optimal_temp': '25-35°C',
            'optimal_ph': '5.5-8.5',
            'water_requirement': 'Medium',
            'season': 'Summer'
        }
    }
    
    return crop_info.get(crop_name.lower(), {
        'description': 'Information not available for this crop.',
        'optimal_temp': 'N/A',
        'optimal_ph': 'N/A',
        'water_requirement': 'N/A',
        'season': 'N/A'
    })
