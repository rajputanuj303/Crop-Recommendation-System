import React, { useState, useEffect } from 'react';
import CropForm from '../components/CropForm';
import CropResult from '../components/CropResult';
import MapView from '../components/MapView';
import { getCropRecommendation } from '../api';
import { fetchWeatherForLocation } from '../utils/fetchWeatherForLocation';

const Home = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState({ latitude: '', longitude: '' });
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  useEffect(() => {
    if (location.latitude && location.longitude) {
      fetchWeatherForLocation(
        location.latitude,
        location.longitude,
        setWeather,
        setWeatherLoading,
        setWeatherError
      );
    }
  }, [location.latitude, location.longitude]);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      const recommendation = await getCropRecommendation(formData);
      setResult({
        crop: recommendation.crop,
        confidence: recommendation.confidence,
        confidenceScore: recommendation.confidenceScore,
        alternativeCrops: recommendation.alternativeCrops,
        reasoning: recommendation.reasoning,
        location: recommendation.location,
        inputs: formData
      });
    } catch (err) {
      setError(err.message || 'Failed to get recommendation');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex flex-col items-center py-8 px-2">
      <div className="w-full max-w-xl mx-auto flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-green-700 mb-2 text-center">
          🌱 Crop Recommendation
        </h1>
        <p className="text-base md:text-lg text-gray-700 mb-6 text-center max-w-md">
          Get the best crop suggestions for your field. Enter your soil and weather details, or use your location for a quick start.
        </p>
        <div className="w-full bg-white rounded-2xl shadow-lg p-4 md:p-8 mb-6">
          <CropForm
            onSubmit={handleSubmit}
            loading={loading}
            latitude={location.latitude}
            longitude={location.longitude}
            onLocationChange={setLocation}
            weather={weather}
            weatherLoading={weatherLoading}
            weatherError={weatherError}
          />
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3 text-center text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
        <div className="w-full mb-6">
          <h2 className="text-lg font-semibold text-green-700 mb-2 text-center">
            Select Your Location
          </h2>
          <div className="rounded-xl overflow-hidden shadow-md">
            <MapView
              setPosition={(pos) => setLocation({ latitude: pos.lat.toFixed(6), longitude: pos.lng.toFixed(6) })}
              position={location.latitude && location.longitude ? [parseFloat(location.latitude), parseFloat(location.longitude)] : null}
            />
          </div>
        </div>
        {result && (
          <div className="w-full bg-green-50 rounded-2xl shadow-lg p-6 mt-4">
            <CropResult result={result} onReset={handleReset} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
