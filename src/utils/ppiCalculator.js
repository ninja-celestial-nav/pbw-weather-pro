/**
 * Pickleball Playability Index (PPI) Calculator v2
 * 
 * Weights:
 *   - Wind (55%): Ideal < 12km/h, Challenging 12-25km/h, Unplayable > 32km/h
 *   - Rain (25%): Instant 0 if Rain > 0.5mm/hr or PoP > 40%
 *   - Cloud/UV (8%): 40-70% cloud = sweet spot
 *   - Heat (7%): Feels-like > 35°C or < 10°C = penalty
 *   - Ground (5%): Humidity+dewpoint → ground wetness penalty
 * 
 * Modifiers: Thunderstorm → instant kill
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
  if (rainMm > 0.5 || pop > 40) return 0;

  let score = 100;
  if (rainMm > 0) score -= (rainMm / 0.5) * 40;
  if (pop > 20) score -= ((pop - 20) / 20) * 30;
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
  const dewGap = temp - (dewPoint ?? temp - 5);

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
  const heatScore = calcHeatScore(feels_like);
  const groundScore = calcGroundScore(humidity, dew_point, temp, rain_mm);

  // A7: Thunderstorm instant kill
  if (is_thunder && pop > 30) {
    const thunderScore = Math.min(10, windScore * 0.1);
    return {
      score: Math.round(thunderScore),
      category: 'Unplayable',
      color: '#ef4444',
      windScore: Math.round(windScore),
      rainScore: 0,
      cloudScore: Math.round(cloudScore),
      heatScore: Math.round(heatScore),
      groundScore: Math.round(groundScore),
      isThunder: true,
      advice: '⚡ 雷暴警告！請勿在開放場地活動',
    };
  }

  // Calculate weighted score
  let score;
  if (rainScore === 0) {
    score = Math.min(15, windScore * 0.15);
  } else {
    score = windScore * 0.55 + rainScore * 0.25 + cloudScore * 0.08 + heatScore * 0.07 + groundScore * 0.05;
  }

  // Ground wetness modifier
  if (is_ground_wet) score = Math.min(score, 30);

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

  return {
    score, category, color,
    windScore: Math.round(windScore),
    rainScore: Math.round(rainScore),
    cloudScore: Math.round(cloudScore),
    heatScore: Math.round(heatScore),
    groundScore: Math.round(groundScore),
    isThunder: is_thunder,
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
