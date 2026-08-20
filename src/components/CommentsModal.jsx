import { useEffect, useState } from 'react';
import { X, MessageSquare, Send } from 'lucide-react';

const AVATAR_COLORS = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];

const avatarColor = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

// Shared comment thread used by tasks and documents. `comments` is read from
// the item itself (it travels with the item in the workspace blob).
export default function CommentsModal({ item = null, title = 'Comments', onAdd, onClose, canAdd = true }) {
  const [text, setText] = useState('');

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (!item) return null;

  const comments = item.comments || [];
  const sorted = [...comments].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || !canAdd) return;
    onAdd(text.trim());
    setText('');
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-md w-full overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare className="w-4 h-4 text-blue-500 shrink-0" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-[15px] truncate">{title}</h3>
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

        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">{item.name || item.task}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sorted.length === 0 ? (
            <p className="py-8 text-center text-[12.5px] text-slate-400 dark:text-slate-500">No comments yet.</p>
          ) : sorted.map((c) => (
            <div key={c.id} className="flex items-start gap-3">
              <span className={`w-7 h-7 rounded-full ${avatarColor(c.user)} text-white text-[10px] font-bold flex items-center justify-center shrink-0`}>
                {initials(c.user)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">{c.user || 'Unknown'}</span>
                  <time className="text-[10.5px] text-slate-400 dark:text-slate-500">{new Date(c.timestamp).toLocaleString()}</time>
                </div>
                <p className="mt-0.5 text-[13px] text-slate-600 dark:text-slate-300 break-words whitespace-pre-wrap">{c.text}</p>
              </div>
            </div>
          ))}
        </div>

        {canAdd && (
          <form onSubmit={handleSubmit} className="shrink-0 p-4 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment..."
              aria-label="Write a comment"
              className="flex-1 h-10 px-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              aria-label="Send comment"
              className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}