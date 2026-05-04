/**
 * C6: Cross-validation confidence badge
 */
export default function CrossValidationBadge({ crossValidation }) {
  if (!crossValidation) return null;

  const { confidence, label, color, tempDiff, windDiff, popDiff, openMeteo } = crossValidation;

  return (
    <div className="mb-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">🔬 資料交叉驗證</span>
          <span className="text-[9px] text-slate-600">CWA vs Open-Meteo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[10px] font-semibold" style={{ color }}>{label}</span>
          <span className="text-[10px] text-slate-500">信心 {confidence}%</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-[9px] text-slate-500 mb-0.5">溫度差</div>
          <div className={`text-sm font-bold ${tempDiff <= 1.5 ? 'text-emerald-400' : tempDiff <= 3 ? 'text-amber-400' : 'text-red-400'}`}>
            ±{tempDiff}°C
          </div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-slate-500 mb-0.5">風速差</div>
          <div className={`text-sm font-bold ${windDiff <= 3 ? 'text-emerald-400' : windDiff <= 6 ? 'text-amber-400' : 'text-red-400'}`}>
            ±{windDiff} km/h
          </div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-slate-500 mb-0.5">降雨機率差</div>
          <div className={`text-sm font-bold ${popDiff <= 10 ? 'text-emerald-400' : popDiff <= 20 ? 'text-amber-400' : 'text-red-400'}`}>
            ±{popDiff}%
          </div>
        </div>
      </div>
    </div>
  );
}
