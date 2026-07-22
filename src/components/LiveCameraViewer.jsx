import { X, Video, AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

// Maps location IDs to government CCTV HLS streams
// These are the actual m3u8 sources that tw.live uses internally.
// BOT = 台北市交通管制工程處, NWT = 新北市政府交通局
const CAMERA_MAP = {
  youth_park: {
    streamUrl: 'https://jtmctrafficcctv5.gov.taipei/NVR/5a1b2d3d-04ac-4558-9dfe-551afab49ce8/live.m3u8',
    name: '295-萬大路-東園街口',
    subtitle: '台北市萬華區 · 青年公園周邊',
    source: '台北市交通管制工程處',
    fallbackUrl: 'https://tw.live/cam/?id=BOT295',
  },
  erchong: {
    streamUrl: 'https://cctvatis4.ntpc.gov.tw/hls/C000268/live.m3u8',
    name: '光復路2段-疏洪西路',
    subtitle: '新北市三重區 · 二重疏洪道周邊',
    source: '新北市政府交通局',
    fallbackUrl: 'https://tw.live/cam/?id=NWT0268',
  },
  tianmu: {
    streamUrl: 'https://jtmctrafficcctv4.gov.taipei/NVR/7fad9da7-4775-4119-95fc-1f78b7bb7877/live.m3u8',
    name: '408-石牌路2段-天母西路',
    subtitle: '台北市北投區 · 天母周邊',
    source: '台北市交通管制工程處',
    fallbackUrl: 'https://tw.live/cam/?id=BOT408',
  },
};

function HlsPlayer({ streamUrl, isLight }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    setError(false);
    setLoading(true);

    // If the browser natively supports HLS (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadeddata', () => setLoading(false));
      video.addEventListener('error', () => {
        setError(true);
        setLoading(false);
      });
      video.play().catch(() => {});
      return () => {
        video.pause();
        video.removeAttribute('src');
        video.load();
      };
    }

    // Use HLS.js for other browsers
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError(true);
          setLoading(false);
          hls.destroy();
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    // Fallback: no HLS support
    setError(true);
    setLoading(false);
  }, [streamUrl]);

  if (error) {
    return (
      <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 ${isLight ? 'bg-slate-100' : 'bg-slate-900'}`}>
        <AlertTriangle size={32} className="text-amber-500" />
        <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          影像暫時無法連線
        </p>
      </div>
    );
  }

  return (
    <>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
            <span className="text-xs text-slate-400">正在連線串流...</span>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain bg-black"
        autoPlay
        muted
        playsInline
      />
    </>
  );
}

export default function LiveCameraViewer({ locationId, isOpen, onClose, isLight }) {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const cam = CAMERA_MAP[locationId] || CAMERA_MAP.youth_park;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-3 sm:p-4 border-b ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Video size={16} className="text-red-500 animate-pulse" />
            </div>
            <div>
              <h3 className={`font-semibold text-sm sm:text-base ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                {cam.name}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500">
                {cam.subtitle}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-slate-400'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* 16:9 Video Container */}
        <div className="relative w-full aspect-video bg-black">
          {isOpen && (
            <HlsPlayer streamUrl={cam.streamUrl} isLight={isLight} />
          )}
        </div>
        
        {/* Footer info */}
        <div className={`p-3 text-[10px] sm:text-xs text-center ${isLight ? 'bg-slate-50 text-slate-500' : 'bg-slate-800/50 text-slate-400'}`}>
          影像來源：{cam.source}｜若無法載入，請前往 <a href={cam.fallbackUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">tw.live 觀看</a>
        </div>
      </div>
    </div>
  );
}
