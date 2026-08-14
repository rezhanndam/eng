import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, ChevronDown, Edit2, Trash2, ListChecks, ArrowUpDown } from 'lucide-react';
import { TASK_COLUMNS } from '../data';
import { daysUntil } from '../utils/dates';
import EmptyState from './EmptyState';
import ConfirmModal from './ConfirmModal';

const STATUS_STYLES = {
  Completed: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  'In Progress': 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  Pending: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  Review: 'bg-violet-50 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
};

const PRIORITY_STYLES = {
  High: 'bg-red-50 text-red-500 dark:bg-red-900/40 dark:text-red-400',
  Medium: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  Low: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300',
};

const DEADLINE_STYLES = {
  overdue: 'text-red-500 dark:text-red-400',
  soon: 'text-amber-600 dark:text-amber-400',
  normal: 'text-slate-500 dark:text-slate-400',
};

const deadlineState = (deadline) => {
  const difference = daysUntil(deadline);
  if (difference === null) return 'normal';
  if (difference < 0) return 'overdue';
  if (difference <= 7) return 'soon';
  return 'normal';
};

export default function DataTable({ tasks = [], title = 'Recent Tasks', onEditTask, onDeleteTask }) {
  const [checkedRows, setCheckedRows] = useState(new Set());
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All Statuses');
  const [priority, setPriority] = useState('All Priorities');
  const [sortBy, setSortBy] = useState('deadline');
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    setCheckedRows(new Set());
  }, [query, status, priority, tasks]);

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const getDeadlineTime = (deadline) => {
      const d = new Date(deadline);
      return Number.isNaN(d.getTime()) ? Infinity : d.getTime();
    };

    return tasks
      .filter((task) => {
        const matchesQuery = !normalizedQuery || [task.id, task.task, task.project, task.assignee]
          .some((value) => value?.toLowerCase().includes(normalizedQuery));
        return matchesQuery
          && (status === 'All Statuses' || task.status === status)
          && (priority === 'All Priorities' || task.priority === priority);
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          const rank = { High: 0, Medium: 1, Low: 2 };
          return (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3);
        }
        if (sortBy === 'task') return a.task.localeCompare(b.task);
        return getDeadlineTime(a.deadline) - getDeadlineTime(b.deadline);
      });
  }, [tasks, query, status, priority, sortBy]);

  const toggleRow = (id) => {
    setCheckedRows((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setCheckedRows((previous) =>
      previous.size === filteredTasks.length ? new Set() : new Set(filteredTasks.map((task) => task.id))
    );
  };

  const clearFilters = () => {
    setQuery('');
    setStatus('All Statuses');
    setPriority('All Priorities');
    setSortBy('deadline');
  };

  const showActions = Boolean(onEditTask || onDeleteTask);
  const columns = showActions ? [...TASK_COLUMNS, 'Actions'] : TASK_COLUMNS;
  const hasFilters = query || status !== 'All Statuses' || priority !== 'All Priorities' || sortBy !== 'deadline';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-1">{filteredTasks.length} of {tasks.length} tasks</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search tasks..." className="w-48 h-8 pl-9 pr-3 text-[12.5px] bg-slate-50 dark:bg-slate-700/60 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 transition-all" />
          </div>
          <div className="relative">
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="appearance-none h-8 pl-3 pr-8 text-[12.5px] font-medium border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 outline-none cursor-pointer">
              <option>All Statuses</option><option>Pending</option><option>In Progress</option><option>Review</option><option>Completed</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={priority} onChange={(event) => setPriority(event.target.value)} className="appearance-none h-8 pl-3 pr-8 text-[12.5px] font-medium border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 outline-none cursor-pointer">
              <option>All Priorities</option><option>High</option><option>Medium</option><option>Low</option>
            </select>
            <SlidersHorizontal className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          <button onClick={() => setSortBy((current) => current === 'deadline' ? 'priority' : current === 'priority' ? 'task' : 'deadline')} className="flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sort: {sortBy}
          </button>
          {hasFilters && <button onClick={clearFilters} className="text-[12px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Clear</button>}
        </div>
      </div>
      <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left">
        <thead><tr className="border-t border-b border-slate-100 dark:border-slate-700">{columns.map((column, index) => <th key={index} className="px-5 py-3 text-[12px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{index === 0 ? <input type="checkbox" checked={filteredTasks.length > 0 && checkedRows.size === filteredTasks.length} onChange={toggleAll} className="w-4 h-4 rounded border-slate-300 dark:border-slate-500 accent-blue-600 cursor-pointer" /> : column}</th>)}</tr></thead>
        <tbody>
          {filteredTasks.map((task) => {
            const deadline = deadlineState(task.deadline);
            return <tr key={task.id} className="border-b border-slate-50 dark:border-slate-700/60 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
              <td className="px-5 py-3.5"><input type="checkbox" checked={checkedRows.has(task.id)} onChange={() => toggleRow(task.id)} className="w-4 h-4 rounded border-slate-300 dark:border-slate-500 accent-blue-600 cursor-pointer" /></td>
              <td className="px-5 py-3.5 text-[13px] font-medium text-slate-700 dark:text-slate-200">{task.id}</td>
              <td className="px-5 py-3.5 text-[13px] text-slate-700 dark:text-slate-200 font-medium">{task.task}</td>
              <td className="px-5 py-3.5 text-[13px] text-slate-500 dark:text-slate-400">{task.project}</td>
              <td className="px-5 py-3.5 text-[13px] text-slate-500 dark:text-slate-400">{task.assignee}</td>
              <td className="px-5 py-3.5"><span className={`inline-block px-2.5 py-1 rounded-full text-[12px] font-medium ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span></td>
              <td className="px-5 py-3.5"><span className={`inline-block px-2.5 py-1 rounded-full text-[12px] font-medium ${STATUS_STYLES[task.status]}`}>{task.status}</span></td>
              <td className={`px-5 py-3.5 text-[13px] font-medium ${DEADLINE_STYLES[deadline]}`}>{task.deadline}</td>
              {showActions && <td className="px-5 py-3.5"><div className="flex items-center gap-2">{onEditTask && <button onClick={() => onEditTask(task)} className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>}{onDeleteTask && <button onClick={() => setPendingDelete(task)} className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>}</div></td>}
            </tr>;
          })}
          {filteredTasks.length === 0 && <tr><td colSpan={columns.length} className="px-5"><EmptyState icon={ListChecks} title={tasks.length ? 'No matching tasks' : 'No tasks yet'} description={tasks.length ? 'Try changing the search or filter options.' : 'Create your first task to start tracking progress.'} actionLabel={tasks.length ? 'Clear Filters' : undefined} onAction={tasks.length ? clearFilters : undefined} /></td></tr>}
        </tbody>
      </table>
      </div>
      <ConfirmModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => onDeleteTask(pendingDelete.id)}
        title="Delete task"
        message={`Are you sure you want to delete "${pendingDelete?.task}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
