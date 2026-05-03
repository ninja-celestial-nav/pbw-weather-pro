import { useState, useEffect, useCallback, useRef } from 'react';
import { calculatePPI } from '../utils/ppiCalculator';
import { fetchCWAWeather, getWeatherAtTime } from '../api/cwaApi';

const LOCATIONS = {
  youth_park: {
    id: 'youth_park',
    name: '青年公園 Youth Park',
    nameShort: '青年公園',
    nameEn: 'Youth Park',
    city: '台北市 Taipei',
    lat: 25.0227, lng: 121.5036,
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
    nameShort: '二重疏洪道',
    nameEn: 'Erchong Floodway',
    city: '新北市 New Taipei',
    lat: 25.0594, lng: 121.4795,
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
    nameShort: '天母公園',
    nameEn: 'Tianmu Park',
    city: '台北市 Taipei',
    lat: 25.1147, lng: 121.5327,
    terrain: 'Hillside / Semi-sheltered',
    windFactor: 0.85,
    courtOrientation: 30,
    apiCode: 'F-D0047-061',
    district: '士林區',
    description: '山坡地形，半遮蔽環境',
  },
};

function calculateRadarAnalysis(weather) {
  const scanDistance = 20;
  const windSpeedKmh = weather.wind_speed;

  if (windSpeedKmh < 1) {
    return { arrivalTime: null, direction: weather.wind_direction, scanDistance, threat: 'none', message: '風速過低，無法計算' };
  }

  const arrivalMinutes = Math.round((scanDistance / windSpeedKmh) * 60);
  const upwindDirection = (weather.wind_direction + 180) % 360;
  let threat = 'none';
  if (weather.radar_echo > 35) threat = 'high';
  else if (weather.radar_echo > 20) threat = 'medium';
  else if (weather.radar_echo > 10) threat = 'low';

  return {
    arrivalTime: arrivalMinutes, upwindDirection, scanDistance, threat,
    radarEcho: weather.radar_echo,
    message: threat !== 'none'
      ? `上風處 ${scanDistance}km 偵測到雲系，預計 ${arrivalMinutes} 分鐘後到達`
      : `上風處 ${scanDistance}km 範圍內無顯著雲系`,
  };
}

/**
 * B4: Scan all hours in a day to find the best play time
 */
function findBestPlayTimes(timeMap, windFactor, baseDate) {
  const results = [];
  for (let h = 6; h <= 21; h++) {
    const checkTime = new Date(baseDate);
    checkTime.setHours(h, 0, 0, 0);
    const w = getWeatherAtTime(timeMap, checkTime, windFactor);
    if (w) {
      const p = calculatePPI(w);
      results.push({ hour: h, ppi: p.score, category: p.category, color: p.color, weather: w });
    }
  }
  // Find best window (consecutive good hours)
  results.sort((a, b) => b.ppi - a.ppi);
  const best = results[0] || null;
  const topHours = results.filter(r => r.ppi >= 60).sort((a, b) => a.hour - b.hour);

  return { best, topHours, allHours: results.sort((a, b) => a.hour - b.hour) };
}

/**
 * Main hook
 */
export function useWeatherData(locationId = 'youth_park', targetTime = null) {
  const [weather, setWeather] = useState(null);
  const [ppi, setPpi] = useState(null);
  const [trend, setTrend] = useState([]);
  const [radar, setRadar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dataSource, setDataSource] = useState('loading');
  const [error, setError] = useState(null);
  const [bestTimes, setBestTimes] = useState(null);
  const [comparison, setComparison] = useState(null);

  const cwaCache = useRef({});
  const location = LOCATIONS[locationId];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const now = new Date();
    const analyzeTime = targetTime || now;

    try {
      // Fetch data for current location
      const cacheKey = locationId;
      const cached = cwaCache.current[cacheKey];
      const cacheAge = cached ? (now - cached.fetchedAt) : Infinity;
      const CACHE_TTL = 5 * 60 * 1000;

      let timeMap;
      if (cached && cacheAge < CACHE_TTL) {
        timeMap = cached.timeMap;
      } else {
        const result = await fetchCWAWeather(locationId);
        timeMap = result.timeMap;
        cwaCache.current[cacheKey] = { timeMap, fetchedAt: now };
      }

      // Get current weather
      const weatherData = getWeatherAtTime(timeMap, analyzeTime, location.windFactor);
      if (!weatherData) throw new Error('No data for target time');

      const ppiData = calculatePPI(weatherData);

      // Build 6-hour trend
      const trendData = [];
      for (let i = 0; i < 6; i++) {
        const trendTime = new Date(analyzeTime);
        trendTime.setHours(analyzeTime.getHours() + i, 0, 0, 0);
        const tW = getWeatherAtTime(timeMap, trendTime, location.windFactor);
        if (tW) {
          const tP = calculatePPI(tW);
          const hour = trendTime.getHours();
          const isNextDay = trendTime.getDate() !== analyzeTime.getDate();
          const datePrefix = isNextDay ? `${String(trendTime.getMonth() + 1).padStart(2, '0')}/${String(trendTime.getDate()).padStart(2, '0')} ` : '';
          trendData.push({
            time: `${datePrefix}${String(hour).padStart(2, '0')}:00`,
            hour, ppi: tP.score, ppiCategory: tP.category, ppiColor: tP.color,
            wind_speed: tW.wind_speed, wind_gust: tW.wind_gust,
            rain_mm: tW.rain_mm, pop: tW.pop,
            temp: tW.temp, cloud_coverage: tW.cloud_coverage,
            weather_code: tW.weather_code, weather_text: tW.weather_text,
            is_thunder: tW.is_thunder,
          });
        }
      }

      // B4: Best play times for today
      const bestTimesData = findBestPlayTimes(timeMap, location.windFactor, analyzeTime);

      const radarData = calculateRadarAnalysis(weatherData);

      setWeather(weatherData);
      setPpi(ppiData);
      setTrend(trendData);
      setRadar(radarData);
      setBestTimes(bestTimesData);
      setLastUpdate(now);
      setDataSource('CWA');
      setLoading(false);

      // Load comparison in background (non-blocking)
      const comparisonData = {};
      for (const [locId, loc] of Object.entries(LOCATIONS)) {
        try {
          const locCacheKey = locId;
          const locCached = cwaCache.current[locCacheKey];
          const locCacheAge = locCached ? (now - locCached.fetchedAt) : Infinity;
          let locTimeMap;
          if (locCached && locCacheAge < CACHE_TTL) {
            locTimeMap = locCached.timeMap;
          } else {
            const locResult = await fetchCWAWeather(locId);
            locTimeMap = locResult.timeMap;
            cwaCache.current[locCacheKey] = { timeMap: locTimeMap, fetchedAt: now };
          }
          const locWeather = getWeatherAtTime(locTimeMap, analyzeTime, loc.windFactor);
          if (locWeather) {
            const locPpi = calculatePPI(locWeather);
            comparisonData[locId] = { location: loc, weather: locWeather, ppi: locPpi };
          }
        } catch (e) {
          console.warn(`Comparison fetch failed for ${locId}:`, e.message);
        }
      }
      if (Object.keys(comparisonData).length >= 2) {
        setComparison(comparisonData);
      }
    } catch (err) {
      console.warn('CWA API failed:', err.message);
      setError(err.message);
      setDataSource('error');
      setLoading(false);
    }
  }, [locationId, targetTime?.getTime()]);

  useEffect(() => {
    fetchData();
    if (!targetTime) {
      const interval = setInterval(fetchData, 60000);
      return () => clearInterval(interval);
    }
  }, [fetchData, targetTime]);

  return {
    weather, ppi, trend, radar, location, loading, lastUpdate,
    dataSource, error, bestTimes, comparison,
    refresh: fetchData, locations: LOCATIONS,
  };
}

export { LOCATIONS };
