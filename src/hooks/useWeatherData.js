import { useState, useEffect, useCallback, useRef } from 'react';
import { calculatePPI } from '../utils/ppiCalculator';
import { fetchCWAWeather, getWeatherAtTime } from '../api/cwaApi';

const LOCATIONS = {
  youth_park: {
    id: 'youth_park',
    name: '青年公園 Youth Park',
    nameEn: 'Youth Park',
    city: '台北市 Taipei',
    lat: 25.0227,
    lng: 121.5036,
    terrain: 'Sheltered / Urban',
    windFactor: 0.7,
    courtOrientation: 45,
    apiCode: 'F-D0047-061',
    district: '萬華區',
    description: '都市遮蔽，風力較低',
  },
  erchong: {
    id: 'erchong',
    name: '二重疏洪道 Erchong',
    nameEn: 'Erchong Floodway',
    city: '新北市 New Taipei',
    lat: 25.0594,
    lng: 121.4795,
    terrain: 'Riverside / Open',
    windFactor: 1.3,
    courtOrientation: 0,
    apiCode: 'F-D0047-069',
    district: '三重區',
    description: '河濱開放空間，風力較強',
  },
  tianmu: {
    id: 'tianmu',
    name: '天母公園 Tianmu Park',
    nameEn: 'Tianmu Park',
    city: '台北市 Taipei',
    lat: 25.1147,
    lng: 121.5327,
    terrain: 'Hillside / Semi-sheltered',
    windFactor: 0.85,
    courtOrientation: 30,
    apiCode: 'F-D0047-061',
    district: '士林區',
    description: '山坡地形，半遮蔽環境',
  },
};

/**
 * Calculate upwind radar analysis
 */
function calculateRadarAnalysis(weather) {
  const scanDistance = 20;
  const windSpeedKmh = weather.wind_speed;

  if (windSpeedKmh < 1) {
    return {
      arrivalTime: null,
      direction: weather.wind_direction,
      scanDistance,
      threat: 'none',
      message: '風速過低，無法計算',
    };
  }

  const arrivalMinutes = Math.round((scanDistance / windSpeedKmh) * 60);
  const upwindDirection = (weather.wind_direction + 180) % 360;

  let threat = 'none';
  if (weather.radar_echo > 35) threat = 'high';
  else if (weather.radar_echo > 20) threat = 'medium';
  else if (weather.radar_echo > 10) threat = 'low';

  return {
    arrivalTime: arrivalMinutes,
    upwindDirection,
    scanDistance,
    threat,
    radarEcho: weather.radar_echo,
    message: threat !== 'none'
      ? `上風處 ${scanDistance}km 偵測到雲系，預計 ${arrivalMinutes} 分鐘後到達`
      : `上風處 ${scanDistance}km 範圍內無顯著雲系`,
  };
}


/**
 * @param {string} locationId
 * @param {Date|null} targetTime - specific time to analyze (null = now)
 */
export function useWeatherData(locationId = 'youth_park', targetTime = null) {
  const [weather, setWeather] = useState(null);
  const [ppi, setPpi] = useState(null);
  const [trend, setTrend] = useState([]);
  const [radar, setRadar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dataSource, setDataSource] = useState('loading'); // 'CWA' | 'simulated'
  const [error, setError] = useState(null);

  // Cache CWA data per location to avoid re-fetching
  const cwaCache = useRef({});

  const location = LOCATIONS[locationId];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const now = new Date();
    const analyzeTime = targetTime || now;

    try {
      // Check if we have cached CWA data for this location (cache for 5 minutes)
      const cacheKey = locationId;
      const cached = cwaCache.current[cacheKey];
      const cacheAge = cached ? (now - cached.fetchedAt) : Infinity;
      const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

      let timeMap;
      if (cached && cacheAge < CACHE_TTL) {
        timeMap = cached.timeMap;
      } else {
        const result = await fetchCWAWeather(locationId);
        timeMap = result.timeMap;
        cwaCache.current[cacheKey] = { timeMap, fetchedAt: now };
      }

      // Get weather at target time
      const weatherData = getWeatherAtTime(timeMap, analyzeTime, location.windFactor);

      if (!weatherData) {
        throw new Error('No data available for target time');
      }

      const ppiData = calculatePPI(weatherData);

      // Build trend from CWA data
      const trendData = [];
      for (let i = 0; i < 6; i++) {
        const trendTime = new Date(analyzeTime);
        trendTime.setHours(analyzeTime.getHours() + i, 0, 0, 0);

        const tWeather = getWeatherAtTime(timeMap, trendTime, location.windFactor);
        if (tWeather) {
          const tPpi = calculatePPI(tWeather);
          const hour = trendTime.getHours();
          const isNextDay = trendTime.getDate() !== analyzeTime.getDate();
          const datePrefix = isNextDay
            ? `${String(trendTime.getMonth() + 1).padStart(2, '0')}/${String(trendTime.getDate()).padStart(2, '0')} `
            : '';

          trendData.push({
            time: `${datePrefix}${String(hour).padStart(2, '0')}:00`,
            hour,
            ppi: tPpi.score,
            ppiCategory: tPpi.category,
            ppiColor: tPpi.color,
            wind_speed: tWeather.wind_speed,
            wind_gust: tWeather.wind_gust,
            rain_mm: tWeather.rain_mm,
            pop: tWeather.pop,
            temp: tWeather.temp,
            cloud_coverage: tWeather.cloud_coverage,
          });
        }
      }

      const radarData = calculateRadarAnalysis(weatherData);

      setWeather(weatherData);
      setPpi(ppiData);
      setTrend(trendData);
      setRadar(radarData);
      setLastUpdate(now);
      setDataSource('CWA');
      setLoading(false);
    } catch (err) {
      console.warn('CWA API failed, details:', err.message);
      setError(err.message);
      setDataSource('error');
      setLoading(false);
    }
  }, [locationId, targetTime?.getTime()]);

  useEffect(() => {
    fetchData();
    // Only auto-refresh for "now" mode
    if (!targetTime) {
      const interval = setInterval(fetchData, 60000); // Refresh every 60s for real API
      return () => clearInterval(interval);
    }
  }, [fetchData, targetTime]);

  return {
    weather,
    ppi,
    trend,
    radar,
    location,
    loading,
    lastUpdate,
    dataSource,
    error,
    refresh: fetchData,
    locations: LOCATIONS,
  };
}

export { LOCATIONS };
