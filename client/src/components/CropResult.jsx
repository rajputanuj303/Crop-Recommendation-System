import React from 'react';

const CropResult = ({ result, onReset }) => {
  if (!result) return null;

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 mt-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Recommended Crop
        </h3>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <span className="text-2xl font-bold text-green-700">
            {result.crop}
          </span>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          <p>Confidence: <span className="font-medium">{result.confidence || 'High'}</span></p>
          <p>Based on your soil and climate conditions</p>
        </div>

        {/* Location Information */}
        {result.location && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center justify-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Location
            </h4>
            <div className="text-xs text-blue-600">
              {result.location.name && (
                <p className="font-medium mb-1">{result.location.name}</p>
              )}
              <p>{result.location.latitude}°N, {result.location.longitude}°E</p>
            </div>
          </div>
        )}

        {/* Alternative Crops */}
        {result.alternativeCrops && result.alternativeCrops.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-medium text-yellow-700 mb-2">Alternative Crops</h4>
            <div className="space-y-1">
              {result.alternativeCrops.map((altCrop, index) => (
                <div key={index} className="text-xs text-yellow-600">
                  <span className="font-medium">{altCrop.crop}</span>
                  <span className="ml-2">({altCrop.confidence} confidence)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reasoning */}
        {result.reasoning && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-left">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Analysis</h4>
            <p className="text-xs text-gray-600 leading-relaxed">{result.reasoning}</p>
          </div>
        )}

        {/* Input Parameters */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Input Parameters:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>N: {result.inputs?.N} kg/ha</div>
            <div>P: {result.inputs?.P} kg/ha</div>
            <div>K: {result.inputs?.K} kg/ha</div>
            <div>Temp: {result.inputs?.temperature}°C</div>
            <div>Humidity: {result.inputs?.humidity}%</div>
            <div>pH: {result.inputs?.ph}</div>
            <div>Rainfall: {result.inputs?.rainfall} mm</div>
          </div>
        </div>

        <button
          onClick={onReset}
          className="mt-4 w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200"
        >
          Get Another Recommendation
        </button>
      </div>
    </div>
  );
};

export default CropResult;
