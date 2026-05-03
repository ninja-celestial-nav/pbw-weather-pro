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
  humidity: {
    icon: Droplets,
    label: '濕度',
    unit: '%',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-400',
    format: (v) => Math.round(v),
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

function SingleCard({ type, value }) {
  const config = cardConfigs[type];
  if (!config) return null;
  const Icon = config.icon;
  const display = config.format(value);

  return (
    <div className={`
      relative overflow-hidden rounded-xl p-4 
      bg-gradient-to-br ${config.gradient}
      border border-white/5 backdrop-blur-md
      hover:border-white/10 transition-all duration-300
      group hover:scale-[1.02]
    `}>
      {/* Background glow */}
      <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/5 blur-xl group-hover:bg-white/8 transition-all"/>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-slate-400 mb-1 tracking-wide uppercase">{config.label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{display}</span>
            <span className="text-sm text-slate-400">{config.unit}</span>
          </div>
          {config.getLevel && (
            <span className={`text-[10px] font-medium mt-1 ${config.getLevelColor(value)}`}>
              {config.getLevel(value)}
            </span>
          )}
        </div>
        <Icon size={24} className={`${config.iconColor} opacity-60 group-hover:opacity-80 transition-opacity`} />
      </div>
    </div>
  );
}

export default function WeatherCards({ weather }) {
  if (!weather) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <SingleCard type="temp" value={weather.temp} />
      <SingleCard type="humidity" value={weather.humidity} />
      <SingleCard type="uv" value={weather.uv_index} />
      <SingleCard type="cloud" value={weather.cloud_coverage} />
    </div>
  );
}
