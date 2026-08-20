import { useMemo } from 'react';
import { BarChart3, Activity, FileText, FolderKanban, ListChecks } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { daysUntil } from '../utils/dates';

const STATUS_COLORS = {
  Completed: '#10b981',
  'In Progress': '#3b82f6',
  Review: '#8b5cf6',
  Pending: '#f59e0b',
};

export default function ReportsPage({ projects = [], tasks = [], documents = [], activity = [] }) {
  const completed = tasks.filter((task) => task.status === 'Completed').length;
  const upcoming = tasks.filter((task) => task.status !== 'Completed' && (daysUntil(task.deadline) ?? -1) >= 0).length;
  const summary = [
    { label: 'Projects', value: projects.length, icon: FolderKanban, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Completed tasks', value: `${completed}/${tasks.length}`, icon: ListChecks, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' },
    { label: 'Open deadlines', value: upcoming, icon: Activity, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' },
    { label: 'Documents', value: documents.length, icon: FileText, color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/30' },
  ];

  const statusData = useMemo(() => {
    const counts = { Pending: 0, 'In Progress': 0, Review: 0, Completed: 0 };
    tasks.forEach((t) => {
      if (counts[t.status] !== undefined) counts[t.status] += 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [tasks]);

  const progressData = useMemo(
    () => projects.map((p) => ({ name: p.name, progress: p.progress })),
    [projects]
  );

  return <div className="space-y-6">
    <div className="mb-6"><h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reports</h1><p className="text-[13.5px] text-slate-400 dark:text-slate-500 mt-1">Workspace summary for the active project.</p></div>

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">{summary.map(({ label, value, icon: Icon, color }) => <section key={label} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm"><div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-4 h-4" /></div><p className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p><p className="mt-1 text-[12px] text-slate-400 dark:text-slate-500">{label}</p></section>)}</div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <section className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4"><BarChart3 className="w-4 h-4 text-blue-500" /><h2 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">Task Status Distribution</h2></div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={statusData} barSize={40}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" strokeOpacity={0.2} />
            <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
            <Tooltip cursor={false} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 8 }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4"><FolderKanban className="w-4 h-4 text-emerald-500" /><h2 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">Project Progress</h2></div>
        {progressData.length > 0 && progressData.every((p) => p.progress === 0) ? (
          <p className="text-[13px] text-slate-400 dark:text-slate-500 py-8 text-center">No progress data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={progressData} layout="vertical" barSize={14}>
              <CartesianGrid horizontal={false} stroke="#f1f5f9" strokeOpacity={0.2} />
              <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip cursor={false} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 8 }} formatter={(value) => [`${value}%`, 'Progress']} />
              <Bar dataKey="progress" radius={[0, 6, 6, 0]} fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>
    </div>

    <section className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /><h2 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">Recent activity</h2></div>
      <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-700">{activity.length ? activity.slice(0, 10).map((item) => <div key={item.id} className="py-3 flex items-center justify-between gap-4"><p className="text-[13px] text-slate-600 dark:text-slate-300 min-w-0 break-words"><strong className="text-slate-800 dark:text-slate-100">{item.action}</strong> · {item.detail}</p><time className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">{new Date(item.timestamp).toLocaleString()}</time></div>) : <p className="py-8 text-center text-[13px] text-slate-400 dark:text-slate-500">CRUD activity will appear here.</p>}</div></section>
  </div>;
}
