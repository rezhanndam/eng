import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  destructive = true,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-sm w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-[15px]">{title}</h3>
          <button onClick={onClose} aria-label="Close dialog" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${destructive ? 'bg-red-50 dark:bg-red-900/30 text-red-500' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-500'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <p className="text-[13.5px] text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="px-6 pb-6 flex items-center justify-end gap-2.5">
          <button onClick={onClose} className="h-9 px-4 text-[13px] font-medium border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            onClick={() => { if (typeof onConfirm === 'function') onConfirm(); onClose(); }}
            className={`h-9 px-4 text-[13px] font-medium rounded-xl text-white transition-all cursor-pointer active:scale-95 ${destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
