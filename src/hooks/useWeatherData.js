import { useState, useEffect, useCallback, useRef } from 'react';
import { calculatePPI } from '../utils/ppiCalculator';
import { fetchCWAWeather, getWeatherAtTime, estimateGust, getDiurnalFactor } from '../api/cwaApi';
import { fetchOpenMeteo, getOpenMeteoAtTime, compareDataSources } from '../api/openMeteoApi';
import { fetchObservation } from '../api/cwaObservation';

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

// C5: History management
const HISTORY_KEY = 'pbw_ppi_history';
const MAX_HISTORY = 168; // 7 days × 24 hours

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveHistory(locationId, ppiScore) {
  try {
    const history = loadHistory();
    if (!history[locationId]) history[locationId] = [];
    const now = Date.now();
    history[locationId].push({ t: now, s: ppiScore });
    // Keep only last 7 days
    const cutoff = now - 7 * 24 * 60 * 60 * 1000;
    history[locationId] = history[locationId].filter(h => h.t > cutoff).slice(-MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch { /* localStorage full or unavailable */ }
}

function getHistory(locationId) {
  const history = loadHistory();
  return history[locationId] || [];
}

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

function findBestPlayTimes(timeMap, windFactor, baseDate) {
  const results = [];
  const now = new Date();
  const isToday = baseDate.getDate() === now.getDate();
  const nowHour = now.getHours();

  for (let h = 6; h <= 21; h++) {
    if (isToday && h < nowHour) continue; // Skip past hours today
    
    const checkTime = new Date(baseDate);
    checkTime.setHours(h, 0, 0, 0);
    const w = getWeatherAtTime(timeMap, checkTime, windFactor);
    if (w) {
      const p = calculatePPI(w);
      results.push({ hour: h, ppi: p.score, category: p.category, color: p.color, weather: w });
    }
  }
  results.sort((a, b) => b.ppi - a.ppi);
  const best = results[0] || null;
  const topHours = results.filter(r => r.ppi >= 60).sort((a, b) => a.hour - b.hour);
  return { best, topHours, allHours: results.sort((a, b) => a.hour - b.hour) };
}

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
  const [crossValidation, setCrossValidation] = useState(null);
  const [ppiHistory, setPpiHistory] = useState([]);

  const cwaCache = useRef({});
  const omCache = useRef({});
  const location = LOCATIONS[locationId];

  const fetchData = useCallback(async (options = {}) => {
    const force = options?.force === true;
    setLoading(true);
    setError(null);

    const now = new Date();
    const analyzeTime = targetTime || now;

    try {
      const cacheKey = locationId;
      const cached = cwaCache.current[cacheKey];
      const cacheAge = cached ? (now - cached.fetchedAt) : Infinity;
      const CACHE_TTL = 5 * 60 * 1000;

      let timeMap;
      if (!force && cached && cacheAge < CACHE_TTL) {
        timeMap = cached.timeMap;
      } else {
        const result = await fetchCWAWeather(locationId);
        timeMap = result.timeMap;
        cwaCache.current[cacheKey] = { timeMap, fetchedAt: now };
      }

      let weatherData = getWeatherAtTime(timeMap, analyzeTime, location.windFactor);
      if (!weatherData) throw new Error('No data for target time');

      // C7: Merge real-time observation if looking at "now"
      if (!targetTime) {
        const obs = await fetchObservation(locationId);
        if (obs) {
          const obsWindSpeed = Math.round(obs.wind_speed * location.windFactor * 10) / 10;
          const obsWindGust = estimateGust(obsWindSpeed, location.windFactor, analyzeTime.getHours());
          const obsRadarEcho = obs.rain_mm > 1 ? 40 : obs.rain_mm > 0.3 ? 25 : obs.rain_mm > 0 ? 15 : 3;
          
          weatherData = { 
            ...weatherData, 
            rain_mm: obs.rain_mm,
            radar_echo: obsRadarEcho,
            wind_speed: obsWindSpeed,
            wind_gust: obsWindGust,
            isRealtimeObserved: true 
          };
        }
      }

      const ppiData = calculatePPI(weatherData);

      // C5: Save to history (only for real-time, not forecast)
      if (!targetTime) {
        saveHistory(locationId, ppiData.score);
      }
      setPpiHistory(getHistory(locationId));

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

      // Background: comparison
      const comparisonData = {};
      for (const [locId, loc] of Object.entries(LOCATIONS)) {
        try {
          const locCached = cwaCache.current[locId];
          const locAge = locCached ? (now - locCached.fetchedAt) : Infinity;
          let locTimeMap;
          if (!force && locCached && locAge < CACHE_TTL) {
            locTimeMap = locCached.timeMap;
          } else {
            const locResult = await fetchCWAWeather(locId);
            locTimeMap = locResult.timeMap;
            cwaCache.current[locId] = { timeMap: locTimeMap, fetchedAt: now };
          }
          let locWeather = getWeatherAtTime(locTimeMap, analyzeTime, loc.windFactor);
          
          if (locWeather) {
            // Also apply real-time observation to comparison cards so they match the main gauge
            if (!targetTime) {
              const locObs = await fetchObservation(locId);
              if (locObs) {
                const obsWindSpeed = Math.round(locObs.wind_speed * loc.windFactor * 10) / 10;
                const obsWindGust = estimateGust(obsWindSpeed, loc.windFactor, analyzeTime.getHours());
                const obsRadarEcho = locObs.rain_mm > 1 ? 40 : locObs.rain_mm > 0.3 ? 25 : locObs.rain_mm > 0 ? 15 : 3;

                locWeather = {
                  ...locWeather,
                  rain_mm: locObs.rain_mm,
                  radar_echo: obsRadarEcho,
                  wind_speed: obsWindSpeed,
                  wind_gust: obsWindGust,
                  isRealtimeObserved: true
                };
              }
            }
            
            const locPpi = calculatePPI(locWeather);
            // C9: Get 24hr history for sparkline
            const locHistory = getHistory(locId);
            comparisonData[locId] = { location: loc, weather: locWeather, ppi: locPpi, history: locHistory };
          }
        } catch (e) {
          console.warn(`Comparison fetch failed for ${locId}:`, e.message);
        }
      }
      if (Object.keys(comparisonData).length >= 2) {
        setComparison(comparisonData);
      }

      // C6: Background Open-Meteo cross-validation
      try {
        const omCached = omCache.current[locationId];
        const omAge = omCached ? (now - omCached.fetchedAt) : Infinity;
        let omHourlyMap;
        if (!force && omCached && omAge < CACHE_TTL) {
          omHourlyMap = omCached.hourlyMap;
        } else {
          const omResult = await fetchOpenMeteo(location.lat, location.lng);
          omHourlyMap = omResult.hourlyMap;
          omCache.current[locationId] = { hourlyMap: omHourlyMap, fetchedAt: now };
        }
        const omData = getOpenMeteoAtTime(omHourlyMap, analyzeTime);
        
        if (omData) {
          // Apply the exact same court-level wind modifiers to Open-Meteo
          const diurnalFactor = getDiurnalFactor(analyzeTime.getHours());
          const factoredWindSpeed = Math.round(omData.wind_speed * location.windFactor * diurnalFactor * 10) / 10;
          omData.wind_speed = factoredWindSpeed;
          omData.wind_gust = estimateGust(factoredWindSpeed, location.windFactor, analyzeTime.getHours());
        }

        const cv = compareDataSources(weatherData, omData);
        setCrossValidation(cv);
      } catch (e) {
        console.warn('Open-Meteo failed:', e.message);
        setCrossValidation(null);
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
    dataSource, error, bestTimes, comparison, crossValidation, ppiHistory,
    refresh: () => fetchData({ force: true }), locations: LOCATIONS,
  };
}

export { LOCATIONS };
