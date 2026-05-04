/**
 * CWA (Central Weather Administration) API Integration
 * Fetches real weather data for Taipei and New Taipei districts
 * v2: Linear interpolation, smart gust/rain estimation, thunderstorm detection
 */

const CWA_API_KEY = 'CWA-39834882-92D7-421E-A5B6-EE3BBF5F5E51';
const IS_DEV = import.meta.env.DEV;
const CWA_BASE_DEV = '/cwa-api';
const CWA_BASE_PROD = '/api/cwa';

/** Map location IDs to CWA district + API endpoint */
const CWA_LOCATION_MAP = {
  youth_park: {
    apiCode: 'F-D0047-061',
    district: '萬華區',
  },
  erchong: {
    apiCode: 'F-D0047-069',
    district: '三重區',
  },
  tianmu: {
    apiCode: 'F-D0047-061',
    district: '士林區',
  },
};

/** Convert Chinese wind direction text to degrees */
const WIND_DIR_MAP = {
  '偏北風': 0, '北風': 0,
  '東北風': 45,
  '偏東風': 90, '東風': 90,
  '東南風': 135,
  '偏南風': 180, '南風': 180,
  '西南風': 225,
  '偏西風': 270, '西風': 270,
  '西北風': 315,
};

/** WeatherCode → cloud coverage + rain intensity mapping */
const WEATHER_CODE_MAP = {
  1:  { cloud: 10,  rainIntensity: 0, isThunder: false, label: '晴' },
  2:  { cloud: 25,  rainIntensity: 0, isThunder: false, label: '晴時多雲' },
  3:  { cloud: 40,  rainIntensity: 0, isThunder: false, label: '多雲時晴' },
  4:  { cloud: 55,  rainIntensity: 0, isThunder: false, label: '多雲' },
  5:  { cloud: 70,  rainIntensity: 0, isThunder: false, label: '多雲時陰' },
  6:  { cloud: 80,  rainIntensity: 0, isThunder: false, label: '陰時多雲' },
  7:  { cloud: 90,  rainIntensity: 0, isThunder: false, label: '陰' },
  8:  { cloud: 80,  rainIntensity: 0.3, isThunder: false, label: '短暫雨' },
  9:  { cloud: 85,  rainIntensity: 0.5, isThunder: false, label: '短暫雨' },
  10: { cloud: 90,  rainIntensity: 1.0, isThunder: false, label: '陣雨' },
  11: { cloud: 80,  rainIntensity: 0.5, isThunder: false, label: '短暫陣雨' },
  12: { cloud: 85,  rainIntensity: 0.8, isThunder: false, label: '短暫陣雨' },
  13: { cloud: 90,  rainIntensity: 2.0, isThunder: false, label: '雨' },
  14: { cloud: 85,  rainIntensity: 1.5, isThunder: true, label: '雷雨' },
  15: { cloud: 85,  rainIntensity: 0.8, isThunder: true, label: '短暫陣雨或雷雨' },
  16: { cloud: 90,  rainIntensity: 1.0, isThunder: true, label: '雷陣雨' },
  17: { cloud: 90,  rainIntensity: 2.5, isThunder: false, label: '大雨' },
  18: { cloud: 95,  rainIntensity: 5.0, isThunder: false, label: '豪雨' },
  19: { cloud: 80,  rainIntensity: 0.3, isThunder: false, label: '午後短暫雷陣雨' },
  20: { cloud: 90,  rainIntensity: 1.5, isThunder: true, label: '午後雷陣雨' },
  21: { cloud: 60,  rainIntensity: 0.1, isThunder: false, label: '多雲短暫雨' },
  22: { cloud: 65,  rainIntensity: 0.2, isThunder: false, label: '多雲短暫陣雨' },
  23: { cloud: 70,  rainIntensity: 0.3, isThunder: true, label: '多雲短暫陣雨或雷雨' },
  24: { cloud: 55,  rainIntensity: 0.1, isThunder: false, label: '晴時多雲短暫雨' },
  25: { cloud: 60,  rainIntensity: 0.2, isThunder: false, label: '晴時多雲短暫陣雨' },
  26: { cloud: 65,  rainIntensity: 0.3, isThunder: true, label: '晴時多雲短暫陣雨或雷雨' },
  29: { cloud: 75,  rainIntensity: 0.2, isThunder: false, label: '陰短暫雨' },
  30: { cloud: 80,  rainIntensity: 0.3, isThunder: false, label: '陰短暫陣雨' },
  31: { cloud: 85,  rainIntensity: 0.5, isThunder: true, label: '陰短暫陣雨或雷雨' },
  32: { cloud: 80,  rainIntensity: 0.2, isThunder: false, label: '多雲午後短暫雷陣雨' },
  33: { cloud: 70,  rainIntensity: 0.1, isThunder: true, label: '晴午後短暫雷陣雨' },
  34: { cloud: 75,  rainIntensity: 0.2, isThunder: true, label: '多雲午後短暫雷陣雨' },
  35: { cloud: 80,  rainIntensity: 0.3, isThunder: true, label: '陰午後短暫雷陣雨' },
  36: { cloud: 90,  rainIntensity: 3.0, isThunder: true, label: '暴雨' },
  42: { cloud: 30,  rainIntensity: 0, isThunder: false, label: '晴' },
};

function getWeatherCodeInfo(code) {
  const c = parseInt(code);
  return WEATHER_CODE_MAP[c] || { cloud: 50, rainIntensity: 0, isThunder: false, label: '未知' };
}

/** Dynamic gust estimation based on terrain and time of day */
export function estimateGust(windSpeedKmh, windFactor, hour) {
  // Higher gust ratio for exposed terrain and afternoon convection
  let gustRatio = 1.3; // base

  if (windFactor >= 1.2) gustRatio = 1.8;       // Riverside/open
  else if (windFactor >= 0.8) gustRatio = 1.5;   // Semi-sheltered
  else gustRatio = 1.3;                           // Urban sheltered

  // Afternoon convection (13:00-17:00) increases gusts
  if (hour >= 13 && hour <= 17) gustRatio += 0.2;
  // Night calm reduces gust ratio
  if (hour >= 21 || hour <= 5) gustRatio -= 0.15;

  return Math.round(windSpeedKmh * gustRatio * 10) / 10;
}

export function getDiurnalFactor(hour) {
  if (hour >= 5 && hour <= 7) return 0.7;       // dawn calm
  if (hour >= 8 && hour <= 10) return 0.85;     // morning building
  if (hour >= 11 && hour <= 13) return 1.0;     // midday
  if (hour >= 14 && hour <= 16) return 1.25;    // afternoon convection
  if (hour >= 17 && hour <= 18) return 1.1;     // evening transition
  return 0.75;                                  // night calm (19-4)
}

/** Improved rain estimation using WeatherCode + PoP combined */
function estimateRainMm(weatherCodeInfo, pop) {
  const baseIntensity = weatherCodeInfo.rainIntensity;
  const popFactor = pop / 100;

  // Combine: WeatherCode provides intensity category, PoP provides probability scaling
  if (baseIntensity === 0 && pop <= 10) return 0;
  if (baseIntensity === 0 && pop > 10) return pop * 0.005; // slight chance

  return Math.round(baseIntensity * popFactor * 100) / 100;
}

/** Estimate UV index from hour and cloud coverage */
function estimateUV(hour, cloudCoverage) {
  if (hour < 6 || hour > 18) return 0;
  const solarFactor = Math.sin(((hour - 6) / 12) * Math.PI);
  const maxUV = 10;
  const cloudFactor = 1 - (cloudCoverage / 100) * 0.6;
  return Math.round(maxUV * solarFactor * cloudFactor * 10) / 10;
}

/** Linear interpolation between two values */
function lerp(v1, v2, t) {
  return v1 + (v2 - v1) * t;
}

/** Angle interpolation (handles 350° → 10° wrapping) */
function lerpAngle(a1, a2, t) {
  let diff = a2 - a1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  let result = a1 + diff * t;
  if (result < 0) result += 360;
  if (result >= 360) result -= 360;
  return Math.round(result);
}

/**
 * Parse CWA API response into normalized weather format
 */
function parseCWAData(locationData) {
  const elements = {};
  for (const el of locationData.WeatherElement) {
    elements[el.ElementName] = el.Time;
  }

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

  // Dew point temperature
  if (elements['露點溫度']) {
    for (const t of elements['露點溫度']) {
      const key = t.DataTime;
      if (!timeMap.has(key)) timeMap.set(key, {});
      timeMap.get(key).dew_point = parseFloat(t.ElementValue[0].DewPoint);
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

  // Comfort index
  if (elements['舒適度指數']) {
    for (const t of elements['舒適度指數']) {
      const key = t.DataTime;
      if (!timeMap.has(key)) timeMap.set(key, {});
      timeMap.get(key).comfort_index = parseInt(t.ElementValue[0].ComfortIndex);
      timeMap.get(key).comfort_desc = t.ElementValue[0].ComfortIndexDescription;
    }
  }

  // Wind speed (m/s → km/h, 3-hourly)
  if (elements['風速']) {
    for (const t of elements['風速']) {
      const key = t.DataTime;
      if (!timeMap.has(key)) timeMap.set(key, {});
      const speedMs = parseFloat(t.ElementValue[0].WindSpeed);
      timeMap.get(key).wind_speed_ms = speedMs;
      timeMap.get(key).wind_speed = Math.round(speedMs * 3.6 * 10) / 10;
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

  // PoP (3-hour blocks)
  if (elements['3小時降雨機率']) {
    for (const t of elements['3小時降雨機率']) {
      const pop = parseInt(t.ElementValue[0].ProbabilityOfPrecipitation);
      const startKey = t.StartTime;
      if (!timeMap.has(startKey)) timeMap.set(startKey, {});
      timeMap.get(startKey).pop = pop;
      timeMap.get(startKey)._popEndTime = t.EndTime;
    }
  }

  // Weather phenomenon (for cloud/rain/thunder)
  if (elements['天氣現象']) {
    for (const t of elements['天氣現象']) {
      const startKey = t.StartTime;
      if (!timeMap.has(startKey)) timeMap.set(startKey, {});
      const code = t.ElementValue[0].WeatherCode;
      const info = getWeatherCodeInfo(code);
      timeMap.get(startKey).weather_code = parseInt(code);
      timeMap.get(startKey).weather_text = t.ElementValue[0].Weather;
      timeMap.get(startKey).cloud_coverage = info.cloud;
      timeMap.get(startKey).is_thunder = info.isThunder;
      timeMap.get(startKey).rain_intensity = info.rainIntensity;
    }
  }

  return timeMap;
}

/**
 * Get interpolated weather for a specific target time
 */
export function getWeatherAtTime(timeMap, targetTime, windFactor = 1.0) {
  const targetMs = targetTime.getTime();
  const targetHour = targetTime.getHours();

  const entries = Array.from(timeMap.entries())
    .map(([key, val]) => ({ time: new Date(key).getTime(), data: val, key }))
    .sort((a, b) => a.time - b.time);

  if (entries.length === 0) return null;

  // Find bracketing entries for interpolation
  let before = null, after = null;
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].time <= targetMs) before = entries[i];
    if (entries[i].time >= targetMs && !after) after = entries[i];
  }
  if (!before) before = entries[0];
  if (!after) after = entries[entries.length - 1];

  // Interpolation factor (0..1)
  const range = after.time - before.time;
  const t = range > 0 ? Math.max(0, Math.min(1, (targetMs - before.time) / range)) : 0;

  // Helper: interpolate a numeric field
  function interpField(field) {
    const v1 = before.data[field];
    const v2 = after.data[field];
    if (v1 !== undefined && v2 !== undefined) return lerp(v1, v2, t);
    if (v1 !== undefined) return v1;
    if (v2 !== undefined) return v2;

    // Search for nearest value
    let closest = null, closestDist = Infinity;
    for (const e of entries) {
      if (e.data[field] !== undefined) {
        const dist = Math.abs(e.time - targetMs);
        if (dist < closestDist) { closestDist = dist; closest = e.data[field]; }
      }
    }
    return closest;
  }

  // Wind direction: angle interpolation
  let windDir = 0;
  const wd1 = before.data.wind_direction;
  const wd2 = after.data.wind_direction;
  if (wd1 !== undefined && wd2 !== undefined) {
    windDir = lerpAngle(wd1, wd2, t);
  } else {
    windDir = interpField('wind_direction') || 0;
  }

  // Nearest non-numeric fields
  function nearestField(field) {
    let closest = null, closestDist = Infinity;
    for (const e of entries) {
      if (e.data[field] !== undefined) {
        const dist = Math.abs(e.time - targetMs);
        if (dist < closestDist) { closestDist = dist; closest = e.data[field]; }
      }
    }
    return closest;
  }

  const temp = interpField('temp') ?? 25;
  const feelsLike = interpField('feels_like') ?? temp;
  const dewPoint = interpField('dew_point') ?? temp - 5;
  const humidity = interpField('humidity') ?? 70;
  const comfortIndex = interpField('comfort_index');
  const comfortDesc = nearestField('comfort_desc') || '';
  const rawWindSpeed = interpField('wind_speed') ?? 0;
  // C8: Diurnal wind correction — early morning calm, afternoon thermal convection
  const diurnalFactor = getDiurnalFactor(targetHour);

  const windSpeed = Math.round(rawWindSpeed * windFactor * diurnalFactor * 10) / 10;
  const cloudCov = interpField('cloud_coverage') ?? 50;
  const pop = interpField('pop') ?? 0;
  const weatherCode = nearestField('weather_code') ?? 1;
  const weatherText = nearestField('weather_text') || '';
  const windDirText = nearestField('wind_direction_text') || '';
  const isThunder = nearestField('is_thunder') || false;

  // Improved gust estimation
  const windGust = estimateGust(windSpeed, windFactor, targetHour);

  // Improved rain estimation
  const weatherInfo = getWeatherCodeInfo(weatherCode);
  const rainMm = estimateRainMm(weatherInfo, pop);

  // Ground wetness factor (dewpoint proximity to temp)
  const dewPointGap = temp - dewPoint;
  const isGroundWet = dewPointGap < 2 && humidity > 90;

  return {
    temp: Math.round(temp * 10) / 10,
    feels_like: Math.round(feelsLike * 10) / 10,
    dew_point: Math.round(dewPoint * 10) / 10,
    humidity: Math.round(humidity),
    comfort_index: comfortIndex,
    comfort_desc: comfortDesc,
    wind_speed: windSpeed,
    wind_gust: windGust,
    wind_direction: windDir,
    wind_direction_text: windDirText,
    cloud_coverage: Math.round(cloudCov),
    rain_mm: rainMm,
    pop: Math.round(pop),
    uv_index: estimateUV(targetHour, cloudCov),
    weather_code: weatherCode,
    weather_text: weatherText,
    is_thunder: isThunder,
    is_ground_wet: isGroundWet,
    radar_echo: rainMm > 1 ? 35 : rainMm > 0.3 ? 20 : rainMm > 0 ? 10 : 3,
    timestamp: targetTime.toISOString(),
    source: 'CWA',
  };
}

/**
 * Fetch and parse CWA data for a location
 */
export async function fetchCWAWeather(locationId) {
  const config = CWA_LOCATION_MAP[locationId];
  if (!config) throw new Error(`Unknown location: ${locationId}`);

  let url;
  if (IS_DEV) {
    url = `${CWA_BASE_DEV}/${config.apiCode}?Authorization=${CWA_API_KEY}&LocationName=${encodeURIComponent(config.district)}&format=JSON`;
  } else {
    url = `${CWA_BASE_PROD}?apiCode=${config.apiCode}&locationName=${encodeURIComponent(config.district)}`;
  }

  const response = await fetch(url);
  if (!response.ok) throw new Error(`CWA API error: ${response.status}`);

  const data = await response.json();
  if (data.success !== 'true' || !data.records?.Locations?.[0]?.Location?.[0]) {
    throw new Error('Invalid CWA response');
  }

  const locationData = data.records.Locations[0].Location[0];
  const timeMap = parseCWAData(locationData);

  return { timeMap, district: config.district, raw: locationData };
}

export { CWA_API_KEY, CWA_LOCATION_MAP };
