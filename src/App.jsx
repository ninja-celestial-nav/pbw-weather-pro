import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { RefreshCw, Radio, TrendingUp, Gauge, Compass, Activity, Sun, Moon, Video, Trash2 } from 'lucide-react';
import { useWeatherData } from './hooks/useWeatherData';
import { toTaipeiDate } from './api/cwaApi';
import LocationToggle from './components/LocationToggle';
import TimePicker from './components/TimePicker';
import PlayabilityGauge from './components/PlayabilityGauge';
import WindCompass from './components/WindCompass';
import RadarSimulation from './components/RadarSimulation';
import WeatherCards from './components/WeatherCards';
import PPIBreakdown from './components/PPIBreakdown';
import ThunderstormBanner from './components/ThunderstormBanner';
import ComparisonView from './components/ComparisonView';
import WeatherSummary from './components/WeatherSummary';
import BestTimeBar from './components/BestTimeBar';
import SkeletonLoader from './components/SkeletonLoader';
import CrossValidationBadge from './components/CrossValidationBadge';
import ToastContainer, { useToast } from './components/Toast';
import LiveCameraViewer from './components/LiveCameraViewer';

// C13: Lazy load the heavy chart component
const TrendChart = lazy(() => import('./components/TrendChart'));

// C4: URL state helpers
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const day = parseInt(params.get('day'));
  const hour = parseInt(params.get('hour'));
  return {
    loc: params.get('loc') || null,
    day: isNaN(day) ? null : day,
    hour: isNaN(hour) ? null : hour,
  };
}

function setUrlParams(loc, targetTime) {
  const params = new URLSearchParams();
  if (loc) params.set('loc', loc);
  if (targetTime) {
    const tHour = targetTime.getHours();
    const tClone = new Date(targetTime);
    const nowClone = new Date();
    const dayOffset = Math.round((tClone.setHours(0,0,0,0) - nowClone.setHours(0,0,0,0)) / (1000*60*60*24));
    if (dayOffset >= 0) params.set('day', dayOffset);
    params.set('hour', tHour);
  }
  const qs = params.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, '', url);
}

// C11: Live clock hook
function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function relativeTime(date) {
  if (!date) return '';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 10) return '剛剛';
  if (diff < 60) return `${diff}秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)}分鐘前`;
  return `${Math.floor(diff / 3600)}小時前`;
}

function SectionHeader({ icon: Icon, title, subtitle, isLight }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className={`p-1.5 rounded-lg ${isLight ? 'bg-indigo-100' : 'bg-white/5'}`}>
        <Icon size={14} className="text-indigo-400" />
      </div>
      <div>
        <h2 className={`text-sm font-semibold leading-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>{title}</h2>
        {subtitle && <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{subtitle}</p>}
      </div>
    </div>
  );
}

function GlassPanel({ children, className = '', isLight }) {
  return (
    <div className={`backdrop-blur-xl rounded-2xl p-5 ${isLight ? 'bg-white/80 border border-slate-200/60 shadow-sm' : 'bg-white/[0.03] border border-white/[0.06]'} ${className}`}>
      {children}
    </div>
  );
}

export default function App() {
  // C4: Init from URL
  const urlParams = getUrlParams();
  const [locationId, setLocationId] = useState(urlParams.loc || 'youth_park');
  const [targetTime, setTargetTime] = useState(() => {
    if (urlParams.day !== null && urlParams.hour !== null) {
      return toTaipeiDate(urlParams.day, urlParams.hour);
    }
    return null;
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('pbw_theme') || 'dark');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const {
    weather, ppi, trend, radar, location, loading, lastUpdate,
    dataSource, error, bestTimes, comparison, crossValidation, ppiHistory,
    refresh, locations,
  } = useWeatherData(locationId, targetTime);

  const { toasts, show: showToast } = useToast();
  const now = useLiveClock();
  const isLight = theme === 'light';

  // C4: Update URL when state changes
  useEffect(() => {
    setUrlParams(locationId, targetTime);
  }, [locationId, targetTime]);

  // C7: Theme persistence
  useEffect(() => {
    localStorage.setItem('pbw_theme', theme);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'light' ? '#f8fafc' : '#0a0e1a');
    }
  }, [theme]);

  // C2: Refresh with toast
  const handleRefresh = useCallback(async () => {
    await refresh();
    showToast('資料已更新', 'success');
  }, [refresh, showToast]);

  const handleClearCache = useCallback(() => {
    localStorage.clear();
    showToast('快取已清除，正在重新載入...', 'info');
    setTimeout(() => window.location.reload(), 1000);
  }, [showToast]);

  // C1: Handle best time click
  const handleBestTimeSelect = useCallback((time) => {
    setTargetTime(time);
    showToast(`切換到 ${String(time.getHours()).padStart(2, '0')}:00 預測模式`, 'info');
  }, [showToast]);

  const formattedTime = now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className={`min-h-screen transition-colors duration-500 selection:bg-indigo-500/30 ${isLight ? 'bg-gradient-to-b from-slate-50 to-blue-50/30 text-slate-800' : 'bg-[#0a0e1a] text-white'}`}>
      {/* C2: Toast container */}
      <ToastContainer toasts={toasts} />
      <LiveCameraViewer 
        locationId={locationId} 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        isLight={isLight} 
      />

      {/* Ambient background (dark only) */}
      {!isLight && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/[0.04] rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/[0.03] rounded-full blur-[100px]" />
          <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-cyan-600/[0.02] rounded-full blur-[80px]" />
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Activity size={16} className="text-white" />
              </div>
              <h1 className={`text-xl sm:text-2xl font-bold bg-gradient-to-r ${isLight ? 'from-slate-800 via-indigo-700 to-purple-700' : 'from-white via-indigo-200 to-purple-300'} bg-clip-text text-transparent`}>
                Pickleball Weather Pro
              </h1>
            </div>
            <p className={`text-xs ml-11 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
              匹克球天氣預測系統 · {location?.description || ''}
              {targetTime && <span className="ml-2 text-indigo-400">· 預測模式</span>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearCache}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${isLight ? 'bg-white border-slate-200 text-slate-500 hover:bg-orange-50 hover:text-orange-500 hover:border-orange-200 shadow-sm' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-orange-500/20 hover:border-orange-500/30'}`}
              title="清除所有快取與設定"
            >
              <Trash2 size={16} />
            </button>

            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${isLight ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
              title="切換主題"
            >
              {isLight ? <Moon size={14} /> : <Sun size={14} />}
            </button>

            <div className={`hidden sm:flex items-center gap-2 text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
              <span className="font-mono">{formattedTime}</span>
              <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : dataSource === 'CWA' ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <div className="flex items-center">
              {dataSource === 'CWA' && !loading && !targetTime && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[9px] font-medium border border-emerald-500/20">CWA LIVE</span>
              )}
              {targetTime && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[9px] font-medium border border-amber-500/20">預測模式 FORECAST</span>
              )}
              </div>
            </div>

            <button
              onClick={() => setIsCameraOpen(true)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${isLight ? 'bg-white border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 shadow-sm' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30'}`}
              title="即時影像"
            >
              <Video size={14} className={!targetTime && dataSource === 'CWA' ? 'text-red-400 animate-pulse' : ''} />
            </button>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className={`p-2 rounded-xl border transition-all disabled:opacity-30 cursor-pointer ${isLight ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        <div className="flex justify-center mb-5">
          <LocationToggle activeLocation={locationId} onToggle={setLocationId} locations={locations} />
        </div>

        <div className="mb-5">
          <TimePicker targetTime={targetTime} onTimeChange={setTargetTime} />
        </div>

        {loading && !weather ? (
          <SkeletonLoader />
        ) : (
          <>
            <ThunderstormBanner ppi={ppi} weather={weather} />
            <WeatherSummary weather={weather} ppi={ppi} />
            <ComparisonView comparison={comparison} activeLocation={locationId} onSelectLocation={setLocationId} />
            <BestTimeBar bestTimes={bestTimes} trend={trend} onSelectTime={handleBestTimeSelect} />
            <CrossValidationBadge crossValidation={crossValidation} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
              <GlassPanel isLight={isLight}>
                <SectionHeader icon={Gauge} title="Playability Index" subtitle="適打指數 PPI" isLight={isLight} />
                <PlayabilityGauge score={ppi?.score || 0} category={ppi?.category || ''} color={ppi?.color || '#666'} />
                <div className="mt-4">
                  <PPIBreakdown ppi={ppi} />
                </div>
              </GlassPanel>

              <GlassPanel isLight={isLight}>
                <SectionHeader icon={Compass} title="Wind Analysis" subtitle="風向分析 · 球場方位" isLight={isLight} />
                <WindCompass windDirection={weather?.wind_direction || 0} windSpeed={weather?.wind_speed || 0} windGust={weather?.wind_gust || 0} courtOrientation={location?.courtOrientation || 0} />
              </GlassPanel>

              <GlassPanel isLight={isLight}>
                <SectionHeader icon={Radio} title="Radar Scan" subtitle="上風處雲系掃描 · 20km" isLight={isLight} />
                <RadarSimulation radar={radar} weather={weather} />
              </GlassPanel>
            </div>

            <div className="mb-5">
              <WeatherCards weather={weather} />
            </div>

            {/* C13: Lazy loaded trend chart */}
            <GlassPanel isLight={isLight}>
              <SectionHeader icon={TrendingUp} title="6-Hour Forecast" subtitle="未來六小時趨勢預測" isLight={isLight} />
              <div className="flex items-center gap-6 mb-3 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-indigo-400 rounded-full" />
                  <span className="text-slate-400">PPI 指數</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-cyan-400 rounded-full" />
                  <span className="text-slate-400">風速 (km/h)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-2 bg-blue-500/20 rounded-sm" />
                  <span className="text-slate-400">降雨機率 (%)</span>
                </div>
              </div>
              <Suspense fallback={<div className="h-[280px] flex items-center justify-center text-slate-500 text-xs">載入圖表中...</div>}>
                <TrendChart data={trend} />
              </Suspense>
            </GlassPanel>
          </>
        )}

        <footer className="mt-8 text-center space-y-2">
          <div className={`flex items-center justify-center gap-4 text-[10px] flex-wrap ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>
            <span>CWA × Open-Meteo 雙源驗證</span>
            <span>·</span>
            <span>{location?.lat.toFixed(4)}°N, {location?.lng.toFixed(4)}°E</span>
            <span>·</span>
            <span>{targetTime ? '🕒 預測模式 (Forecast)' : dataSource === 'CWA' ? '🟢 CWA 即時資料' : '每60秒自動更新'}</span>
          </div>
          <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-700'}`}>
            PPI v3 (降雨優先) · 降雨70% + 風力15% + 其他15% · 移除硬性封頂
          </p>
        </footer>
      </div>
    </div>
  );
}
