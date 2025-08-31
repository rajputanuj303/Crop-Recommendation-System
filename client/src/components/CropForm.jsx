import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaSeedling, FaCloudSunRain, FaInfoCircle } from 'react-icons/fa';

const CropForm = ({ onSubmit, loading, latitude, longitude, onLocationChange, weather, weatherLoading, weatherError }) => {
  const [formData, setFormData] = useState({
    N: '',
    P: '',
    K: '',
    temperature: '',
    humidity: '',
    ph: '',
    rainfall: '',
    latitude: latitude || '',
    longitude: longitude || '',
    locationName: ''
  });

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    setFormData((prev) => ({ ...prev, latitude: latitude || '', longitude: longitude || '' }));
  }, [latitude, longitude]);

  useEffect(() => {
    if (weather && !weatherLoading && !weatherError) {
      setFormData((prev) => ({
        ...prev,
        temperature: weather.temperature || '',
        humidity: weather.humidity || '',
        rainfall: weather.rainfall || ''
      }));
    }
  }, [weather, weatherLoading, weatherError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if ((name === 'latitude' || name === 'longitude') && onLocationChange) {
      onLocationChange({
        latitude: name === 'latitude' ? value : formData.latitude,
        longitude: name === 'longitude' ? value : formData.longitude
      });
    }
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
        setLocationLoading(false);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access was denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred while getting location.';
        }
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate location data
    if (!formData.latitude || !formData.longitude) {
      setLocationError('Please provide location coordinates (use GPS or enter manually)');
      return;
    }

    // Validate coordinate ranges
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (lat < -90 || lat > 90) {
      setLocationError('Latitude must be between -90 and 90 degrees');
      return;
    }

    if (lng < -180 || lng > 180) {
      setLocationError('Longitude must be between -180 and 180 degrees');
      return;
    }

    setLocationError('');
    onSubmit(formData);
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl p-8 border border-green-100 animate-fade-in">
      <h2 className="text-3xl font-extrabold text-green-700 mb-8 text-center flex items-center justify-center gap-2">
        <FaSeedling className="text-green-500" /> Crop Recommendation
      </h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        {weatherLoading && (
          <div className="mb-4 text-blue-700 text-center text-sm">Fetching weather data for your location...</div>
        )}
        {weatherError && (
          <div className="mb-4 text-red-600 text-center text-sm">{weatherError}</div>
        )}
        {/* Location Section */}
        <div className="bg-green-50 rounded-xl p-6 shadow-sm border border-green-100 mb-2">
          <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
            <FaMapMarkerAlt className="text-green-400" /> Location Information
          </h3>
          {/* GPS Button */}
          <div className="mb-4">
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={locationLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2 shadow-md"
            >
              {locationLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Getting Location...
                </>
              ) : (
                <>
                  <FaMapMarkerAlt className="w-5 h-5 mr-2" />
                  Use Current GPS Location
                </>
              )}
            </button>
          </div>
          {/* Manual Location Input */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1 flex items-center gap-1">
                Latitude <FaInfoCircle title="-90 to 90" className="text-gray-400" />
              </label>
              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                required
                step="0.000001"
                className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition shadow-sm"
                placeholder="-90 to 90"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-700 mb-1 flex items-center gap-1">
                Longitude <FaInfoCircle title="-180 to 180" className="text-gray-400" />
              </label>
              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                required
                step="0.000001"
                className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition shadow-sm"
                placeholder="-180 to 180"
              />
            </div>
          </div>
          {/* Location Name (Optional) */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-green-700 mb-1">
              Location Name (Optional)
            </label>
            <input
              type="text"
              name="locationName"
              value={formData.locationName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 transition shadow-sm"
              placeholder="e.g., Farm Field, Garden Plot"
            />
          </div>
          {/* Location Error Display */}
          {locationError && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
              {locationError}
            </div>
          )}
        </div>
        {/* Soil Parameters Section */}
        <div className="bg-yellow-50 rounded-xl p-6 shadow-sm border border-yellow-100 mb-2">
          <h3 className="text-lg font-bold text-yellow-700 mb-4 flex items-center gap-2">
            <FaSeedling className="text-yellow-500" /> Soil Parameters
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-yellow-700 mb-1 flex items-center gap-1">
                Nitrogen (N)
                <FaInfoCircle title="kg/ha (0-140)" className="text-gray-400" />
              </label>
              <input
                type="number"
                name="N"
                value={formData.N}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition shadow-sm"
                placeholder="0-140"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-yellow-700 mb-1 flex items-center gap-1">
                Phosphorus (P)
                <FaInfoCircle title="kg/ha (5-145)" className="text-gray-400" />
              </label>
              <input
                type="number"
                name="P"
                value={formData.P}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition shadow-sm"
                placeholder="5-145"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-yellow-700 mb-1 flex items-center gap-1">
                Potassium (K)
                <FaInfoCircle title="kg/ha (5-205)" className="text-gray-400" />
              </label>
              <input
                type="number"
                name="K"
                value={formData.K}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition shadow-sm"
                placeholder="5-205"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-yellow-700 mb-1 flex items-center gap-1">
                pH Level
                <FaInfoCircle title="3.5-10.0" className="text-gray-400" />
              </label>
              <input
                type="number"
                name="ph"
                value={formData.ph}
                onChange={handleChange}
                required
                step="0.1"
                className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition shadow-sm"
                placeholder="3.5-10.0"
              />
            </div>
          </div>
        </div>
        {/* Climate Parameters Section */}
        <div className="bg-blue-50 rounded-xl p-6 shadow-sm border border-blue-100 mb-2">
          <h3 className="text-lg font-bold text-blue-700 mb-4 flex items-center gap-2">
            <FaCloudSunRain className="text-blue-400" /> Climate Parameters
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center gap-1">
                Temperature (°C)
                <FaInfoCircle title="8.8-43.7" className="text-gray-400" />
              </label>
              <input
                type="number"
                name="temperature"
                value={formData.temperature}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition shadow-sm"
                placeholder="8.8-43.7"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center gap-1">
                Humidity (%)
                <FaInfoCircle title="14-100" className="text-gray-400" />
              </label>
              <input
                type="number"
                name="humidity"
                value={formData.humidity}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition shadow-sm"
                placeholder="14-100"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center gap-1">
                Rainfall (mm)
                <FaInfoCircle title="20-300" className="text-gray-400" />
              </label>
              <input
                type="number"
                name="rainfall"
                value={formData.rainfall}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition shadow-sm"
                placeholder="20-300"
              />
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-blue-600 focus:ring-4 focus:ring-green-200 font-bold text-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Getting Recommendation...
            </>
          ) : (
            <>
              <FaSeedling className="w-5 h-5 mr-2" /> Get Recommendation
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CropForm;
