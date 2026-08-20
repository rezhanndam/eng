import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ListChecks, FileText, FolderKanban } from 'lucide-react';

// Global search across the active project's tasks & documents plus all projects.
// Purely a client-side filter over in-memory lists (data is already loaded).
export default function GlobalSearch({ projects = [], tasks = [], documents = [], onSelectProject }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const projectHits = q ? projects.filter((p) => (p.name || '').toLowerCase().includes(q) || (p.lead || '').toLowerCase().includes(q)) : [];
  const taskHits = q ? tasks.filter((t) => (t.task || '').toLowerCase().includes(q) || (t.assignee || '').toLowerCase().includes(q)) : [];
  const docHits = q ? documents.filter((d) => (d.name || '').toLowerCase().includes(q) || (d.category || '').toLowerCase().includes(q)) : [];
  const total = projectHits.length + taskHits.length + docHits.length;

  const goTo = (id) => {
    setQuery('');
    setOpen(false);
    navigate(id);
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search tasks, documents, projects..."
          aria-label="Global search"
          className="w-full h-10 pl-9 pr-3 text-[13px] bg-white dark:bg-slate-800/80 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
        />
      </div>

      {open && searching && (
        <div className="absolute left-0 right-0 top-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 overflow-hidden">
          {total === 0 ? (
            <p className="px-4 py-6 text-center text-[12px] text-slate-400 dark:text-slate-500">No results for &quot;{query}&quot;.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto py-1.5">
              {projectHits.length > 0 && (
                <div>
                  <p className="px-4 pt-2 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Projects</p>
                  {projectHits.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setQuery(''); setOpen(false); onSelectProject(p.id); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <FolderKanban className="w-4 h-4 shrink-0 text-slate-400" />
                      <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200 truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {taskHits.length > 0 && (
                <div>
                  <p className="px-4 pt-2 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tasks</p>
                  {taskHits.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => goTo('/tasks')}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <ListChecks className="w-4 h-4 shrink-0 text-blue-500" />
                      <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200 truncate">{t.task}</span>
                      {t.assignee && <span className="ml-auto shrink-0 text-[11px] text-slate-400">{t.assignee}</span>}
                    </button>
                  ))}
                </div>
              )}
              {docHits.length > 0 && (
                <div>
                  <p className="px-4 pt-2 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Documents</p>
                  {docHits.map((d) => (
                    <button
                      key={d.id || d.name}
                      onClick={() => goTo('/documents')}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <FileText className="w-4 h-4 shrink-0 text-violet-500" />
                      <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200 truncate">{d.name}</span>
                      <span className="ml-auto shrink-0 text-[11px] text-slate-400">{d.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}