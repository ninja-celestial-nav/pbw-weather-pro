import { Thermometer, Droplets, Sun, Cloud } from 'lucide-react';

const cardConfigs = {
  temp: {
    icon: Thermometer,
    label: '溫度',
    unit: '°C',
    gradient: 'from-orange-500/20 to-red-500/20',
    iconColor: 'text-orange-400',
    format: (v) => v?.toFixed(1),
  },
  feels_like: {
    icon: Thermometer,
    label: '體感溫度',
    unit: '°C',
    gradient: 'from-amber-500/20 to-orange-500/20',
    iconColor: 'text-amber-400',
    format: (v) => v?.toFixed(1),
    getLevel: (v) => v > 35 ? '酷熱' : v > 30 ? '悶熱' : v > 25 ? '溫暖' : v > 18 ? '舒適' : v > 10 ? '涼爽' : '寒冷',
    getLevelColor: (v) => v > 35 ? 'text-red-400' : v > 30 ? 'text-orange-400' : v > 25 ? 'text-amber-400' : v > 18 ? 'text-emerald-400' : v > 10 ? 'text-blue-300' : 'text-blue-500',
  },
  humidity: {
    icon: Droplets,
    label: '濕度',
    unit: '%',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-400',
    format: (v) => Math.round(v),
    getLevel: (v) => v > 90 ? '地面潮' : v > 80 ? '偏高' : v > 60 ? '適中' : '乾爽',
    getLevelColor: (v) => v > 90 ? 'text-red-400' : v > 80 ? 'text-amber-400' : v > 60 ? 'text-emerald-400' : 'text-blue-300',
  },
  uv: {
    icon: Sun,
    label: 'UV 指數',
    unit: '',
    gradient: 'from-yellow-500/20 to-amber-500/20',
    iconColor: 'text-yellow-400',
    format: (v) => v?.toFixed(1),
    getLevel: (v) => v > 8 ? '極強' : v > 5 ? '強' : v > 3 ? '中' : '弱',
    getLevelColor: (v) => v > 8 ? 'text-red-400' : v > 5 ? 'text-orange-400' : v > 3 ? 'text-yellow-400' : 'text-green-400',
  },
  cloud: {
    icon: Cloud,
    label: '雲量',
    unit: '%',
    gradient: 'from-slate-500/20 to-indigo-500/20',
    iconColor: 'text-slate-400',
    format: (v) => Math.round(v),
  },
};

function SingleCard({ type, value, isLight }) {
  const config = cardConfigs[type];
  if (!config) return null;
  const Icon = config.icon;
  const display = config.format(value);

  return (
    <div className={`
      relative overflow-hidden rounded-xl p-3.5
      bg-gradient-to-br ${config.gradient}
      border ${isLight ? 'border-slate-200/60 shadow-sm' : 'border-white/5'} backdrop-blur-md
      ${isLight ? 'hover:border-slate-300' : 'hover:border-white/10'} transition-all duration-300
      group hover:scale-[1.02]
    `}>
      <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full blur-xl transition-all ${isLight ? 'bg-black/3 group-hover:bg-black/5' : 'bg-white/5 group-hover:bg-white/8'}`}/>

      <div className="flex items-center justify-between">
        <div>
          <p className={`text-[10px] mb-0.5 tracking-wide uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{config.label}</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-xl font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{display}</span>
            <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>{config.unit}</span>
          </div>
          {config.getLevel && (
            <span className={`text-[9px] font-medium mt-0.5 ${config.getLevelColor(value)}`}>
              {config.getLevel(value)}
            </span>
          )}
        </div>
        <Icon size={22} className={`${config.iconColor} opacity-50 group-hover:opacity-70 transition-opacity`} />
      </div>
    </div>
  );
}

export default function WeatherCards({ weather, isLight = false }) {
  if (!weather) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <SingleCard type="temp" value={weather.temp} isLight={isLight} />
      <SingleCard type="feels_like" value={weather.feels_like} isLight={isLight} />
      <SingleCard type="humidity" value={weather.humidity} isLight={isLight} />
      <SingleCard type="uv" value={weather.uv_index} isLight={isLight} />
      <SingleCard type="cloud" value={weather.cloud_coverage} isLight={isLight} />
    </div>
  );
}
