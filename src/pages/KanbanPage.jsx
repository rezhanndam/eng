import { useState } from 'react';
import { SquareKanban, Paperclip, Plus } from 'lucide-react';
import TaskModal from '../components/TaskModal';
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

const deadlineClass = (deadline) => {
  const days = daysUntil(deadline);
  if (days === null) return 'text-slate-500 dark:text-slate-400';
  if (days < 0) return 'text-red-500 dark:text-red-400';
  if (days <= 7) return 'text-amber-600 dark:text-amber-400';
  return 'text-slate-500 dark:text-slate-400';
};

export default function KanbanPage({ tasks = [], can, activeProject, teamMembers = [], documents = [], categories = [], onSaveTask, onAddDocument }) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [dragOver, setDragOver] = useState('');

  const canEdit = can('task.edit');

  const selectedTaskDocs = selectedTask ? documents.filter((d) => selectedTask.documentIds?.includes(d.id)) : [];

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
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === status) return;
    onSaveTask({ ...task, status });
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

      <div className="flex gap-4 overflow-x-auto pb-18 min-h-[60vh]">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status);
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
              className={`min-w-[260px] sm:min-w-[280px] flex-1 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 p-3 transition-colors ${dragOver === col.status ? 'ring-2 ring-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
            >
              <div className="flex items-center gap-2 px-1 mb-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
                <p className={`text-[12px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${col.header}`}>{col.status}</p>
                <span className="ml-auto text-[12px] font-semibold text-slate-400 dark:text-slate-500">{colTasks.length}</span>
              </div>
              <div className="space-y-2">
                {colTasks.length === 0 && (
                  <p className={`rounded-xl border border-dashed text-center text-[11.5px] py-6 text-slate-400 dark:text-slate-500 ${dragOver === col.status ? 'border-blue-300 dark:border-blue-500' : 'border-slate-200 dark:border-slate-700'}`}>
                    {dragOver === col.status ? 'Drop here' : 'No tasks'}
                  </p>
                )}
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable={canEdit}
                    onDragStart={(e) => { e.dataTransfer.setData('text/plain', task.id); e.dataTransfer.effectAllowed = 'move'; }}
                    onClick={() => canEdit && handleEditTask(task)}
                    className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 shadow-sm hover:shadow-md transition-shadow ${canEdit ? 'cursor-pointer hover:border-blue-300 dark:hover:border-slate-500' : 'cursor-default'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 break-words">{task.task}</p>
                      {task.documentIds?.length > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 shrink-0" title="Attached documents">
                          <Paperclip className="w-3 h-3" />
                          {task.documentIds.length}
                        </span>
                      )}
                    </div>
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
                      <span className="text-[11.5px] text-slate-500 dark:text-slate-400">{task.assignee}</span>
                      <span className={`ml-auto text-[11.5px] font-medium ${deadlineClass(task.deadline)}`}>{task.deadline}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

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