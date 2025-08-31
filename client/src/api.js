const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// API functions
export const getCropRecommendation = async (soilData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/crops/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...soilData,
        // Include location data if available
        location: soilData.latitude && soilData.longitude ? {
          latitude: parseFloat(soilData.latitude),
          longitude: parseFloat(soilData.longitude),
          name: soilData.locationName || ''
        } : undefined
      }),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error getting crop recommendation:', error);
    throw error;
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const getRecommendationHistory = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/crops/history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error getting recommendation history:', error);
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};
