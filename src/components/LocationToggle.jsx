import { MapPin, Mountain, Waves, TreePine } from 'lucide-react';

const locationMeta = {
  youth_park: { icon: Mountain, iconColor: 'text-emerald-400' },
  erchong: { icon: Waves, iconColor: 'text-cyan-400' },
  tianmu: { icon: TreePine, iconColor: 'text-lime-400' },
};

export default function LocationToggle({ activeLocation, onToggle, locations, isLight = false }) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 backdrop-blur-xl rounded-2xl p-1.5 border ${isLight ? 'bg-slate-100/80 border-slate-200/60' : 'bg-white/5 border-white/10'}`}>
      {Object.values(locations).map((loc) => {
        const isActive = activeLocation === loc.id;
        const meta = locationMeta[loc.id];
        const Icon = meta?.icon || Mountain;

        return (
          <button
            key={loc.id}
            onClick={() => onToggle(loc.id)}
            className={`
              relative flex items-center gap-2 px-4 py-2.5 rounded-xl
              transition-all duration-300 ease-out cursor-pointer
              ${isActive
                ? 'bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]'
                : isLight
                  ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }
            `}
          >
            <Icon size={16} className={isActive ? 'text-white' : (meta?.iconColor || 'text-slate-400')} />
            <div className="text-left">
              <div className={`text-xs font-semibold leading-tight ${isActive ? 'text-white' : isLight ? 'text-slate-700' : ''}`}>
                {loc.nameEn}
              </div>
              <div className={`text-[10px] leading-tight mt-0.5 ${isActive ? 'text-indigo-200' : isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                {loc.city} · {loc.terrain}
              </div>
            </div>
            <div className={`
              ml-1 flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full
              ${isActive ? 'bg-white/15 text-white/80' : isLight ? 'bg-slate-200/60 text-slate-400' : 'bg-white/5 text-slate-500'}
            `}>
              <MapPin size={8} />
              {loc.lat.toFixed(2)}°N
            </div>
          </button>
        );
      })}
    </div>
  );
}
