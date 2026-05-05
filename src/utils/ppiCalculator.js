/**
 * Pickleball Playability Index (PPI) Calculator v2
 * 
 * Weights:
 * Weights (Rain-Priority v3):
 *   - Rain (70%): Main factor. Instant 0 if Rain > 0.8mm/hr or PoP > 70%
 *   - Wind (15%): Secondary factor. Ideal < 12km/h
 *   - Cloud/UV (5%): Aesthetic factor.
 *   - Heat (5%): Comfort factor.
 *   - Ground (5%): Wetness/Safety factor.
 * 
 * Modifiers: Thunderstorm penalty, Ground wetness penalty
 */

function calcWindScore(windSpeed, windGust) {
  const effectiveWind = Math.max(windSpeed, windGust * 0.6);

  if (effectiveWind <= 8) return 100;
  if (effectiveWind <= 12) return 90 - (effectiveWind - 8) * 2.5;
  if (effectiveWind <= 20) return 80 - (effectiveWind - 12) * 4;
  if (effectiveWind <= 25) return 48 - (effectiveWind - 20) * 6;
  if (effectiveWind <= 32) return 18 - (effectiveWind - 25) * 2.57;
  return 0;
}

function calcRainScore(rainMm, pop) {
  // Only zero out if actual rain is significant or PoP is high (70%+)
  if (rainMm > 0.8 || pop >= 70) return 0;

  let score = 100;
  if (rainMm > 0) score -= (rainMm / 0.5) * 50; // More aggressive rain penalty
  if (pop > 15) score -= ((pop - 15) / 45) * 100; // PoP penalty starts earlier (15%) and reaches 0 at 60%
  return Math.max(0, Math.min(100, score));
}

function calcCloudScore(cloudCoverage) {
  if (cloudCoverage >= 40 && cloudCoverage <= 70) return 100;
  if (cloudCoverage < 40) return 60 + cloudCoverage;
  if (cloudCoverage > 70) return 100 - (cloudCoverage - 70) * 1.5;
  return 50;
}

/** A5: Heat index score — feels-like temperature comfort */
function calcHeatScore(feelsLike) {
  if (feelsLike === undefined || feelsLike === null) return 80;
  // Ideal range: 18-28°C
  if (feelsLike >= 18 && feelsLike <= 28) return 100;
  if (feelsLike > 28 && feelsLike <= 33) return 100 - (feelsLike - 28) * 10; // 50 at 33°C
  if (feelsLike > 33 && feelsLike <= 38) return 50 - (feelsLike - 33) * 10;  // 0 at 38°C
  if (feelsLike > 38) return 0;
  if (feelsLike < 18 && feelsLike >= 10) return 100 - (18 - feelsLike) * 8;  // 36 at 10°C
  if (feelsLike < 10) return Math.max(0, 36 - (10 - feelsLike) * 7);
  return 50;
}

/** A6: Ground condition score — wetness from humidity + dew point */
function calcGroundScore(humidity, dewPoint, temp, rainMm) {
  let score = 100;
  const dewGap = (temp !== undefined && dewPoint !== undefined) ? (temp - dewPoint) : 5;

  // Ground is likely wet if dewpoint is very close to temp
  if (dewGap < 1) score -= 40;        // Fog/dew forming
  else if (dewGap < 2) score -= 25;   // Near condensation
  else if (dewGap < 3) score -= 10;

  // High humidity makes court slippery
  if (humidity > 95) score -= 30;
  else if (humidity > 90) score -= 15;
  else if (humidity > 85) score -= 5;

  // Recent rain lingers on ground
  if (rainMm > 0 && rainMm <= 0.3) score -= 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * Main PPI calculation v2
 */
export function calculatePPI(weather) {
  const {
    wind_speed = 0, wind_gust = 0,
    rain_mm = 0, pop = 0,
    cloud_coverage = 50,
    feels_like, humidity = 70, dew_point, temp = 25,
    is_thunder = false, is_ground_wet = false,
  } = weather;

  const windScore = calcWindScore(wind_speed, wind_gust);
  const rainScore = calcRainScore(rain_mm, pop);
  const cloudScore = calcCloudScore(cloud_coverage);
  
  // Guard against missing values
  const safeFeelsLike = (feels_like !== undefined && !isNaN(feels_like)) ? feels_like : temp;
  const safeDewPoint = (dew_point !== undefined && !isNaN(dew_point)) ? dew_point : (temp - 5);
  
  const heatScore = calcHeatScore(safeFeelsLike);
  const groundScore = calcGroundScore(humidity, safeDewPoint, temp, rain_mm);

  // A7: Thunderstorm handling — 3-tier system
  // Taiwan summer CWA常報「短暫陣雨或雷雨」，PoP 30-40% 很常見，不能直接歸零
  let thunderPenalty = 0;
  let thunderLevel = 'none'; // 'none' | 'watch' | 'warning' | 'danger'
  if (is_thunder) {
    if (pop > 70) {
      // 🔴 高機率雷暴 — 強烈不建議
      thunderPenalty = 0.7; // 扣 70%
      thunderLevel = 'danger';
    } else if (pop > 50) {
      // 🟠 中機率雷暴 — 注意
      thunderPenalty = 0.3; // 扣 30%
      thunderLevel = 'warning';
    } else if (pop > 30) {
      // 🟡 低機率雷暴 — 留意天氣變化
      thunderPenalty = 0.15; // 扣 15%
      thunderLevel = 'watch';
    }
    // PoP <= 30% 的雷暴預報幾乎只是「可能性」，不扣分
  }

  // Calculate weighted score (Rain-Priority)
  let score = rainScore * 0.70 + windScore * 0.15 + cloudScore * 0.05 + heatScore * 0.05 + groundScore * 0.05;

  // A8: Soft penalties instead of hard caps
  // Extreme wind penalty
  if (windScore < 20) score -= 15;

  // Ground wetness penalty
  if (is_ground_wet) score -= 15;

  // Apply thunder penalty (percentage reduction)
  if (thunderPenalty > 0) {
    score = score * (1 - thunderPenalty);
  }

  score = Math.round(Math.max(0, Math.min(100, score)));

  let category, color, advice;
  if (score >= 80) {
    category = 'Excellent'; color = '#22c55e';
    advice = '🟢 完美球天！風力適宜、場地乾燥';
  } else if (score >= 60) {
    category = 'Good'; color = '#84cc16';
    advice = '🟡 適合打球，風力稍大注意發球調整';
  } else if (score >= 40) {
    category = 'Fair'; color = '#eab308';
    advice = '🟠 堪打但需注意，風力影響球路明顯';
  } else if (score >= 20) {
    category = 'Poor'; color = '#f97316';
    advice = '🔴 不建議打球，條件惡劣';
  } else {
    category = 'Unplayable'; color = '#ef4444';
    advice = '⛔ 不適合打球！請改日再戰';
  }

  // Append thunder-specific advice
  if (thunderLevel === 'danger') {
    advice += ' ⚡ 雷暴高風險！強烈建議改期';
  } else if (thunderLevel === 'warning') {
    advice += ' ⚡ 有雷暴風險，隨時注意天氣變化';
  } else if (thunderLevel === 'watch') {
    advice += ' ⛅ 有雷陣雨機會，建議帶傘出門';
  }

  return {
    score, category, color,
    windScore: Math.round(windScore),
    rainScore: Math.round(rainScore),
    cloudScore: Math.round(cloudScore),
    heatScore: Math.round(heatScore),
    groundScore: Math.round(groundScore),
    isThunder: is_thunder,
    thunderLevel,
    advice,
  };
}

export function getGaugeGradient() {
  return [
    { offset: 0, color: '#ef4444' },
    { offset: 0.2, color: '#f97316' },
    { offset: 0.4, color: '#eab308' },
    { offset: 0.6, color: '#84cc16' },
    { offset: 0.8, color: '#22c55e' },
    { offset: 1, color: '#10b981' },
  ];
}
