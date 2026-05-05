/**
 * C7: CWA Observation Station API (O-A0001-001)
 * Real-time 10-minute rain and wind observations
 */

const IS_DEV = import.meta.env.DEV;
const CWA_BASE_DEV = '/cwa-api';
const CWA_BASE_PROD = '/api/cwa';

// Match locations to nearby observation stations
const STATION_MAP = {
  youth_park: '臺北', // C0A980 (植物園) or 466920 (臺北)
  erchong: '三重',    // C0A970 (三重)
  tianmu: '天母',     // C0A9E0 (天母) or 士林
};

export async function fetchObservation(locationId) {
  try {
    const CWA_API_KEY = 'CWA-39834882-92D7-421E-A5B6-EE3BBF5F5E51';
    const stationName = STATION_MAP[locationId] || '臺北';
    const baseUrl = IS_DEV ? CWA_BASE_DEV : CWA_BASE_PROD;
    
    // O-A0001-001: 自動氣象站-氣象觀測資料
    const url = `${baseUrl}?apiCode=O-A0001-001&locationName=${encodeURIComponent(stationName)}&Authorization=${CWA_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      // Fallback to O-A0003-001 if station not found in A0001
      if (stationName === '臺北') {
        const fbUrl = `${baseUrl}?apiCode=O-A0003-001&locationName=臺北&Authorization=${CWA_API_KEY}`;
        const fbRes = await fetch(fbUrl);
        if (fbRes.ok) return parseObservation(await fbRes.json());
      }
      throw new Error(`Observation API error: ${response.status}`);
    }

    const data = await response.json();
    return parseObservation(data);
  } catch (error) {
    console.warn(`[Observation] Failed for ${locationId}:`, error.message);
    return null;
  }
}

function parseObservation(data) {
  try {
    const stations = data?.records?.Station || data?.records?.location; // A0001 uses Station, A0003 uses location
    if (!stations || !stations.length) return null;

    const station = stations[0];
    
    // Handle both A0001 and A0003 schema
    let rain = 0;
    let windSpeed = 0;
    
    if (station.WeatherElement) {
      // A0001 schema
      const rainElem = station.WeatherElement.RainfallElement?.Now?.Precipitation;
      const windElem = station.WeatherElement.WindElement?.WindSpeed;
      rain = parseFloat(rainElem) || 0;
      if (rain < 0) rain = 0; // Negative means trace or error
      windSpeed = parseFloat(windElem) || 0;
    } else if (station.weatherElement) {
      // A0003 schema (Manual stations)
      const wElems = station.weatherElement;
      // Priority: RAIN (60min) > MIN_10 (10min) > others
      const rainElem = wElems.find(e => e.elementName === 'RAIN') || 
                       wElems.find(e => e.elementName === 'MIN_10') ||
                       wElems.find(e => e.elementName === 'NOW');
      
      const windElem = wElems.find(e => e.elementName === 'WDSD');
      
      rain = parseFloat(rainElem?.elementValue) || 0;
      // If it's MIN_10, we might want to scale it to mm/hr, but let's keep it simple for now
      if (rainElem?.elementName === 'MIN_10') rain = rain * 6; 
      
      if (rain < 0) rain = 0;
      windSpeed = parseFloat(windElem?.elementValue) || 0;
    }

    // Return in same units as forecast (rain_mm, wind_speed km/h)
    // Wind is usually m/s in observation, convert to km/h
    return {
      rain_mm: rain, // Real-time rain (mm)
      wind_speed: Math.round(windSpeed * 3.6 * 10) / 10,
      timestamp: new Date().getTime(),
    };
  } catch (err) {
    return null;
  }
}
