import { useState } from 'react';
import { RefreshCw, Radio, TrendingUp, Gauge, Compass, Activity, Sun, Moon } from 'lucide-react';
import { useWeatherData } from './hooks/useWeatherData';
import LocationToggle from './components/LocationToggle';
import TimePicker from './components/TimePicker';
import PlayabilityGauge from './components/PlayabilityGauge';
import WindCompass from './components/WindCompass';
import RadarSimulation from './components/RadarSimulation';
import WeatherCards from './components/WeatherCards';
import TrendChart from './components/TrendChart';
import PPIBreakdown from './components/PPIBreakdown';
import ThunderstormBanner from './components/ThunderstormBanner';
import ComparisonView from './components/ComparisonView';
import WeatherSummary from './components/WeatherSummary';
import BestTimeBar from './components/BestTimeBar';
import SkeletonLoader from './components/SkeletonLoader';

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="p-1.5 rounded-lg bg-white/5 dark:bg-white/5 light-mode-header-icon">
        <Icon size={14} className="text-indigo-400" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-white leading-tight">{title}</h2>
        {subtitle && <p className="text-[10px] text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function GlassPanel({ children, className = '' }) {
  return (
    <div className={`bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
}

export default function App() {
  const [locationId, setLocationId] = useState('youth_park');
  const [targetTime, setTargetTime] = useState(null);
  const [theme, setTheme] = useState('dark'); // B7: theme toggle
  const {
    weather, ppi, trend, radar, location, loading, lastUpdate,
    dataSource, error, bestTimes, comparison,
    refresh, locations,
  } = useWeatherData(locationId, targetTime);

  const formattedTime = lastUpdate
    ? lastUpdate.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen transition-colors duration-500 text-white selection:bg-indigo-500/30 ${isLight ? 'bg-[#f0f2f7]' : 'bg-[#0a0e1a]'}`}>
      {/* Ambient background */}
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

          <div className="flex items-center gap-3">
            {/* B7: Theme toggle */}
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${isLight ? 'bg-slate-200 border-slate-300 text-slate-600 hover:bg-slate-300' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
              title="切換主題"
            >
              {isLight ? <Moon size={14} /> : <Sun size={14} />}
            </button>

            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : dataSource === 'CWA' ? 'bg-emerald-400' : 'bg-red-400'}`} />
              {loading ? '更新中...' : `最後更新 ${formattedTime}`}
              {dataSource === 'CWA' && !loading && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[9px] font-medium border border-emerald-500/20">CWA LIVE</span>
              )}
              {dataSource === 'error' && (
                <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 text-[9px] font-medium border border-red-500/20">API ERROR</span>
              )}
            </div>
            <button
              onClick={refresh}
              disabled={loading}
              className={`p-2 rounded-xl border transition-all disabled:opacity-30 cursor-pointer ${isLight ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* Location Toggle */}
        <div className="flex justify-center mb-5">
          <LocationToggle
            activeLocation={locationId}
            onToggle={setLocationId}
            locations={locations}
          />
        </div>

        {/* Time Picker */}
        <div className="mb-5">
          <TimePicker targetTime={targetTime} onTimeChange={setTargetTime} />
        </div>

        {/* Content: skeleton vs loaded */}
        {loading && !weather ? (
          <SkeletonLoader />
        ) : (
          <>
            {/* A7: Thunderstorm Banner */}
            <ThunderstormBanner ppi={ppi} weather={weather} />

            {/* B2+B3: Weather Summary with animated icon */}
            <WeatherSummary weather={weather} ppi={ppi} />

            {/* B1: Location Comparison */}
            <ComparisonView
              comparison={comparison}
              activeLocation={locationId}
              onSelectLocation={setLocationId}
            />

            {/* B4+B10: Best Time + Rain Countdown */}
            <BestTimeBar bestTimes={bestTimes} trend={trend} />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
              <GlassPanel>
                <SectionHeader icon={Gauge} title="Playability Index" subtitle="適打指數 PPI" />
                <PlayabilityGauge
                  score={ppi?.score || 0}
                  category={ppi?.category || ''}
                  color={ppi?.color || '#666'}
                />
                <div className="mt-4">
                  <PPIBreakdown ppi={ppi} />
                </div>
              </GlassPanel>

              <GlassPanel>
                <SectionHeader icon={Compass} title="Wind Analysis" subtitle="風向分析 · 球場方位" />
                <WindCompass
                  windDirection={weather?.wind_direction || 0}
                  windSpeed={weather?.wind_speed || 0}
                  windGust={weather?.wind_gust || 0}
                  courtOrientation={location?.courtOrientation || 0}
                />
              </GlassPanel>

              <GlassPanel>
                <SectionHeader icon={Radio} title="Radar Scan" subtitle="上風處雲系掃描 · 20km" />
                <RadarSimulation radar={radar} weather={weather} />
              </GlassPanel>
            </div>

            {/* B6: Enhanced Weather Cards (5 cards) */}
            <div className="mb-5">
              <WeatherCards weather={weather} />
            </div>

            {/* Trend Chart */}
            <GlassPanel>
              <SectionHeader icon={TrendingUp} title="5-Hour Forecast" subtitle="未來五小時趨勢預測" />
              <div className="flex items-center gap-6 mb-3 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-indigo-400 rounded-full" />
                  <span className="text-slate-400">PPI 指數</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-cyan-400 rounded-full" style={{borderTop:'1px dashed #22d3ee'}} />
                  <span className="text-slate-400">風速 (km/h)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-2 bg-blue-500/20 rounded-sm" />
                  <span className="text-slate-400">降雨機率 (%)</span>
                </div>
              </div>
              <TrendChart data={trend} />
            </GlassPanel>
          </>
        )}

        {/* Footer */}
        <footer className="mt-8 text-center space-y-2">
          <div className={`flex items-center justify-center gap-4 text-[10px] flex-wrap ${isLight ? 'text-slate-500' : 'text-slate-600'}`}>
            <span>CWA API: {location?.apiCode}</span>
            <span>·</span>
            <span>{location?.lat.toFixed(4)}°N, {location?.lng.toFixed(4)}°E</span>
            <span>·</span>
            <span>{dataSource === 'CWA' ? '🟢 CWA 即時資料' : targetTime ? '預測模式' : '每60秒自動更新'}</span>
            {location?.district && <><span>·</span><span>{location.district}</span></>}
          </div>
          <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-700'}`}>
            PPI v2 · 風力55% + 降雨25% + 雲量8% + 體感7% + 地面5%
          </p>
        </footer>
      </div>
    </div>
  );
}
