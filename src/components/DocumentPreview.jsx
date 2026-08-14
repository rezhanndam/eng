import { X, Download } from 'lucide-react';
import { getDocumentUrl } from '../lib/docStorage';

export default function DocumentPreview({ documentItem, onClose, onDownload }) {
  if (!documentItem) return null;
  const url = getDocumentUrl(documentItem);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-4xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-[15px] truncate">
            {documentItem.name}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onDownload?.(documentItem)}
              className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download
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
        <div className="flex-1 h-[75vh] bg-slate-100 dark:bg-slate-900">
          {url ? (
            <iframe
              src={url}
              title={documentItem.name}
              className="w-full h-full"
            />
          ) : (
            <p className="p-8 text-center text-slate-500">No preview available.</p>
          )}
        </div>
      </div>
    </div>
  );
}