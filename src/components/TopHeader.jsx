import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Bell, Download, Moon, Sun, RefreshCw, LogOut, CalendarClock, Activity } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { daysUntil } from '../utils/dates';
import GlobalSearch from './GlobalSearch';

const HELP_TIPS = [
  ['Dashboard', 'Overview, KPIs and deadline reminders.'],
  ['Tasks', 'Add, edit or delete tasks; filter, sort and bulk select.'],
  ['Documents', 'Upload files and manage categories per project.'],
  ['Team', 'Manage team members (admin only).'],
  ['Reports', 'Task status distribution and project progress charts.'],
  ['Job Activity Report', 'Filtered activity log of work done in the project.'],
];

const dayLabel = (days) => {
  if (days === 0) return 'Due today';
  if (days < 0) return `Overdue by ${Math.abs(days)} day${days === -1 ? '' : 's'}`;
  return `In ${days} day${days === 1 ? '' : 's'}`;
};

export default function TopHeader({ activeProject, tasks = [], reminders = 0, activity = [], documents = [], projects = [], onSelectProject, onSwitchProject }) {
  const { isDark, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const exportTasks = () => {
    if (!activeProject) return;
    const rows = [['ID', 'Task', 'Assignee', 'Priority', 'Status', 'Deadline'], ...tasks.map(({ id, task, assignee, priority, status, deadline }) => [id, task, assignee, priority, status, deadline])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeProject.name.replaceAll(/[^a-z0-9]+/gi, '-').replaceAll(/(^-|-$)/g, '')}-tasks.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Task CSV exported.');
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('activeProjectId');
    navigate('/');
  };

  const reminderItems = tasks
    .map((task) => ({ task, days: daysUntil(task.deadline) }))
    .filter(({ task, days }) => task.status !== 'Completed' && days !== null && days <= 7)
    .sort((a, b) => a.days - b.days);
  const reminderCount = reminderItems.length || reminders;

  const toggle = (name) => setOpenMenu((current) => (current === name ? null : name));

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h2 className="text-[15px] font-semibold text-slate-800 dark:text-slate-200">Dashboard</h2>

        <GlobalSearch projects={projects} tasks={tasks} documents={documents} onSelectProject={onSelectProject} />

        <div ref={containerRef} className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 hover:border-slate-300/80 dark:hover:border-slate-600 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:shadow-sm transition-all duration-200 cursor-pointer group"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-[18px] h-[18px] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-200" />
            ) : (
              <Moon className="w-[18px] h-[18px] group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-200" />
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => toggle('help')}
              aria-expanded={openMenu === 'help'}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 hover:border-slate-300/80 dark:hover:border-slate-600 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:shadow-sm transition-all duration-200 cursor-pointer group"
              aria-label="Help"
            >
              <HelpCircle className="w-[18px] h-[18px] group-hover:scale-110 transition-transform duration-200" />
            </button>
            {openMenu === 'help' && (
              <div className="absolute right-0 top-11 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-100">Help Center</h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Quick guide to get you started</p>
                </div>
                <div className="px-4 py-3 space-y-2.5">
                  {HELP_TIPS.map(([label, description]) => (
                    <div key={label} className="flex gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 shrink-0" />
                      <p className="text-[12px] text-slate-600 dark:text-slate-300"><strong className="text-slate-800 dark:text-slate-100">{label}</strong> · {description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => toggle('bell')}
              aria-expanded={openMenu === 'bell'}
              title={reminderCount ? `${reminderCount} deadline reminder${reminderCount === 1 ? '' : 's'}` : 'No deadline reminders'}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 hover:border-slate-300/80 dark:hover:border-slate-600 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:shadow-sm transition-all duration-200 cursor-pointer group"
              aria-label="Notifications"
            >
              <Bell className="w-[18px] h-[18px] group-hover:scale-110 transition-transform duration-200" />
              {reminderCount > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 rounded-full ring-2 ring-white/80 dark:ring-slate-800/80 text-[9px] leading-4 text-white font-bold">{reminderCount}</span>}
            </button>
            {openMenu === 'bell' && (
              <div className="absolute right-0 top-11 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-blue-500" />
                  <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-100">Deadline Reminders</h3>
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                  {reminderItems.length ? reminderItems.map(({ task, days }) => (
                    <div key={task.id} className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <p className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200 truncate">{task.task}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${days < 0 ? 'bg-red-500' : 'bg-amber-500'}`} />
                        {dayLabel(days)}
                      </p>
                    </div>
                  )) : (
                    <p className="px-4 py-6 text-center text-[12px] text-slate-400 dark:text-slate-500">No deadline reminders.</p>
                  )}
                </div>
                <div className="border-t border-slate-100 dark:border-slate-700">
                  <div className="px-4 py-2.5 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Recent activity</h4>
                  </div>
                  {activity.length ? activity.slice(0, 5).map((item) => (
                    <div key={item.id} className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <p className="text-[12px] text-slate-600 dark:text-slate-300"><strong className="text-slate-800 dark:text-slate-100">{item.action}</strong> · {item.detail}</p>
                      <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5">{item.user ? `${item.user} · ` : ''}{new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                  )) : (
                    <p className="px-4 py-4 text-center text-[12px] text-slate-400 dark:text-slate-500">No recent activity yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => toggle('user')}
              aria-expanded={openMenu === 'user'}
              aria-label="Account menu"
              className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-[11px] font-bold cursor-pointer shadow-sm shadow-blue-500/10 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
            >
              {user?.avatar}
            </button>
            {openMenu === 'user' && (
              <div className="absolute right-0 top-11 w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3.5 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-[12px] font-bold shrink-0">{user?.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{user?.title}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-semibold capitalize">{user?.role}</span>
                  </div>
                </div>
                <div className="p-1.5">
                  <button onClick={onSwitchProject} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left">
                    <RefreshCw className="w-4 h-4" />
                    Switch Project
                  </button>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer text-left">
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome back, {user?.name}</h1>
          <p className="text-[13.5px] text-slate-400 dark:text-slate-500 mt-1">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={exportTasks} className="flex items-center gap-2 h-9 px-4 text-[13px] font-medium bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300/80 dark:hover:border-slate-600 hover:shadow-sm transition-all duration-200 cursor-pointer group active:scale-95">
            <Download className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}