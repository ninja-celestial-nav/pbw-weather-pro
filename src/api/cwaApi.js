/**
 * CWA (Central Weather Administration) API Integration
 * Fetches real weather data for Taipei and New Taipei districts
 */

const CWA_API_KEY = 'CWA-39834882-92D7-421E-A5B6-EE3BBF5F5E51';
const IS_DEV = import.meta.env.DEV;
// Dev: Vite proxy | Prod: Vercel serverless function
const CWA_BASE_DEV = '/cwa-api';
const CWA_BASE_PROD = '/api/cwa';

/** Map location IDs to CWA district + API endpoint */
const CWA_LOCATION_MAP = {
  youth_park: {
    apiCode: 'F-D0047-061',
    district: '萬華區', // Youth Park is in Wanhua District
  },
  erchong: {
    apiCode: 'F-D0047-069',
    district: '三重區', // Erchong Floodway is in Sanchong District
  },
  tianmu: {
    apiCode: 'F-D0047-061',
    district: '士林區', // Tianmu Park is in Shilin District
  },
};

/** Convert Chinese wind direction text to degrees */
const WIND_DIR_MAP = {
  '偏北風': 0,
  '北風': 0,
  '東北風': 45,
  '偏東風': 90,
  '東風': 90,
  '東南風': 135,
  '偏南風': 180,
  '南風': 180,
  '西南風': 225,
  '偏西風': 270,
  '西風': 270,
  '西北風': 315,
};

/** Convert WeatherCode to approximate cloud coverage % */
function weatherCodeToCloudCoverage(code) {
  const c = parseInt(code);
  // CWA codes: 01=晴, 02=晴時多雲, 03=多雲時晴, 04=多雲, 05=多雲時陰, 06=陰時多雲, 07=陰
  // 08-42 involve various rain/thunderstorm patterns
  if (c === 1) return 10;
  if (c === 2) return 25;
  if (c === 3) return 40;
  if (c === 4) return 55;
  if (c === 5) return 70;
  if (c === 6) return 80;
  if (c === 7) return 90;
  if (c >= 8) return 85; // rain/thunder implies heavy cloud
  return 50;
}

/** Estimate UV index from hour and cloud coverage */
function estimateUV(hour, cloudCoverage) {
  // UV peaks around noon, drops to 0 at night
  if (hour < 6 || hour > 18) return 0;
  const solarFactor = Math.sin(((hour - 6) / 12) * Math.PI);
  const maxUV = 10; // Taipei summer max
  const cloudFactor = 1 - (cloudCoverage / 100) * 0.6;
  return Math.round(maxUV * solarFactor * cloudFactor * 10) / 10;
}

/**
 * Parse CWA API response into our normalized weather format
 * @param {Object} locationData - single location from CWA response
 * @returns {Map<string, Object>} map of ISO timestamp -> weather data
 */
function parseCWAData(locationData) {
  const elements = {};
  for (const el of locationData.WeatherElement) {
    elements[el.ElementName] = el.Time;
  }

  // Build a time-indexed map of all available data
  const timeMap = new Map();

  // Temperature (hourly for first 2 days, 3-hourly after)
  if (elements['溫度']) {
    for (const t of elements['溫度']) {
      const key = t.DataTime;
      if (!timeMap.has(key)) timeMap.set(key, {});
      timeMap.get(key).temp = parseFloat(t.ElementValue[0].Temperature);
    }
  }

  // Apparent temperature
  if (elements['體感溫度']) {
    for (const t of elements['體感溫度']) {
      const key = t.DataTime;
      if (!timeMap.has(key)) timeMap.set(key, {});
      timeMap.get(key).feels_like = parseFloat(t.ElementValue[0].ApparentTemperature);
    }
  }

  // Humidity
  if (elements['相對濕度']) {
    for (const t of elements['相對濕度']) {
      const key = t.DataTime;
      if (!timeMap.has(key)) timeMap.set(key, {});
      timeMap.get(key).humidity = parseInt(t.ElementValue[0].RelativeHumidity);
    }
  }

  // Wind speed (m/s → km/h, 3-hourly)
  if (elements['風速']) {
    for (const t of elements['風速']) {
      const key = t.DataTime;
      if (!timeMap.has(key)) timeMap.set(key, {});
      const speedMs = parseFloat(t.ElementValue[0].WindSpeed);
      timeMap.get(key).wind_speed_ms = speedMs;
      timeMap.get(key).wind_speed = Math.round(speedMs * 3.6 * 10) / 10; // km/h
    }
  }

  // Wind direction (Chinese → degrees, 3-hourly)
  if (elements['風向']) {
    for (const t of elements['風向']) {
      const key = t.DataTime;
      if (!timeMap.has(key)) timeMap.set(key, {});
      const dirText = t.ElementValue[0].WindDirection;
      timeMap.get(key).wind_direction = WIND_DIR_MAP[dirText] ?? 0;
      timeMap.get(key).wind_direction_text = dirText;
    }
  }

  // PoP (3-hour blocks with StartTime/EndTime)
  if (elements['3小時降雨機率']) {
    for (const t of elements['3小時降雨機率']) {
      const pop = parseInt(t.ElementValue[0].ProbabilityOfPrecipitation);
      // Apply PoP to all hours in this 3-hour window
      const startKey = t.StartTime;
      if (!timeMap.has(startKey)) timeMap.set(startKey, {});
      timeMap.get(startKey).pop = pop;
      // Also mark the intermediate hours
      const start = new Date(t.StartTime);
      for (let i = 0; i < 3; i++) {
        const h = new Date(start);
        h.setHours(start.getHours() + i);
        const hKey = h.toISOString().replace('.000Z', '+08:00').replace('Z', '+08:00');
        // Use a simpler approach: just tag the start time
      }
      // Store with reference for lookup
      timeMap.get(startKey)._popEndTime = t.EndTime;
    }
  }

  // Weather phenomenon (for cloud coverage estimation)
  if (elements['天氣現象']) {
    for (const t of elements['天氣現象']) {
      const startKey = t.StartTime;
      if (!timeMap.has(startKey)) timeMap.set(startKey, {});
      const code = t.ElementValue[0].WeatherCode;
      timeMap.get(startKey).weather_code = code;
      timeMap.get(startKey).weather_text = t.ElementValue[0].Weather;
      timeMap.get(startKey).cloud_coverage = weatherCodeToCloudCoverage(code);
    }
  }

  return timeMap;
}

/**
 * Fetch and parse CWA data for a location
 */
export async function fetchCWAWeather(locationId) {
  const config = CWA_LOCATION_MAP[locationId];
  if (!config) throw new Error(`Unknown location: ${locationId}`);

  let url;
  if (IS_DEV) {
    // Dev: use Vite proxy directly to CWA
    url = `${CWA_BASE_DEV}/${config.apiCode}?Authorization=${CWA_API_KEY}&LocationName=${encodeURIComponent(config.district)}&format=JSON`;
  } else {
    // Prod: use Vercel serverless function (hides API key)
    url = `${CWA_BASE_PROD}?apiCode=${config.apiCode}&locationName=${encodeURIComponent(config.district)}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CWA API error: ${response.status}`);
  }

  const data = await response.json();
  if (data.success !== 'true' || !data.records?.Locations?.[0]?.Location?.[0]) {
    throw new Error('Invalid CWA response');
  }

  const locationData = data.records.Locations[0].Location[0];
  const timeMap = parseCWAData(locationData);

  return { timeMap, district: config.district, raw: locationData };
}

/**
 * Get weather for a specific target time, interpolating from CWA data
 * @param {Map} timeMap - parsed CWA time map
 * @param {Date} targetTime - the time to get weather for
 * @param {number} windFactor - location wind factor
 * @returns {Object} normalized weather data
 */
export function getWeatherAtTime(timeMap, targetTime, windFactor = 1.0) {
  const targetHour = targetTime.getHours();
  
  // Find closest data points
  const entries = Array.from(timeMap.entries())
    .map(([key, val]) => ({ time: new Date(key), data: val, key }))
    .sort((a, b) => a.time - b.time);

  // Find the best matching entry for the target time
  let best = null;
  let bestDist = Infinity;

  for (const entry of entries) {
    const dist = Math.abs(entry.time - targetTime);
    if (dist < bestDist) {
      bestDist = dist;
      best = entry;
    }
  }

  if (!best) {
    return null;
  }

  // Collect data by walking through entries to fill gaps
  // Some fields (temp, humidity) are hourly, others (wind, pop) are 3-hourly
  const collected = {};
  
  // Walk entries to find closest data for each field
  for (const field of ['temp', 'feels_like', 'humidity', 'wind_speed', 'wind_direction', 'pop', 'cloud_coverage', 'weather_text', 'wind_direction_text']) {
    let closestVal = null;
    let closestDist = Infinity;
    
    for (const entry of entries) {
      if (entry.data[field] !== undefined) {
        const dist = Math.abs(entry.time - targetTime);
        if (dist < closestDist) {
          closestDist = dist;
          closestVal = entry.data[field];
        }
      }
    }
    
    if (closestVal !== null) {
      collected[field] = closestVal;
    }
  }

  // Apply wind factor and compute derived fields
  const windSpeed = (collected.wind_speed || 0) * windFactor;
  const windGust = windSpeed * 1.5; // Estimate gust as 1.5x sustained
  const cloudCov = collected.cloud_coverage || 50;
  const pop = collected.pop || 0;
  const rainMm = pop > 50 ? 0.8 : pop > 30 ? 0.2 : 0; // Rough estimate from PoP

  return {
    temp: collected.temp || 25,
    feels_like: collected.feels_like || collected.temp || 25,
    humidity: collected.humidity || 70,
    wind_speed: Math.round(windSpeed * 10) / 10,
    wind_gust: Math.round(windGust * 10) / 10,
    wind_direction: collected.wind_direction || 0,
    wind_direction_text: collected.wind_direction_text || '',
    cloud_coverage: cloudCov,
    rain_mm: Math.round(rainMm * 100) / 100,
    pop: pop,
    uv_index: estimateUV(targetHour, cloudCov),
    radar_echo: rainMm > 0.5 ? 30 : rainMm > 0 ? 15 : 3,
    weather_text: collected.weather_text || '',
    timestamp: targetTime.toISOString(),
    source: 'CWA',
  };
}
export { CWA_API_KEY, CWA_LOCATION_MAP };

