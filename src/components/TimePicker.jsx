import { useMemo } from 'react';
import { Calendar, Clock, RotateCcw } from 'lucide-react';
import { getTaipeiNow, toTaipeiDate, getTaipeiHour } from '../api/cwaApi';

const DAY_LABELS = ['今天', '明天', '後天'];

export default function TimePicker({ targetTime, onTimeChange, isLight = false }) {
  const now = getTaipeiNow();
  
  // Determine current selection state
  const isNow = targetTime === null;
  const selectedDate = targetTime || now;
  
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const selStart = new Date(selectedDate);
  selStart.setHours(0, 0, 0, 0);
  const selectedDayOffset = isNow ? 0 : Math.round((selStart - todayStart) / (1000 * 60 * 60 * 24));
  const selectedHour = isNow ? getTaipeiHour(now) : getTaipeiHour(selectedDate);

  // Generate day options
  const currentDate = now.getDate();
  const days = useMemo(() => {
    return [0, 1, 2].map(offset => {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      return {
        offset,
        label: DAY_LABELS[offset],
        dateStr: d.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', timeZone: 'Asia/Taipei' }),
        weekday: d.toLocaleDateString('zh-TW', { weekday: 'short', timeZone: 'Asia/Taipei' }),
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Only recompute when the calendar date changes, not every second
  }, [currentDate]);

  // Generate hour slots
  const hours = useMemo(() => {
    const slots = [];
    for (let h = 6; h <= 21; h++) {
      slots.push(h);
    }
    return slots;
  }, []);

  function handleDaySelect(offset) {
    const d = toTaipeiDate(offset, selectedHour);
    // Don't allow past times for today
    const currentTaipeiHour = getTaipeiHour(now);
    if (offset === 0 && selectedHour < currentTaipeiHour) {
      onTimeChange(toTaipeiDate(0, currentTaipeiHour));
    } else {
      onTimeChange(d);
    }
  }

  function handleHourSelect(hour) {
    onTimeChange(toTaipeiDate(selectedDayOffset, hour));
  }

  function handleReset() {
    onTimeChange(null);
  }

  return (
    <div className={`backdrop-blur-xl border rounded-2xl p-4 ${isLight ? 'bg-white/80 border-slate-200/60 shadow-sm' : 'bg-white/[0.03] border-white/[0.06]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-indigo-400" />
          <span className={`text-xs font-medium ${isLight ? 'text-slate-800' : 'text-white'}`}>預測時間選擇</span>
          {!isNow && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">
              預測模式
            </span>
          )}
        </div>
        {!isNow && (
          <button
            onClick={handleReset}
            className={`flex items-center gap-1 text-[10px] transition-colors px-2 py-1 rounded-lg cursor-pointer ${isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <RotateCcw size={10} />
            回到即時
          </button>
        )}
      </div>

      {/* Day selector */}
      <div className="flex gap-2 mb-3">
        {days.map(day => {
          const isActive = !isNow && selectedDayOffset === day.offset;
          return (
            <button
              key={day.offset}
              onClick={() => handleDaySelect(day.offset)}
              className={`
                flex-1 py-2 px-3 rounded-xl text-center transition-all duration-200 cursor-pointer
                ${isActive
                  ? 'bg-indigo-600/40 border border-indigo-500/40 text-white shadow-lg shadow-indigo-500/10'
                  : isLight
                    ? 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                    : 'bg-white/[0.03] border border-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.06]'
                }
              `}
            >
              <div className="text-xs font-semibold">{day.label}</div>
              <div className="text-[10px] opacity-60">{day.dateStr} {day.weekday}</div>
            </button>
          );
        })}
      </div>

      {/* Hour selector */}
      <div className="flex items-center gap-2 mb-2">
        <Clock size={12} className="text-slate-500" />
        <span className="text-[10px] text-slate-500">選擇時段</span>
      </div>
      <div className="grid grid-cols-8 gap-1.5">
        {hours.map(h => {
          const isActive = !isNow && selectedHour === h;
          const isPast = selectedDayOffset === 0 && h < getTaipeiHour(now);
          // Color code by time of day
          const period = h < 10 ? 'text-amber-400' : h < 14 ? 'text-yellow-300' : h < 17 ? 'text-orange-400' : 'text-indigo-300';
          
          return (
            <button
              key={h}
              onClick={() => !isPast && handleHourSelect(h)}
              disabled={isPast}
              className={`
                py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 cursor-pointer
                ${isActive
                  ? 'bg-indigo-600/50 border border-indigo-500/40 text-white'
                  : isPast
                    ? isLight ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-white/[0.01] text-slate-700 cursor-not-allowed'
                    : isLight
                      ? `bg-slate-50 border border-transparent hover:border-slate-200 ${period} hover:bg-slate-100`
                      : `bg-white/[0.02] border border-transparent hover:border-white/10 ${period} hover:bg-white/[0.05]`
                }
              `}
            >
              {String(h).padStart(2, '0')}
            </button>
          );
        })}
      </div>

      {/* Current selection display */}
      <div className={`mt-3 pt-3 border-t flex items-center justify-center gap-2 ${isLight ? 'border-slate-200' : 'border-white/[0.04]'}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${isNow ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'}`} />
        <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          {isNow ? (
            <>即時分析 · <span className={isLight ? 'text-slate-800' : 'text-white'}>{String(getTaipeiHour(now)).padStart(2,'0')}:{String(now.getMinutes()).padStart(2,'0')}</span></>
          ) : (
            <>預測分析 · <span className="text-indigo-300">{days[selectedDayOffset]?.label} {String(selectedHour).padStart(2,'0')}:00</span></>
          )}
        </span>
      </div>
    </div>
  );
}
