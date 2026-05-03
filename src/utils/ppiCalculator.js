/**
 * Pickleball Playability Index (PPI) Calculator
 * 
 * Calculates a 0-100 score based on weather conditions:
 *   - Wind (60% weight): Ideal < 12km/h, Challenging 12-25km/h, Unplayable > 32km/h
 *   - Rain (30% weight): Instant 0 if Rain > 0.5mm/hr or PoP > 40%
 *   - UV/Cloud (10% weight): More clouds = better (reduces glare)
 */

/**
 * Calculate wind sub-score (0-100)
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

/**
 * Calculate rain sub-score (0-100)
 * Instant zero if rain > 0.5mm/hr or PoP > 40%
 */
function calcRainScore(rainMm, pop) {
  if (rainMm > 0.5 || pop > 40) return 0;
  
  // Gradual reduction as conditions approach thresholds
  let score = 100;
  if (rainMm > 0) {
    score -= (rainMm / 0.5) * 40; // up to -40 for rain approaching 0.5mm
  }
  if (pop > 20) {
    score -= ((pop - 20) / 20) * 30; // up to -30 for PoP approaching 40%
  }
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate UV/Cloud sub-score (0-100)
 * More cloud coverage = better for outdoor play (reduces glare)
 */
function calcCloudScore(cloudCoverage) {
  // Sweet spot: 40-70% cloud coverage
  if (cloudCoverage >= 40 && cloudCoverage <= 70) return 100;
  if (cloudCoverage < 40) return 60 + cloudCoverage; // 60-100
  if (cloudCoverage > 70) return 100 - (cloudCoverage - 70) * 1.5; // drops for heavy overcast (rain likely)
  return 50;
}

/**
 * Main PPI calculation
 * @returns {{ score: number, category: string, color: string, windScore: number, rainScore: number, cloudScore: number }}
 */
export function calculatePPI({ wind_speed, wind_gust, rain_mm, pop, cloud_coverage }) {
  const windScore = calcWindScore(wind_speed, wind_gust);
  const rainScore = calcRainScore(rain_mm, pop);
  const cloudScore = calcCloudScore(cloud_coverage);

  // If rain kills it, the whole score drops dramatically
  let score;
  if (rainScore === 0) {
    score = Math.min(15, windScore * 0.15); // Essentially unplayable
  } else {
    score = windScore * 0.6 + rainScore * 0.3 + cloudScore * 0.1;
  }

  score = Math.round(Math.max(0, Math.min(100, score)));

  let category, color;
  if (score >= 80) {
    category = 'Excellent';
    color = '#22c55e'; // green
  } else if (score >= 60) {
    category = 'Good';
    color = '#84cc16'; // lime
  } else if (score >= 40) {
    category = 'Fair';
    color = '#eab308'; // yellow
  } else if (score >= 20) {
    category = 'Poor';
    color = '#f97316'; // orange
  } else {
    category = 'Unplayable';
    color = '#ef4444'; // red
  }

  return { score, category, color, windScore, rainScore, cloudScore };
}

/**
 * Get gradient colors for the gauge based on score zones
 */
export function getGaugeGradient() {
  return [
    { offset: 0, color: '#ef4444' },     // 0 - red
    { offset: 0.2, color: '#f97316' },   // 20 - orange
    { offset: 0.4, color: '#eab308' },   // 40 - yellow
    { offset: 0.6, color: '#84cc16' },   // 60 - lime
    { offset: 0.8, color: '#22c55e' },   // 80 - green
    { offset: 1, color: '#10b981' },     // 100 - emerald
  ];
}
