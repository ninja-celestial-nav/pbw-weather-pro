import { X, Video } from 'lucide-react';
import { useEffect } from 'react';

// Maps location IDs to YouTube Live Video IDs
// You can update these IDs if the official live streams change URLs
const CAMERA_MAP = {
  youth_park: {
    url: 'https://tw.live/cam/?id=BOT295', // 青年公園
    name: '青年公園周邊監視器',
  },
  erchong: {
    url: 'https://tw.live/cam/?id=NWT0268', // 二重疏洪道
    name: '二重疏洪道周邊監視器',
  },
  tianmu: {
    url: 'https://tw.live/cam/?id=BOT408', // 天母公園
    name: '天母公園周邊監視器',
  },
};

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
                Live Public Camera · 僅供天氣與雲層參考
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
            <iframe
              src={cam.url}
              title="Live Camera"
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
        
        {/* Footer info */}
        <div className={`p-3 text-[10px] sm:text-xs text-center ${isLight ? 'bg-slate-50 text-slate-500' : 'bg-slate-800/50 text-slate-400'}`}>
          若影像無法載入，請直接前往 <a href={cam.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">觀看原始網頁</a>
        </div>
      </div>
    </div>
  );
}
