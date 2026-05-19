/**
 * A7: Thunderstorm warning banner — 3-tier severity
 * danger: PoP>70% — red banner, strong warning
 * warning: PoP 50-70% — orange banner
 * watch: PoP 30-50% — yellow subtle banner
 */
export default function ThunderstormBanner({ ppi, weather, isLight = false }) {
  if (!ppi || !weather) return null;
  const level = ppi.thunderLevel || 'none';
  if (level === 'none') return null;

  const config = {
    danger: {
      border: 'border-red-500/30',
      bg: 'from-red-950/60 via-orange-950/40 to-red-950/60',
      icon: '⛈️',
      badge: 'DANGER',
      badgeBg: 'bg-red-500/20 text-red-300 border-red-500/30',
      title: '雷暴警告',
      titleColor: 'text-red-400',
      descColor: 'text-red-300/80',
      animate: 'animate-pulse-slow',
    },
    warning: {
      border: 'border-orange-500/30',
      bg: 'from-orange-950/40 via-amber-950/30 to-orange-950/40',
      icon: '⚡',
      badge: 'WARNING',
      badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      title: '雷暴注意',
      titleColor: 'text-orange-400',
      descColor: 'text-orange-300/80',
      animate: '',
    },
    watch: {
      border: 'border-amber-500/20',
      bg: 'from-amber-950/20 via-yellow-950/10 to-amber-950/20',
      icon: '⛅',
      badge: 'WATCH',
      badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
      title: '雷雨留意',
      titleColor: 'text-amber-400',
      descColor: 'text-amber-300/70',
      animate: '',
    },
  };

  const c = config[level];
  if (!c) return null;

  return (
    <div className={`mb-5 relative overflow-hidden rounded-2xl border ${c.border} bg-gradient-to-r ${c.bg} p-4 ${c.animate}`}>
      <div className="relative flex items-center gap-3">
        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg ${isLight ? 'bg-black/5' : 'bg-white/5'}`}>
          {c.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${c.titleColor}`}>{c.title}</span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${c.badgeBg}`}>{c.badge}</span>
          </div>
          <p className={`text-xs ${c.descColor} mt-0.5`}>
            {weather.weather_text} · 降雨機率 {weather.pop}%
            {level === 'danger' && ' · 請勿在開放場地活動'}
            {level === 'warning' && ' · 隨時留意天氣變化'}
            {level === 'watch' && ' · 建議帶傘，留意午後變化'}
          </p>
        </div>
      </div>
    </div>
  );
}
