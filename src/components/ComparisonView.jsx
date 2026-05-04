/**
 * B1: 3-location comparison view
 * C9: 24hr PPI sparkline in each card
 */
export default function ComparisonView({ comparison, activeLocation, onSelectLocation }) {
  if (!comparison || Object.keys(comparison).length < 2) return null;

  const locations = Object.entries(comparison).sort((a, b) => b[1].ppi.score - a[1].ppi.score);
  const bestLocId = locations[0]?.[0];

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">📍 場地比較</span>
        <span className="text-[9px] text-slate-600">即時 PPI 排名</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {locations.map(([locId, data]) => {
          const isActive = locId === activeLocation;
          const isBest = locId === bestLocId;
          const { ppi, weather, location, history } = data;

          return (
            <button
              key={locId}
              onClick={() => onSelectLocation(locId)}
              className={`
                relative overflow-hidden rounded-xl p-3 text-left transition-all duration-300 cursor-pointer
                border backdrop-blur-md group
                ${isActive
                  ? 'border-indigo-500/40 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                  : 'border-white/[0.06] bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.05]'}
              `}
            >
              {/* C12: Venue photo background with gradient overlay */}
              <div 
                className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity bg-cover bg-center"
                style={{ backgroundImage: `url(/images/${locId}.png)` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              
              <div className="relative z-10">
                {isBest && (
                  <div className="absolute top-0 right-0 px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[8px] font-bold border border-emerald-500/30">
                    最佳 ⭐
                  </div>
                )}

              <div className="flex items-center gap-2.5 mb-2">
                <div className="relative w-11 h-11 flex-shrink-0">
                  <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
                    <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                    <circle
                      cx="22" cy="22" r="18" fill="none"
                      stroke={ppi.color}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${(ppi.score / 100) * 113} 113`}
                      style={{ filter: `drop-shadow(0 0 4px ${ppi.color}40)` }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                    {ppi.score}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-white truncate">{location.nameShort}</p>
                  <p className="text-[9px] text-slate-500 truncate">{location.terrain}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px]">
                <div className="text-slate-500">風速</div>
                <div className="text-right text-slate-300">{weather.wind_speed} km/h</div>
                <div className="text-slate-500">降雨</div>
                <div className="text-right text-slate-300">{weather.pop}%</div>
                <div className="text-slate-500">溫度</div>
                <div className="text-right text-slate-300">{weather.temp}°C</div>
              </div>

              {/* C9: Mini sparkline */}
              {history && history.length > 3 && (
                <div className="mt-2 pt-1.5 border-t border-white/[0.04]">
                  <Sparkline data={history.slice(-24)} color={ppi.color} />
                </div>
              )}

              <div className="mt-2 text-center text-[9px] font-semibold py-0.5 rounded" style={{ color: ppi.color, backgroundColor: `${ppi.color}15` }}>
                {ppi.category}
              </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** C9: Mini sparkline SVG */
function Sparkline({ data, color, width = '100%', height = 20 }) {
  if (!data || data.length < 2) return null;

  const scores = data.map(d => d.s);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;

  const w = 100;
  const h = height;
  const points = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * w;
    const y = h - ((s - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
