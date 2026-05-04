/**
 * C2: Toast notification component
 */
import { useState, useEffect, useCallback } from 'react';

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = 'success', duration = 2500) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  return { toasts, show };
}

export default function ToastContainer({ toasts }) {
  if (!toasts?.length) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            px-4 py-2.5 rounded-xl text-xs font-medium shadow-xl backdrop-blur-md
            border animate-slide-in
            ${toast.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : toast.type === 'error'
                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
            }
          `}
        >
          {toast.type === 'success' && '✅ '}
          {toast.type === 'error' && '❌ '}
          {toast.type === 'info' && 'ℹ️ '}
          {toast.message}
        </div>
      ))}
    </div>
  );
}
