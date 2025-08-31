#!/usr/bin/env python3
"""
Test script for the Crop Recommendation ML Service
This script tests the API endpoints and model functionality
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:5001"
TEST_DATA = {
    "N": 80,
    "P": 40,
    "K": 30,
    "temperature": 25,
    "humidity": 70,
    "ph": 6.5,
    "rainfall": 150
}

def test_health_endpoint():
    """Test the health check endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data['status']}")
            print(f"   Model loaded: {data['model_loaded']}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check error: {e}")
        return False

def test_status_endpoint():
    """Test the status endpoint"""
    print("\n🔍 Testing status endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/status", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Status check passed")
            print(f"   Service: {data['service']}")
            print(f"   Version: {data['version']}")
            print(f"   Model loaded: {data['model_loaded']}")
            return True
        else:
            print(f"❌ Status check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Status check error: {e}")
        return False

def test_prediction_endpoint():
    """Test the prediction endpoint"""
    print("\n🔍 Testing prediction endpoint...")
    try:
        response = requests.post(
            f"{BASE_URL}/predict",
            json=TEST_DATA,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Prediction successful!")
            print(f"   Recommended crop: {data['crop']}")
            print(f"   Confidence: {data['confidence']}")
            print(f"   Processing time: {data.get('processing_time_ms', 'N/A')}ms")
            
            if 'alternative_crops' in data and data['alternative_crops']:
                print(f"   Alternative crops: {len(data['alternative_crops'])} found")
            
            return True
        else:
            print(f"❌ Prediction failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('error', 'Unknown error')}")
            except:
                print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Prediction error: {e}")
        return False

def test_invalid_data():
    """Test with invalid data"""
    print("\n🔍 Testing invalid data handling...")
    
    # Test missing fields
    invalid_data = {"N": 80, "P": 40}  # Missing required fields
    try:
        response = requests.post(
            f"{BASE_URL}/predict",
            json=invalid_data,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        
        if response.status_code == 400:
            print("✅ Invalid data handling: Missing fields correctly rejected")
            return True
        else:
            print(f"❌ Invalid data handling failed: Expected 400, got {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Invalid data test error: {e}")
        return False

def test_model_reload():
    """Test model reload endpoint"""
    print("\n🔍 Testing model reload endpoint...")
    try:
        response = requests.post(f"{BASE_URL}/reload", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Model reload successful: {data['message']}")
            return True
        else:
            print(f"❌ Model reload failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Model reload error: {e}")
        return False

def main():
    """Run all tests"""
    print("🌾 Crop Recommendation ML Service - Test Suite")
    print("=" * 50)
    
    # Check if service is running
    print("🚀 Checking if ML service is running...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=2)
        print("✅ ML service is running!")
    except requests.exceptions.RequestException:
        print("❌ ML service is not running. Please start it first.")
        print("   Run: cd ml-service && python app.py")
        return
    
    # Run tests
    tests = [
        test_health_endpoint,
        test_status_endpoint,
        test_prediction_endpoint,
        test_invalid_data,
        test_model_reload
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        time.sleep(1)  # Small delay between tests
    
    # Summary
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! ML service is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the service configuration.")
    
    print("\n💡 Next steps:")
    print("   1. Start the backend server: cd server && npm run dev")
    print("   2. Start the frontend: cd client && npm run dev")
    print("   3. Open http://localhost:3000 in your browser")

if __name__ == "__main__":
    main()
