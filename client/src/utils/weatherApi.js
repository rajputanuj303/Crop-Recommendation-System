// Weather API utility for fetching climate data based on location
// Note: You'll need to sign up for a free API key at https://openweathermap.org/api

const WEATHER_API_KEY = process.env.REACT_APP_WEATHER_API_KEY || 'b00c7a068f5d73ec6451ec3e81f592df';
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const getWeatherData = async (latitude, longitude) => {
  try {
    // Get current weather
    const weatherResponse = await fetch(
      `${WEATHER_BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`
    );
    
    if (!weatherResponse.ok) {
      throw new Error('Failed to fetch weather data');
    }
    
    const weatherData = await weatherResponse.json();
    
    // Get 5-day forecast for rainfall data
    const forecastResponse = await fetch(
      `${WEATHER_BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`
    );
    
    if (!forecastResponse.ok) {
      throw new Error('Failed to fetch forecast data');
    }
    
    const forecastData = await forecastResponse.json();
    
    // Calculate average rainfall for the next 5 days
    const rainfallData = forecastData.list.filter(item => item.rain && item.rain['3h']);
    const totalRainfall = rainfallData.reduce((sum, item) => sum + (item.rain['3h'] || 0), 0);
    const avgRainfall = rainfallData.length > 0 ? totalRainfall / rainfallData.length : 0;
    
    return {
      temperature: weatherData.main.temp,
      humidity: weatherData.main.humidity,
      rainfall: Math.round(avgRainfall * 10) / 10, // Convert to mm and round to 1 decimal
      description: weatherData.weather[0].description,
      location: weatherData.name,
      country: weatherData.sys.country
    };
    
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw new Error('Unable to fetch weather data. Please enter climate parameters manually.');
  }
};

export const getHistoricalWeatherData = async (latitude, longitude, days = 30) => {
  try {
    // Note: Historical data requires a paid subscription to OpenWeatherMap
    // This is a placeholder for future implementation
    console.log('Historical weather data requires paid subscription');
    return null;
  } catch (error) {
    console.error('Error fetching historical weather data:', error);
    return null;
  }
};
