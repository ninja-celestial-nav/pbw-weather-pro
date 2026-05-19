/**
 * B9: Skeleton loading animation
 */
export default function SkeletonLoader({ isLight = false }) {
  const block = isLight ? 'bg-slate-200/60' : 'bg-white/[0.05]';
  const panel = isLight ? 'bg-slate-100/80 border-slate-200/60' : 'bg-white/[0.03] border-white/[0.06]';
  const inner = isLight ? 'bg-slate-200/80' : 'bg-white/[0.06]';
  const innerSm = isLight ? 'bg-slate-200/60' : 'bg-white/[0.04]';
  return (
    <div className="animate-pulse space-y-5">
      {/* Location toggle skeleton */}
      <div className="flex justify-center">
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-14 w-48 rounded-xl ${block}`} />
          ))}
        </div>
      </div>

      {/* Summary skeleton */}
      <div className={`h-20 rounded-2xl border ${panel}`} />

      {/* Best time skeleton */}
      <div className={`h-24 rounded-2xl border ${panel}`} />

      {/* Main grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map(i => (
          <div key={i} className={`rounded-2xl border p-5 ${panel}`}>
            <div className={`h-4 w-32 rounded mb-4 ${inner}`} />
            <div className={`h-48 rounded-xl ${innerSm}`} />
          </div>
        ))}
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`h-20 rounded-xl border ${panel}`} />
        ))}
      </div>

      {/* Chart skeleton */}
      <div className={`h-64 rounded-2xl border ${panel}`} />

      {/* Shimmer overlay */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-pulse > div {
          background-image: linear-gradient(90deg, transparent 0%, ${isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)'} 50%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
