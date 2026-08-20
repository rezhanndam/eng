import { useEffect, useState } from 'react';
import { SquareKanban, Paperclip, Plus, ChevronDown, MessageSquare } from 'lucide-react';
import TaskModal from '../components/TaskModal';
import CommentsModal from '../components/CommentsModal';
import { daysUntil } from '../utils/dates';

const COLUMNS = [
  { status: 'Pending', header: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500' },
  { status: 'In Progress', header: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', dot: 'bg-blue-500' },
  { status: 'Review', header: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400', dot: 'bg-violet-500' },
  { status: 'Completed', header: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' },
];

const PRIORITY_STYLES = {
  High: 'bg-red-50 text-red-500 dark:bg-red-900/40 dark:text-red-400',
  Medium: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  Low: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300',
};

const PRIORITY_BORDER = { High: '#ef4444', Medium: '#f59e0b', Low: '#94a3b8' };

const AVATAR_COLORS = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];

const avatarColor = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

export default function KanbanPage({ tasks = [], can, activeProject, teamMembers = [], documents = [], categories = [], onSaveTask, onAddDocument, onAddTaskComment }) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [dragOver, setDragOver] = useState('');
  const [dragId, setDragId] = useState('');
  const [menuTaskId, setMenuTaskId] = useState('');
  const [commentTaskId, setCommentTaskId] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');

  const canEdit = can('task.edit');

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
  const total = filteredTasks.length;

  useEffect(() => {
    const onDown = (e) => {
      if (menuTaskId && !e.target.closest?.('[data-task-menu]')) setMenuTaskId('');
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuTaskId]);

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

  const handleDrop = (taskId, status) => {
    setDragOver('');
    setDragId('');
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === status) return;
    onSaveTask({ ...task, status });
  };

  const moveTask = (task, status) => {
    setMenuTaskId('');
    if (task.status === status) return;
    onSaveTask({ ...task, status });
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

  return (
    <div>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <SquareKanban className="w-6 h-6 text-blue-500" />
            Kanban Board
          </h1>
          <p className="text-[13.5px] text-slate-400 dark:text-slate-500 mt-1">
            {activeProject?.name} · {tasks.length} tasks {canEdit ? '· drag to change status' : ''}
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
        {filterSelect('Assignee', filterAssignee, assignees, setFilterAssignee)}
        {filterSelect('Category', filterCategory, categoriesInUse, setFilterCategory)}
        {filterSelect('Priority', filterPriority, priorities, setFilterPriority)}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-[12px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6 items-start snap-x snap-mandatory">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks
            .filter((t) => t.status === col.status)
            .sort((a, b) => {
              const da = daysUntil(a.deadline);
              const db = daysUntil(b.deadline);
              return (da === null ? 999 : da) - (db === null ? 999 : db);
            });
          const share = total ? Math.round((colTasks.length / total) * 100) : 0;
          return (
            <div
              key={col.status}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.status); }}
              onDragLeave={() => setDragOver((cur) => (cur === col.status ? '' : cur))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/plain');
                if (id) handleDrop(id, col.status);
              }}
              className={`min-w-[270px] sm:min-w-[290px] flex-1 flex flex-col rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 p-3 transition-colors snap-start ${dragOver === col.status ? 'ring-2 ring-blue-400 bg-blue-50/60 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' : ''}`}
            >
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
                  <p className={`text-[12px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${col.header}`}>{col.status}</p>
                  <span className="ml-auto text-[12px] font-semibold text-slate-400 dark:text-slate-500">{colTasks.length}</span>
                </div>
                <div className="mt-2 h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className={`h-full rounded-full ${col.dot}`} style={{ width: `${share}%`, transition: 'width 200ms' }} />
                </div>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)] pr-0.5">
                {colTasks.length === 0 && (
                  <p className={`rounded-xl border border-dashed text-center text-[11.5px] py-6 text-slate-400 dark:text-slate-500 ${dragOver === col.status ? 'border-blue-300 dark:border-blue-500' : 'border-slate-200 dark:border-slate-700'}`}>
                    {dragOver === col.status ? 'Drop here' : 'No tasks'}
                  </p>
                )}
                {colTasks.map((task) => {
                  const days = daysUntil(task.deadline);
                  const isOverdue = days !== null && days < 0;
                  const isSoon = days !== null && days >= 0 && days <= 7;
                  return (
                    <div
                      key={task.id}
                      data-task-menu
                      draggable={canEdit}
                      onDragStart={(e) => { e.dataTransfer.setData('text/plain', task.id); e.dataTransfer.effectAllowed = 'move'; setDragId(task.id); }}
                      onDragEnd={() => setDragId('')}
                      onClick={() => canEdit && handleEditTask(task)}
                      style={{ borderLeftWidth: 4, borderLeftColor: PRIORITY_BORDER[task.priority] || '#e2e8f0' }}
                      className={`relative rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 shadow-sm transition-all ${isOverdue ? 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-900/60' : 'bg-white dark:bg-slate-800'} ${canEdit ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : 'cursor-default'} ${dragId === task.id ? 'opacity-50 rotate-2 scale-[0.97] shadow-xl' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 break-words">{task.task}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          {task.documentIds?.length > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500" title="Attached documents">
                              <Paperclip className="w-3 h-3" />
                              {task.documentIds.length}
                            </span>
                          )}
                          {onAddTaskComment && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setCommentTaskId(task.id); }}
                              aria-label="Comments"
                              title="Comments"
                              className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-0.5"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              {(task.comments?.length || 0) > 0 && <span className="text-[10px] font-semibold">{task.comments.length}</span>}
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setMenuTaskId((cur) => (cur === task.id ? '' : task.id)); }}
                              aria-label={`Move ${task.task}`}
                              title="Move task"
                              className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      {menuTaskId === task.id && (
                        <div className="absolute right-2 top-9 z-20 w-44 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-lg py-1">
                          <p className="px-3 pt-1 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Move to</p>
                          {COLUMNS.filter((c) => c.status !== task.status).map((c) => (
                            <button
                              key={c.status}
                              onClick={(e) => { e.stopPropagation(); moveTask(task, c.status); }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-left transition-colors cursor-pointer"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                              {c.status}
                            </button>
                          ))}
                        </div>
                      )}
                      {task.category && (
                        <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {task.category}
                        </span>
                      )}
                      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                        {task.priority && (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${PRIORITY_STYLES[task.priority] || ''}`}>
                            {task.priority}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-5 h-5 rounded-full ${avatarColor(task.assignee)} text-white text-[9px] font-bold flex items-center justify-center shrink-0`}>
                            {initials(task.assignee)}
                          </span>
                          <span className="text-[11.5px] text-slate-500 dark:text-slate-400 truncate">{task.assignee}</span>
                        </span>
                        <span className="ml-auto flex items-center gap-1.5 shrink-0">
                          {isOverdue && (
                            <span className="px-1.5 py-0.5 rounded bg-red-500 text-white text-[9.5px] font-bold">Overdue</span>
                          )}
                          <span className={`text-[11.5px] font-medium ${isOverdue ? 'text-red-500 dark:text-red-400' : isSoon ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            {task.deadline}
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <CommentsModal
        item={commentTask}
        title="Task Comments"
        onAdd={(text) => onAddTaskComment(commentTask.id, text)}
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