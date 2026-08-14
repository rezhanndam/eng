import { useMemo, useState } from 'react';
import { Activity, ListChecks, FileText, FolderOpen, Users, FolderKanban, ClipboardList } from 'lucide-react';
import DailyReportGenerator from '../components/DailyReportGenerator';

const TYPE_META = {
  task: { label: 'Tasks', icon: ListChecks, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' },
  document: { label: 'Documents', icon: FileText, color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/30' },
  category: { label: 'Categories', icon: FolderOpen, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' },
  team: { label: 'Team', icon: Users, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' },
  project: { label: 'Projects', icon: FolderKanban, color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/30' },
};

const classify = (action) => {
  const value = action.toLowerCase();
  if (value.includes('document')) return 'document';
  if (value.includes('categor')) return 'category';
  if (value.includes('team member') || value.includes('member')) return 'team';
  if (value.includes('project')) return 'project';
  return 'task';
};

const dayKey = (timestamp) => new Date(timestamp).toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

const relativeDay = (timestamp) => {
  const date = new Date(timestamp);
  const today = new Date();
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(date, today)) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(date, yesterday)) return 'Yesterday';
  return dayKey(timestamp);
};

export default function JobActivityReportPage({ activity = [], activeProject, dailyReports = [], onSaveDailyReport, onDeleteDailyReport }) {
  const [filter, setFilter] = useState('all');
  const [tab, setTab] = useState('log');

  const items = useMemo(
    () => activity.map((item) => ({ ...item, type: classify(item.action) })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [activity]
  );

  const filtered = filter === 'all' ? items : items.filter((item) => item.type === filter);

  const groups = useMemo(() => {
    const map = new Map();
    filtered.forEach((item) => {
      const key = relativeDay(item.timestamp);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return [...map.entries()];
  }, [filtered]);

  const counts = useMemo(() => {
    const result = { all: items.length };
    Object.keys(TYPE_META).forEach((type) => {
      result[type] = items.filter((item) => item.type === type).length;
    });
    return result;
  }, [items]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Job Activity Report</h1>
        <p className="text-[13.5px] text-slate-400 dark:text-slate-500 mt-1">
          {activeProject?.name || 'workspace'}.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setTab('log')}
          className={`h-9 px-4 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer flex items-center gap-2 ${tab === 'log'
            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          <Activity className="w-4 h-4" />
          Activity Log
        </button>
        <button
          onClick={() => setTab('report')}
          className={`h-9 px-4 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer flex items-center gap-2 ${tab === 'report'
            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
        >
          <ClipboardList className="w-4 h-4" />
          Daily Report (WhatsApp)
        </button>
      </div>

      {tab === 'report' ? (
        <DailyReportGenerator reports={dailyReports} onSaveReport={onSaveDailyReport} onDeleteReport={onDeleteDailyReport} />
      ) : (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`h-8 px-3.5 rounded-xl text-[12.5px] font-semibold border transition-colors cursor-pointer ${filter === 'all'
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/20'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              All <span className="opacity-70">({counts.all})</span>
            </button>
            {Object.entries(TYPE_META).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`h-8 px-3.5 rounded-xl text-[12.5px] font-semibold border transition-colors cursor-pointer ${filter === key
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                {meta.label} <span className="opacity-70">({counts[key]})</span>
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm divide-y divide-slate-100 dark:divide-slate-700">
            {groups.length ? groups.map(([day, dayItems]) => (
              <div key={day}>
                <div className="px-5 pt-4 pb-1.5">
                  <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{day}</p>
                </div>
                <div className="px-5 pb-4 divide-y divide-slate-100 dark:divide-slate-700">
                  {dayItems.map((item) => {
                    const meta = TYPE_META[item.type];
                    const Icon = meta.icon;
                    return (
                      <div key={item.id} className="py-3 flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-slate-700 dark:text-slate-200">
                            <strong className="text-slate-900 dark:text-slate-100">{item.action}</strong>
                            {item.detail ? <span className="text-slate-500 dark:text-slate-400"> · {item.detail}</span> : null}
                          </p>
                          <time className="text-[11px] text-slate-400 dark:text-slate-500">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </time>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <Activity className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-[13px] text-slate-400 dark:text-slate-500">No activity recorded{filter !== 'all' ? ' for this filter' : ''} yet.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}