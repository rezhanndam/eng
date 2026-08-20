import { useState } from 'react';
import { CalendarRange, Plus, MessageSquare } from 'lucide-react';
import TaskModal from '../components/TaskModal';
import CommentsModal from '../components/CommentsModal';
import { parseDeadline, startOfToday, daysUntil } from '../utils/dates';

const DAY = 86_400_000;
const COL_W = 16;

const STATUS_BAR = {
  Pending: 'bg-amber-400',
  'In Progress': 'bg-blue-500',
  Review: 'bg-violet-500',
  Completed: 'bg-emerald-500',
};

const STATUS_CHIP = {
  Pending: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  'In Progress': 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  Review: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  Completed: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const PRIORITY_STYLES = {
  High: 'bg-red-50 text-red-500 dark:bg-red-900/40 dark:text-red-400',
  Medium: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  Low: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300',
};

const AVATAR_COLORS = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];

const avatarColor = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

const startOfDay = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (d, n) => new Date(startOfDay(d).getTime() + n * DAY);

const diffDays = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / DAY);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const buildWeeks = (start, end) => {
  const weeks = [];
  let cur = startOfDay(start);
  const last = startOfDay(end);
  while (cur <= last) {
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      weekDays.push(addDays(cur, i));
      if (addDays(cur, i) > last) break;
    }
    weeks.push(weekDays);
    cur = addDays(cur, 7);
  }
  return weeks;
};

// Rows that show the path from the range start up to each task deadline. Tasks
// only store a deadline (no start date), so the bar is NOT a real duration.
function DeadlineBar({ task, offsetDays, showText }) {
  const overdue = task.status !== 'Completed' && daysUntil(task.deadline) !== null && daysUntil(task.deadline) < 0;
  const color = overdue ? 'bg-red-500' : STATUS_BAR[task.status] || 'bg-slate-400';
  const width = Math.max(offsetDays * COL_W - 8, 22) + 'px';
  return (
    <div
      title={`${task.task} · ${task.assignee}\n${task.status} · ${task.priority || '-'}\nDeadline: ${task.deadline}`}
      className={`absolute top-1.5 bottom-1.5 rounded-md ${color} ${task.status === 'Completed' ? 'opacity-60' : 'shadow-sm'} flex items-center px-1.5 overflow-hidden`}
      style={{ left: 4, width }}
    >
      {showText && <span className="text-[10.5px] font-semibold text-white truncate">{task.task}</span>}
    </div>
  );
}

export default function GanttPage({ tasks = [], can, activeProject, teamMembers = [], documents = [], categories = [], onSaveTask, onAddDocument, onAddTaskComment }) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentTaskId, setCommentTaskId] = useState('');
  const [preset, setPreset] = useState('6');
  const [filterAssignee, setFilterAssignee] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');

  const canEdit = can('task.edit');
  const today = startOfToday();

  const assignees = [...new Set(tasks.map((t) => t.assignee).filter(Boolean))];
  const categoriesInUse = [...new Set(tasks.map((t) => t.category).filter(Boolean))];
  const priorities = [...new Set(tasks.map((t) => t.priority).filter(Boolean))];
  const hasFilters = filterAssignee !== 'All' || filterCategory !== 'All' || filterPriority !== 'All';

  const filteredTasks = tasks.filter(
    (t) =>
      (filterAssignee === 'All' || t.assignee === filterAssignee) &&
      (filterCategory === 'All' || t.category === filterCategory) &&
      (filterPriority === 'All' || t.priority === filterPriority)
  );

  const datedTasks = filteredTasks
    .map((t) => ({ ...t, date: parseDeadline(t.deadline) }))
    .filter((t) => t.date)
    .sort((a, b) => a.date - b.date || (a.task || '').localeCompare(b.task || ''));
  const undatedTasks = filteredTasks.filter((t) => !parseDeadline(t.deadline));

  const earliest = datedTasks.length ? datedTasks[0].date : today;
  const latest = datedTasks.length ? datedTasks[datedTasks.length - 1].date : today;

  const rangeStart = preset === 'all'
    ? addDays(earliest, -2)
    : addDays(Math.min(earliest, today), -Number(preset) * 30);
  const rangeEnd = addDays(Math.max(latest, today), 14);

  const weeks = buildWeeks(rangeStart, rangeEnd);
  const totalDays = diffDays(rangeStart, rangeEnd) + 1;
  const chartWidth = totalDays * COL_W;
  const todayIndex = diffDays(rangeStart, today);

  // Consecutive weeks that share the same start-month merge into one header span.
  const monthSpans = [];
  weeks.forEach((week, i) => {
    const month = week[0].getMonth();
    const last = monthSpans[monthSpans.length - 1];
    if (last && last.month === month && last.end === i - 1) {
      last.end = i;
      last.count += 1;
    } else {
      monthSpans.push({ month, start: i, end: i, count: 1 });
    }
  });

  const selectedTaskDocs = selectedTask ? documents.filter((d) => selectedTask.documentIds?.includes(d.id)) : [];
  const commentTask = tasks.find((t) => t.id === commentTaskId);

  const handleNewTask = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const clearFilters = () => {
    setFilterAssignee('All');
    setFilterCategory('All');
    setFilterPriority('All');
  };

  const filterSelect = (label, value, options, onChange) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="h-8 px-2.5 text-[12.5px] bg-white dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-400 cursor-pointer"
    >
      <option value="All">{label}: All</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );

  const presetBtn = (label, value) => (
    <button
      onClick={() => setPreset(value)}
      className={`h-8 px-3 rounded-full text-[12.5px] font-semibold border transition-colors cursor-pointer ${preset === value
        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
    >
      {label}
    </button>
  );

  const daysBadge = (task) => {
    const d = daysUntil(task.deadline);
    if (d === null) return null;
    if (d < 0) return <span className="px-1.5 py-0.5 rounded bg-red-500 text-white text-[9.5px] font-bold">Overdue {Math.abs(d)}d</span>;
    if (d <= 7) return <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-[9.5px] font-bold">{d}d left</span>;
    return <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{d} d</span>;
  };

  const mobileCard = (task) => {
    const overdue = task.status !== 'Completed' && daysUntil(task.deadline) !== null && daysUntil(task.deadline) < 0;
    const offset = task.date ? diffDays(rangeStart, task.date) : totalDays;
    const frac = Math.max(0, Math.min(1, offset / totalDays));
    return (
      <div
        key={task.id}
        onClick={() => canEdit && handleEditTask(task)}
        style={{ borderLeftWidth: 4, borderLeftColor: overdue ? '#ef4444' : (task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#f59e0b' : '#94a3b8') }}
        className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 shadow-sm ${canEdit ? 'cursor-pointer hover:shadow-md' : ''}`}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 break-words">{task.task}</p>
          <div className="flex items-center gap-1 shrink-0">
            {onAddTaskComment && (
              <button
                onClick={(e) => { e.stopPropagation(); setCommentTaskId(task.id); }}
                aria-label="Comments"
                className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-0.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {(task.comments?.length || 0) > 0 && <span className="text-[10px] font-semibold">{task.comments.length}</span>}
              </button>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {task.status && <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium ${STATUS_CHIP[task.status] || ''}`}>{task.status}</span>}
          {task.category && <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{task.category}</span>}
          {task.priority && <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium ${PRIORITY_STYLES[task.priority] || ''}`}>{task.priority}</span>}
          <span className="flex items-center gap-1.5 min-w-0 ml-auto">
            <span className={`w-5 h-5 rounded-full ${avatarColor(task.assignee)} text-white text-[9px] font-bold flex items-center justify-center shrink-0`}>{initials(task.assignee)}</span>
            <span className="text-[11.5px] text-slate-500 dark:text-slate-400 truncate">{task.assignee}</span>
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400">{task.deadline || 'No deadline'}</span>
          {task.deadline && daysBadge(task)}
        </div>
        {task.date && (
          <div className="mt-2 h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div className={`h-full rounded-full ${overdue ? 'bg-red-500' : STATUS_BAR[task.status] || 'bg-slate-400'}`} style={{ width: `${frac * 100}%`, minWidth: 4 }} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <CalendarRange className="w-6 h-6 text-blue-500" />
            Timeline
          </h1>
          <p className="text-[13.5px] text-slate-400 dark:text-slate-500 mt-1">
            {activeProject?.name} · {filteredTasks.length} tasks
          </p>
        </div>
        {can('task.create') && (
          <button
            onClick={handleNewTask}
            className="flex items-center gap-2 h-9 px-4 text-[13px] font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-4">
        {presetBtn('1 Bulan', '1')}
        {presetBtn('3 Bulan', '3')}
        {presetBtn('6 Bulan', '6')}
        {presetBtn('Semua', 'all')}
        <span className="hidden sm:inline-block w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
        {filterSelect('Assignee', filterAssignee, assignees, setFilterAssignee)}
        {filterSelect('Category', filterCategory, categoriesInUse, setFilterCategory)}
        {filterSelect('Priority', filterPriority, priorities, setFilterPriority)}
        {hasFilters && (
          <button onClick={clearFilters} className="text-[12px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
            Clear
          </button>
        )}
      </div>

      {filteredTasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-[12px] py-10 text-slate-400 dark:text-slate-500">
          No tasks yet. Create a task to see it on the timeline.
        </p>
      ) : (
        <>
          <div className="hidden lg:block rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <div style={{ width: 224 + chartWidth, minWidth: '100%' }}>
                {/* Month header */}
                <div className="flex border-b border-slate-200 dark:border-slate-700" style={{ height: 32 }}>
                  <div className="sticky left-0 z-20 bg-white dark:bg-slate-800 w-56 shrink-0 border-r border-slate-200 dark:border-slate-700 flex items-end px-4 pb-1.5 flex-shrink-0" />
                  <div className="flex">
                    {monthSpans.map((s, i) => (
                      <div
                        key={i}
                        className="text-[11px] font-bold text-slate-400 dark:text-slate-500 px-2 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 flex items-end pb-1.5"
                        style={{ width: s.count * 7 * COL_W }}
                      >
                        {MONTHS[s.month]} {weekStartYear(weeks[s.start])}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Week-day header */}
                <div className="flex border-b border-slate-200 dark:border-slate-700" style={{ height: 22 }}>
                  <div className="sticky left-0 z-20 bg-white dark:bg-slate-800 w-56 shrink-0 border-r border-slate-200 dark:border-slate-700 flex-shrink-0" />
                  <div className="flex">
                    {weeks.map((week, i) => (
                      <div
                        key={i}
                        className={`text-[10px] text-slate-400 dark:text-slate-500 border-l border-slate-100 dark:border-slate-800 flex items-center justify-center ${week[0].getMonth() % 2 ? 'bg-slate-50/60 dark:bg-slate-800/40' : ''}`}
                        style={{ width: 7 * COL_W }}
                      >
                        {week[0].getDate()}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Today line (drawn per un-/shaded rows via overlay) */}
                <div className="relative">
                  {datedTasks.map((task) => (
                    <div key={task.id} className="flex border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors" style={{ height: 40 }}>
                      <div className="sticky left-0 z-10 bg-white dark:bg-slate-800 w-56 shrink-0 border-r border-slate-200 dark:border-slate-700 flex items-center gap-2 px-4 flex-shrink-0">
                        <span className={`w-5 h-5 rounded-full ${avatarColor(task.assignee)} text-white text-[9px] font-bold flex items-center justify-center shrink-0`}>{initials(task.assignee)}</span>
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 truncate">{task.task}</p>
                          <p className="text-[10.5px] text-slate-400 dark:text-slate-500 truncate">{task.assignee} · {task.priority || '-'}</p>
                        </div>
                      </div>
                      <div className="relative" style={{ width: chartWidth }} onClick={() => canEdit && handleEditTask(task)}>
                        <DeadlineBar task={task} offsetDays={diffDays(rangeStart, task.date)} showText={diffDays(rangeStart, task.date) * COL_W > 120} />
                      </div>
                    </div>
                  ))}
                  {/* Vertical "today" line over the whole chart */}
                  <div className="absolute top-0 bottom-0 z-[5] pointer-events-none" style={{ left: 224 + todayIndex * COL_W }}>
                    <div className="w-[2px] h-full bg-red-400 border-l border-dashed border-red-400" />
                    <div className="absolute -top-px left-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-b-md">Today</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-red-500 inline-block" /> Overdue</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-amber-400 inline-block" /> Pending</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-blue-500 inline-block" /> In Progress</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-violet-500 inline-block" /> Review</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-emerald-500 inline-block" /> Completed</span>
            </div>
          </div>

          {/* Mobile: plain vertical list, no timeline grid */}
          <div className="lg:hidden space-y-2">
            {datedTasks.map(mobileCard)}
          </div>

          {undatedTasks.length > 0 && (
            <div className="mt-6">
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">No deadline ({undatedTasks.length})</p>
              <div className="hidden lg:block space-y-2">
                {undatedTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => canEdit && handleEditTask(task)}
                    className={`flex items-center gap-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 px-4 py-2.5 ${canEdit ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/40' : ''}`}
                  >
                    <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 min-w-0 flex-1 truncate">{task.task}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium ${STATUS_CHIP[task.status] || ''}`}>{task.status}</span>
                    <span className="text-[11.5px] text-slate-500 dark:text-slate-400 shrink-0">{task.assignee}</span>
                  </div>
                ))}
              </div>
              <div className="lg:hidden space-y-2">
                {undatedTasks.map(mobileCard)}
              </div>
            </div>
          )}
        </>
      )}

      <CommentsModal
        item={commentTask}
        title="Task Comments"
        onAdd={(text) => onAddTaskComment(commentTaskId, text)}
        onClose={() => setCommentTaskId('')}
        canAdd={canEdit}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={onSaveTask}
        task={selectedTask}
        projectId={selectedTask ? selectedTask.projectId : activeProject?.id}
        projectName={selectedTask ? selectedTask.project : activeProject?.name}
        teamMembers={teamMembers}
        taskDocuments={selectedTaskDocs}
        categories={categories}
        onAddDocument={onAddDocument}
      />
    </div>
  );
}

function weekStartYear(week) {
  return week[0].getFullYear();
}