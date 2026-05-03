/**
 * A7: Thunderstorm warning banner
 */
export default function ThunderstormBanner({ ppi, weather }) {
  if (!ppi?.isThunder || !weather?.is_thunder) return null;
  if (weather.pop <= 30) return null;

  return (
    <div className="mb-5 relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-950/60 via-orange-950/40 to-red-950/60 p-4 animate-pulse-slow">
      {/* Lightning bolts background */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <svg className="w-full h-full" viewBox="0 0 400 80">
          <path d="M50 0 L40 30 L55 30 L35 80" stroke="#fbbf24" strokeWidth="2" fill="none" opacity="0.5" />
          <path d="M150 10 L140 40 L155 40 L135 80" stroke="#fbbf24" strokeWidth="2" fill="none" opacity="0.3" />
          <path d="M300 5 L290 35 L305 35 L285 75" stroke="#fbbf24" strokeWidth="2" fill="none" opacity="0.4" />
        </svg>
      </div>

      <div className="relative flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-xl">
          ⚡
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-red-400">雷暴警告</span>
            <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[9px] font-bold border border-red-500/30">THUNDER ALERT</span>
          </div>
          <p className="text-xs text-red-300/80 mt-0.5">
            {weather.weather_text} · 降雨機率 {weather.pop}% · 請勿在開放場地活動
          </p>
        </div>
        <div className="text-2xl font-black text-red-500/60">⛈️</div>
      </div>
    </div>
  );
}
