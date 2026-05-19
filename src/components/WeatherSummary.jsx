/**
 * B2: Weather summary card with CWA text + AI advice
 * B3: Animated weather icon
 */


/** B3: Animated SVG weather icons */
function WeatherIcon({ code, size = 48 }) {
  const c = parseInt(code) || 1;

  // Sun
  if (c <= 1) return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="weather-icon">
      <circle cx="32" cy="32" r="12" fill="#fbbf24" className="animate-sun-pulse" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <line key={i}
            x1={32 + 17 * Math.cos(rad)} y1={32 + 17 * Math.sin(rad)}
            x2={32 + 23 * Math.cos(rad)} y2={32 + 23 * Math.sin(rad)}
            stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" opacity="0.8"
            className="animate-sun-ray" style={{ animationDelay: `${i * 0.1}s` }}
          />
        );
      })}
    </svg>
  );

  // Partly cloudy (2-3)
  if (c <= 3) return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="weather-icon">
      <circle cx="22" cy="24" r="8" fill="#fbbf24" opacity="0.9" className="animate-sun-pulse" />
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return <line key={i} x1={22 + 11 * Math.cos(rad)} y1={24 + 11 * Math.sin(rad)} x2={22 + 14 * Math.cos(rad)} y2={24 + 14 * Math.sin(rad)} stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />;
      })}
      <ellipse cx="36" cy="38" rx="16" ry="10" fill="#94a3b8" opacity="0.7" className="animate-cloud-drift" />
      <ellipse cx="28" cy="36" rx="12" ry="8" fill="#cbd5e1" opacity="0.6" className="animate-cloud-drift" style={{ animationDelay: '1s' }} />
    </svg>
  );

  // Cloudy (4-6)
  if (c <= 6) return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="weather-icon">
      <ellipse cx="30" cy="32" rx="18" ry="12" fill="#94a3b8" opacity="0.6" className="animate-cloud-drift" />
      <ellipse cx="36" cy="36" rx="16" ry="10" fill="#cbd5e1" opacity="0.7" className="animate-cloud-drift" style={{ animationDelay: '0.5s' }} />
      <ellipse cx="24" cy="38" rx="14" ry="9" fill="#64748b" opacity="0.5" className="animate-cloud-drift" style={{ animationDelay: '1s' }} />
    </svg>
  );

  // Overcast (7)
  if (c === 7) return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="weather-icon">
      <ellipse cx="32" cy="30" rx="22" ry="13" fill="#64748b" opacity="0.7" className="animate-cloud-drift" />
      <ellipse cx="28" cy="36" rx="18" ry="10" fill="#475569" opacity="0.8" className="animate-cloud-drift" style={{ animationDelay: '0.5s' }} />
    </svg>
  );

  // Rain (8-13, no thunder)
  if (c >= 8 && c <= 13) return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="weather-icon">
      <ellipse cx="32" cy="24" rx="18" ry="11" fill="#64748b" opacity="0.7" />
      <ellipse cx="26" cy="26" rx="14" ry="9" fill="#475569" opacity="0.8" />
      {[20, 28, 36, 44].map((x, i) => (
        <line key={i} x1={x} y1={38} x2={x - 3} y2={50} stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" opacity="0.7"
          className="animate-rain-drop" style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
    </svg>
  );

  // Thunder (14-16, 19-20, 23, 26, 31-35)
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="weather-icon">
      <ellipse cx="32" cy="22" rx="20" ry="12" fill="#475569" opacity="0.8" />
      <ellipse cx="26" cy="24" rx="16" ry="10" fill="#374151" opacity="0.9" />
      <polygon points="30,30 26,42 32,42 28,54" fill="#fbbf24" opacity="0.9" className="animate-lightning" />
      {[22, 38].map((x, i) => (
        <line key={i} x1={x} y1={36} x2={x - 2} y2={46} stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"
          className="animate-rain-drop" style={{ animationDelay: `${i * 0.3}s` }} />
      ))}
    </svg>
  );
}

/** Mini weather icon for trend chart */
export function MiniWeatherIcon({ code, size = 20 }) {
  const c = parseInt(code) || 1;
  if (c <= 1) return <span style={{ fontSize: size * 0.8 }}>☀️</span>;
  if (c <= 3) return <span style={{ fontSize: size * 0.8 }}>🌤️</span>;
  if (c <= 6) return <span style={{ fontSize: size * 0.8 }}>☁️</span>;
  if (c === 7) return <span style={{ fontSize: size * 0.8 }}>🌥️</span>;
  if ((c >= 14 && c <= 16) || (c >= 19 && c <= 20) || c === 23 || c === 26 || c >= 31) return <span style={{ fontSize: size * 0.8 }}>⛈️</span>;
  if (c >= 8) return <span style={{ fontSize: size * 0.8 }}>🌧️</span>;
  return <span style={{ fontSize: size * 0.8 }}>🌤️</span>;
}

export default function WeatherSummary({ weather, ppi, isLight = false }) {
  if (!weather || !ppi) return null;

  return (
    <div className={`mb-5 rounded-2xl border backdrop-blur-xl p-4 flex items-center gap-4 ${isLight ? 'bg-white/80 border-slate-200/60 shadow-sm' : 'border-white/[0.06] bg-white/[0.03]'}`}>
      <WeatherIcon code={weather.weather_code} size={56} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>{weather.weather_text || '—'}</span>
          {weather.is_thunder && (
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold border border-amber-500/30">⚡ 雷</span>
          )}
        </div>
        <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{ppi.advice}</p>
        {weather.comfort_desc && (
          <p className="text-[10px] text-slate-500 mt-0.5">舒適度：{weather.comfort_desc} · 體感 {weather.feels_like}°C</p>
        )}
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="text-2xl font-bold" style={{ color: ppi.color }}>{ppi.score}</div>
        <div className="text-[9px] font-semibold tracking-wide" style={{ color: ppi.color }}>{ppi.category}</div>
      </div>
    </div>
  );
}

export { WeatherIcon };
