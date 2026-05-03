import { Wind, CloudRain, Eye } from 'lucide-react';

function ScoreBar({ label, score, icon: Icon, color, iconColor }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={14} className={iconColor} />
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[11px] text-slate-400">{label}</span>
          <span className="text-[11px] font-semibold" style={{ color }}>{Math.round(score)}</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${score}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}

export default function PPIBreakdown({ ppi }) {
  if (!ppi) return null;

  const items = [
    { label: '風力 (60%)', score: ppi.windScore, icon: Wind, color: '#22d3ee', iconColor: 'text-cyan-400' },
    { label: '降雨 (30%)', score: ppi.rainScore, icon: CloudRain, color: '#60a5fa', iconColor: 'text-blue-400' },
    { label: '雲量 (10%)', score: ppi.cloudScore, icon: Eye, color: '#a78bfa', iconColor: 'text-violet-400' },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">Score Breakdown</h3>
      <div className="space-y-3">
        {items.map(item => <ScoreBar key={item.label} {...item} />)}
      </div>
    </div>
  );
}
