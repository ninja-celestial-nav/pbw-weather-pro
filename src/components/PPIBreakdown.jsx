import { Wind, CloudRain, Cloud, Thermometer, Droplets } from 'lucide-react';

const metrics = [
  { key: 'windScore', label: '風力', weight: '55%', icon: Wind, colorFrom: '#ef4444', colorTo: '#22c55e' },
  { key: 'rainScore', label: '降雨', weight: '25%', icon: CloudRain, colorFrom: '#ef4444', colorTo: '#3b82f6' },
  { key: 'cloudScore', label: '雲量', weight: '8%', icon: Cloud, colorFrom: '#6b7280', colorTo: '#a78bfa' },
  { key: 'heatScore', label: '體感', weight: '7%', icon: Thermometer, colorFrom: '#ef4444', colorTo: '#f59e0b' },
  { key: 'groundScore', label: '地面', weight: '5%', icon: Droplets, colorFrom: '#3b82f6', colorTo: '#10b981' },
];

export default function PPIBreakdown({ ppi }) {
  if (!ppi) return null;

  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Score Breakdown</p>
      {metrics.map(({ key, label, weight, icon: Icon, colorTo }) => {
        const value = ppi[key] ?? 0;
        return (
          <div key={key} className="flex items-center gap-2">
            <Icon size={12} className="text-slate-500 flex-shrink-0" />
            <span className="text-[10px] text-slate-400 w-14 flex-shrink-0">{label} ({weight})</span>
            <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${value}%`,
                  background: `linear-gradient(90deg, ${colorTo}80, ${colorTo})`,
                  boxShadow: `0 0 6px ${colorTo}40`,
                }}
              />
            </div>
            <span className="text-[10px] font-semibold text-slate-300 w-7 text-right">{value}</span>
          </div>
        );
      })}
    </div>
  );
}
