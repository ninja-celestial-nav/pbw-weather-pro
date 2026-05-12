import { ServerCrash, RefreshCw } from 'lucide-react';

export default function ApiErrorState({ isLight, onRetry, error }) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border backdrop-blur-xl ${
      isLight 
        ? 'bg-white/80 border-slate-200 shadow-sm' 
        : 'bg-white/[0.03] border-white/[0.06]'
    }`}>
      <div className={`w-16 h-16 flex items-center justify-center rounded-2xl mb-6 shadow-lg ${
        isLight
          ? 'bg-red-100 text-red-500 shadow-red-500/20'
          : 'bg-gradient-to-br from-red-500/20 to-orange-500/20 text-red-400 shadow-red-500/10'
      }`}>
        <ServerCrash size={32} />
      </div>
      
      <h2 className={`text-xl sm:text-2xl font-bold mb-3 ${
        isLight ? 'text-slate-800' : 'text-white'
      }`}>
        資料來源伺服器維護中
      </h2>
      
      <p className={`max-w-md mx-auto mb-8 text-sm leading-relaxed ${
        isLight ? 'text-slate-500' : 'text-slate-400'
      }`}>
        目前中央氣象署 (CWA) 的開放資料 API 伺服器沒有回應。這通常是因為政府伺服器正在進行例行性維護或發生暫時性連線異常。<br/>
        <br/>
        請稍後再試，系統將會嘗試重新連線。
        <br/>
        <span className="text-xs opacity-70 mt-4 block font-mono">
          錯誤詳細: {error || 'API 連線失敗 (502 Bad Gateway)'}
        </span>
      </p>

      <button
        onClick={onRetry}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
          isLight
            ? 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20'
            : 'bg-white text-slate-900 hover:bg-slate-200 hover:shadow-lg hover:shadow-white/20'
        }`}
      >
        <RefreshCw size={18} />
        <span>重新嘗試連線</span>
      </button>
    </div>
  );
}
