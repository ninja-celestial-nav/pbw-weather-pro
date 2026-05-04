/**
 * C6: Open-Meteo API for cross-validation
 * Free, no API key required, hourly resolution
 */

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

/**
 * Fetch Open-Meteo forecast for a location
 * @returns {{ hourly: Map<number, Object> }} map of unix timestamp → weather
 */
export async function fetchOpenMeteo(lat, lng) {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation_probability,precipitation,cloud_cover,weather_code',
    timezone: 'Asia/Taipei',
    forecast_days: '3',
  });

  const response = await fetch(`${OPEN_METEO_BASE}?${params}`);
  if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`);

  const data = await response.json();
  if (!data.hourly?.time) throw new Error('Invalid Open-Meteo response');

  const hourlyMap = new Map();
  const { time, temperature_2m, relative_humidity_2m, wind_speed_10m, wind_direction_10m, wind_gusts_10m, precipitation_probability, precipitation, cloud_cover, weather_code } = data.hourly;

  for (let i = 0; i < time.length; i++) {
    const ts = new Date(time[i]).getTime();
    hourlyMap.set(ts, {
      temp: temperature_2m[i],
      humidity: relative_humidity_2m[i],
      wind_speed: wind_speed_10m[i],
      wind_direction: wind_direction_10m[i],
      wind_gust: wind_gusts_10m[i],
      pop: precipitation_probability[i],
      rain_mm: precipitation[i],
      cloud_coverage: cloud_cover[i],
      weather_code: weather_code[i],
    });
  }

  return { hourlyMap, raw: data };
}

/**
 * Get Open-Meteo data for a target time (find closest hour)
 */
export function getOpenMeteoAtTime(hourlyMap, targetTime) {
  const targetMs = targetTime.getTime();
  let closest = null;
  let closestDist = Infinity;

  for (const [ts, data] of hourlyMap) {
    const dist = Math.abs(ts - targetMs);
    if (dist < closestDist) {
      closestDist = dist;
      closest = data;
    }
  }

  return closest;
}

/**
 * Compare CWA vs Open-Meteo data and return confidence metrics
 */
export function compareDataSources(cwaData, omData) {
  if (!cwaData || !omData) return null;

  const tempDiff = Math.abs(cwaData.temp - omData.temp);
  const windDiff = Math.abs(cwaData.wind_speed - omData.wind_speed);
  const popDiff = Math.abs(cwaData.pop - omData.pop);

  // Confidence: higher when sources agree
  const tempConf = Math.max(0, 100 - tempDiff * 15);
  const windConf = Math.max(0, 100 - windDiff * 5);
  const popConf = Math.max(0, 100 - popDiff * 1.5);
  const overall = Math.round((tempConf * 0.3 + windConf * 0.4 + popConf * 0.3));

  return {
    confidence: overall,
    tempDiff: Math.round(tempDiff * 10) / 10,
    windDiff: Math.round(windDiff * 10) / 10,
    popDiff: Math.round(popDiff),
    openMeteo: omData,
    label: overall >= 80 ? '高度一致' : overall >= 60 ? '大致吻合' : '差異較大',
    color: overall >= 80 ? '#22c55e' : overall >= 60 ? '#eab308' : '#f97316',
  };
}
