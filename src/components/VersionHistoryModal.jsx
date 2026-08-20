import { useEffect, useMemo, useRef, useState } from 'react';
import { X, History, Download, RotateCcw, Loader2 } from 'lucide-react';

// Lists the stored versions of a document (see DocumentModal versioning).
// Older versions can be downloaded or restored as the current file.
export default function VersionHistoryModal({ documentItem, onClose, onDownload, onRestore }) {
  const [restoring, setRestoring] = useState(false);
  const restoringRef = useRef(false);

  const versions = useMemo(
    () => (documentItem?.versions || []).slice().sort((a, b) => b.n - a.n),
    [documentItem]
  );

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleRestore = (v) => {
    if (restoringRef.current) return;
    restoringRef.current = true;
    setRestoring(true);
    try {
      onRestore(v);
    } finally {
      restoringRef.current = false;
      setRestoring(false);
    }
  };

  if (!documentItem) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-[15px]">Version History</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-700">
          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">{documentItem?.name}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Current file: v{documentItem?.fileVersion || 1} · {versions.length} old {versions.length === 1 ? 'version' : 'versions'}
          </p>
        </div>

        <div className="max-h-72 overflow-y-auto p-4 space-y-2">
          {versions.length === 0 ? (
            <p className="py-8 text-center text-[12.5px] text-slate-400 dark:text-slate-500">No stored versions yet.</p>
          ) : versions.map((v) => (
            <div key={v.n} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-500 dark:text-blue-400 flex items-center justify-center text-[11px] font-bold shrink-0">
                v{v.n}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-200">Version {v.n}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{v.size} · {v.date}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onDownload(v)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  title="Download version"
                  aria-label={`Download version ${v.n}`}
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRestore(v)}
                  disabled={restoring}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors disabled:opacity-40 cursor-pointer"
                  title="Restore version"
                  aria-label={`Restore version ${v.n}`}
                >
                  {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}