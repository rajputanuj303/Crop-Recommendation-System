const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

/**
 * Call the Python ML service to get crop recommendation
 * @param {Object} soilData - Soil and climate parameters
 * @returns {Promise<Object>} ML service response
 */
const callMLService = async (soilData) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, soilData, {
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    console.error('ML Service API call failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      throw new Error('ML service is not running. Please start the Python service.');
    }
    
    if (error.response) {
      // Server responded with error status
      throw new Error(`ML service error: ${error.response.data.message || error.response.statusText}`);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('ML service is not responding. Please check if the service is running.');
    } else {
      // Something else happened
      throw new Error(`ML service error: ${error.message}`);
    }
  }
};

/**
 * Health check for ML service
 * @returns {Promise<boolean>} Service health status
 */
const checkMLServiceHealth = async () => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, {
      timeout: 5000, // 5 seconds timeout
    });
    return response.status === 200;
  } catch (error) {
    console.error('ML Service health check failed:', error.message);
    return false;
  }
};

/**
 * Get ML service status and version
 * @returns {Promise<Object>} Service status information
 */
const getMLServiceStatus = async () => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/status`, {
      timeout: 5000,
    });
    return response.data;
  } catch (error) {
    console.error('ML Service status check failed:', error.message);
    return {
      status: 'unavailable',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = {
  callMLService,
  checkMLServiceHealth,
  getMLServiceStatus,
};
