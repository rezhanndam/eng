import { useState, useEffect } from 'react';
import { X, Download, Maximize2, Minimize2 } from 'lucide-react';
import { getDocumentUrl, getDocumentDownloadUrl } from '../lib/docStorage';

export default function DocumentPreview({ documentItem, onClose, onDownload }) {
  const [url, setUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  useEffect(() => {
    let cancelled = false;
    if (!documentItem) {
      setUrl('');
      setDownloadUrl('');
      setLoading(false);
      setIsFullscreen(false);
      return undefined;
    }
    setUrl('');
    setDownloadUrl('');
    setLoading(true);
    setIsFullscreen(false);
    getDocumentUrl(documentItem)
      .then((u) => {
        if (!cancelled) setUrl(u);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    getDocumentDownloadUrl(documentItem).then((u) => {
      if (!cancelled) setDownloadUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [documentItem]);

  if (!documentItem) return null;

  return (
    <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <div className={`bg-white dark:bg-slate-800 shadow-xl flex flex-col overflow-hidden ${isFullscreen ? 'w-full h-full max-w-none rounded-none' : 'w-full max-w-5xl h-[85vh] rounded-2xl border border-slate-200 dark:border-slate-700'}`}>
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-[15px] truncate">
            {documentItem.name}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            {downloadUrl ? (
              <a
                href={downloadUrl}
                download={documentItem.name}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
            ) : (
              <button
                onClick={() => onDownload?.(documentItem)}
                className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            )}
            <button
              onClick={() => setIsFullscreen((v) => !v)}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              aria-label="Close preview"
              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 bg-slate-100 dark:bg-slate-900">
          {loading ? (
            <p className="p-8 text-center text-slate-500">Loading preview...</p>
          ) : url ? (
            <iframe src={url} title={documentItem.name} sandbox="allow-scripts" className="w-full h-full" />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3 p-8 text-center">
              <p className="text-[13px] text-slate-500">
                Preview not available for this document. Use the Download button above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}