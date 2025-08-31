from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import os
import time
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model', 'crop_model.pkl')
PORT = int(os.environ.get('PORT', 5001))
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

# Global variables
model = None
model_loaded = False
model_version = "1.0.0"

def load_model():
    """Load the trained ML model"""
    global model, model_loaded
    try:
        if os.path.exists(MODEL_PATH):
            with open(MODEL_PATH, 'rb') as f:
                model = pickle.load(f)
            model_loaded = True
            logger.info(f"Model loaded successfully from {MODEL_PATH}")
            return True
        else:
            logger.warning(f"Model file not found at {MODEL_PATH}")
            return False
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        return False

def predict_crop(features):
    """
    Make crop prediction using the loaded model
    
    Args:
        features (dict): Dictionary containing soil and climate parameters
        
    Returns:
        dict: Prediction result with crop and confidence
    """
    if not model_loaded:
        raise Exception("Model not loaded")
    
    try:
        # Extract features in the correct order
        feature_names = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
        feature_values = [features[name] for name in feature_names]
        
        # Convert to numpy array and reshape
        X = np.array(feature_values).reshape(1, -1)
        
        # Make prediction
        prediction = model.predict(X)[0]
        
        # Get prediction probabilities if available
        try:
            probabilities = model.predict_proba(X)[0]
            confidence_score = max(probabilities)
            
            # Map confidence score to confidence level
            if confidence_score >= 0.8:
                confidence = "High"
            elif confidence_score >= 0.6:
                confidence = "Medium"
            else:
                confidence = "Low"
        except:
            confidence_score = 0.85
            confidence = "High"
        
        # Get alternative crops if possible
        alternative_crops = []
        try:
            # Get top 3 predictions
            top_indices = np.argsort(probabilities)[-3:][::-1]
            crop_classes = model.classes_
            
            for idx in top_indices[1:]:  # Skip the top prediction
                if probabilities[idx] > 0.1:  # Only include if probability > 10%
                    alt_confidence = "High" if probabilities[idx] >= 0.8 else "Medium" if probabilities[idx] >= 0.6 else "Low"
                    alternative_crops.append({
                        "crop": crop_classes[idx],
                        "confidence": alt_confidence,
                        "confidence_score": float(probabilities[idx])
                    })
        except:
            pass
        
        return {
            "crop": prediction,
            "confidence": confidence,
            "confidence_score": float(confidence_score),
            "alternative_crops": alternative_crops,
            "reasoning": f"Based on soil analysis: N={features['N']}, P={features['P']}, K={features['K']}, pH={features['ph']}, and climate conditions: temperature={features['temperature']}°C, humidity={features['humidity']}%, rainfall={features['rainfall']}mm",
            "model_version": model_version,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise Exception(f"Prediction failed: {str(e)}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "crop-recommendation-ml",
        "model_loaded": model_loaded,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/status', methods=['GET'])
def status():
    """Service status endpoint"""
    return jsonify({
        "status": "running",
        "service": "crop-recommendation-ml",
        "version": model_version,
        "model_loaded": model_loaded,
        "model_path": MODEL_PATH,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Main prediction endpoint"""
    start_time = time.time()
    
    try:
        # Validate request
        if not request.is_json:
            return jsonify({"error": "Content-Type must be application/json"}), 400
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400
        
        # Validate data types and ranges
        try:
            features = {}
            for field in required_fields:
                value = float(data[field])
                
                # Range validation
                if field == 'N' and (value < 0 or value > 140):
                    return jsonify({"error": f"Invalid {field} value: must be between 0-140"}), 400
                elif field == 'P' and (value < 5 or value > 145):
                    return jsonify({"error": f"Invalid {field} value: must be between 5-145"}), 400
                elif field == 'K' and (value < 5 or value > 205):
                    return jsonify({"error": f"Invalid {field} value: must be between 5-205"}), 400
                elif field == 'temperature' and (value < 8.8 or value > 43.7):
                    return jsonify({"error": f"Invalid {field} value: must be between 8.8-43.7"}), 400
                elif field == 'humidity' and (value < 14 or value > 100):
                    return jsonify({"error": f"Invalid {field} value: must be between 14-100"}), 400
                elif field == 'ph' and (value < 3.5 or value > 10.0):
                    return jsonify({"error": f"Invalid {field} value: must be between 3.5-10.0"}), 400
                elif field == 'rainfall' and (value < 20 or value > 300):
                    return jsonify({"error": f"Invalid {field} value: must be between 20-300"}), 400
                
                features[field] = value
                
        except ValueError:
            return jsonify({"error": "All parameters must be valid numbers"}), 400
        
        # Validate location data if provided
        location_info = {}
        if 'latitude' in data and 'longitude' in data:
            try:
                lat = float(data['latitude'])
                lng = float(data['longitude'])
                
                if lat < -90 or lat > 90:
                    return jsonify({"error": "Latitude must be between -90 and 90 degrees"}), 400
                if lng < -180 or lng > 180:
                    return jsonify({"error": "Longitude must be between -180 and 180 degrees"}), 400
                
                location_info = {
                    'latitude': lat,
                    'longitude': lng
                }
                
            except ValueError:
                return jsonify({"error": "Latitude and longitude must be valid numbers"}), 400
        
        # Check if model is loaded
        if not model_loaded:
            return jsonify({"error": "ML model is not loaded"}), 503
        
        # Make prediction
        result = predict_crop(features)
        processing_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        # Add location information to reasoning if available
        if location_info:
            location_reasoning = f" Location: {location_info['latitude']:.6f}°N, {location_info['longitude']:.6f}°E."
            result["reasoning"] += location_reasoning
            result["location"] = location_info
        
        # Add processing time to result
        result["processing_time_ms"] = round(processing_time, 2)
        
        logger.info(f"Prediction successful: {result['crop']} (confidence: {result['confidence']})")
        return jsonify(result)
        
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        logger.error(f"Prediction failed: {str(e)}")
        
        return jsonify({
            "error": str(e),
            "processing_time_ms": round(processing_time, 2),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/reload', methods=['POST'])
def reload_model():
    """Reload the ML model"""
    try:
        success = load_model()
        if success:
            return jsonify({
                "message": "Model reloaded successfully",
                "model_loaded": model_loaded,
                "timestamp": datetime.now().isoformat()
            })
        else:
            return jsonify({
                "error": "Failed to reload model"
            }), 500
    except Exception as e:
        return jsonify({
            "error": f"Error reloading model: {str(e)}"
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    # Load model on startup
    logger.info("Starting Crop Recommendation ML Service...")
    load_model()
    
    if not model_loaded:
        logger.warning("Model not loaded. Service will start but predictions will fail.")
    
    # Start the Flask app
    app.run(
        host='0.0.0.0',
        port=PORT,
        debug=DEBUG
    )
