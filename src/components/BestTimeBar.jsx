/**
 * B4: Best time recommendation (C1: clickable → jumps to TimePicker)
 * B10: Rain countdown timer
 */
import { MiniWeatherIcon } from './WeatherSummary';

export default function BestTimeBar({ bestTimes, trend, onSelectTime }) {
  if (!bestTimes || !bestTimes.allHours?.length) return null;

  const { best, topHours, allHours } = bestTimes;

  const firstRain = trend?.find(t => t.pop > 40 || t.rain_mm > 0.3);
  const firstClear = trend?.find(t => t.pop <= 20 && t.rain_mm <= 0.1);

  function handleHourClick(targetTime) {
    if (onSelectTime && targetTime) {
      onSelectTime(targetTime);
    }
  }

  return (
    <div className="mb-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">⭐ 今日最佳時段</span>
          <span className="text-[8px] text-slate-600">點擊可查看</span>
        </div>
        {best && (
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="text-slate-500">推薦</span>
            <span className="font-bold text-emerald-400">{best.hour}:00</span>
            <span className="text-slate-500">PPI</span>
            <span className="font-bold" style={{ color: best.color }}>{best.ppi}</span>
          </div>
        )}
      </div>

      {/* C1: Clickable hour strip */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {allHours.map(({ hour, targetTime, ppi, color, category, weather }) => {
          const isTop = topHours.some(t => t.hour === hour);
          const isBest = best?.hour === hour;
          return (
            <button
              key={hour}
              onClick={() => handleHourClick(targetTime)}
              className={`
                flex-shrink-0 flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg transition-all cursor-pointer
                hover:bg-white/[0.08] hover:scale-105 active:scale-95
                ${isBest ? 'bg-emerald-500/15 border border-emerald-500/30 scale-105' : isTop ? 'bg-white/[0.04]' : 'opacity-50 hover:opacity-80'}
              `}
            >
              <MiniWeatherIcon code={weather?.weather_code} size={14} />
              <div className="text-[9px] text-slate-400">{String(hour).padStart(2, '0')}</div>
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {ppi}
              </div>
              {isBest && <div className="text-[7px] text-emerald-400 font-bold">⭐</div>}
            </button>
          );
        })}
      </div>

      {firstRain && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <span className="text-blue-400 text-xs">🌧️</span>
          <span className="text-[10px] text-blue-300">
            預計 {firstRain.time} 開始降雨 (PoP {firstRain.pop}%)
          </span>
          {firstClear && firstClear.hour > firstRain.hour && (
            <span className="text-[10px] text-emerald-400 ml-auto">
              🌤️ {firstClear.time} 放晴
            </span>
          )}
        </div>
      )}
    </div>
  );
}
