import { useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';
import { ToastContext } from './contexts';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const STYLES = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  info: 'text-blue-400',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'success', duration = 3000) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }].slice(-5));
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const Icon = (type) => ICONS[type] || Info;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2.5">
        {toasts.map((toast) => {
          const TIcon = Icon(toast.type);
          return (
            <div
              key={toast.id}
              className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg px-4 py-3 min-w-[260px] max-w-sm animate-[toastIn_0.25s_ease-out]"
              role="status"
            >
              <TIcon className={`w-5 h-5 shrink-0 ${STYLES[toast.type]}`} />
              <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200 flex-1">
                {toast.message}
              </p>
              <button
                onClick={() => dismiss(toast.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                aria-label="Dismiss"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
