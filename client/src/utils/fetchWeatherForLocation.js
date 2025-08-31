import { getWeatherData } from '../utils/weatherApi';

export const fetchWeatherForLocation = async (latitude, longitude, setWeather, setWeatherLoading, setWeatherError) => {
  setWeatherLoading(true);
  setWeatherError('');
  try {
    const weather = await getWeatherData(latitude, longitude);
    setWeather(weather);
  } catch (err) {
    setWeatherError(err.message || 'Unable to fetch weather data.');
  } finally {
    setWeatherLoading(false);
  }
};
