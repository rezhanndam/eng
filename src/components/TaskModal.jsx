import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { isValidDisplayDate } from '../utils/dates';

const generateTaskId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `TSK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  }
  return `TSK-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
};

export default function TaskModal({ isOpen, onClose, onSave, task = null, projectId, projectName, teamMembers = [] }) {
  const [taskName, setTaskName] = useState('');
  const [assignee, setAssignee] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Pending');
  const [deadline, setDeadline] = useState('');
  const [deadlineError, setDeadlineError] = useState('');

  useEffect(() => {
    if (task) {
      setTaskName(task.task);
      setAssignee(task.assignee);
      setPriority(task.priority);
      setStatus(task.status);
      setDeadline(task.deadline);
    } else {
      setTaskName('');
      setAssignee(teamMembers[0]?.name || '');
      setPriority('Medium');
      setStatus('Pending');
      setDeadline('');
    }
    setDeadlineError('');
  }, [task, isOpen, teamMembers]);

  if (!isOpen) return null;

  const isValidDeadline = (value) => isValidDisplayDate(value);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!taskName || !assignee || !deadline) return;
    if (!isValidDeadline(deadline)) {
      setDeadlineError('Invalid date format. Use e.g. "05 Aug 2026".');
      return;
    }

    onSave({
      id: task ? task.id : generateTaskId(),
      task: taskName,
      project: projectName,
      projectId,
      assignee,
      priority,
      status,
      deadline,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-[15px]">
            {task ? 'Edit Task' : 'New Task'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Task Description
            </label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="e.g. Conduct vibration inspection"
              className="w-full h-10 px-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Assignee
            </label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full h-10 px-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
            >
              {!teamMembers.some((m) => m.name === assignee) && assignee && (
                <option key={assignee} value={assignee}>
                  {assignee} (legacy)
                </option>
              )}
              {teamMembers.map((m) => (
                <option key={m.id || m.name} value={m.name}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full h-10 px-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-10 px-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Deadline
            </label>
            <input
              type="text"
              value={deadline}
              onChange={(e) => {
                setDeadline(e.target.value);
                if (deadlineError) setDeadlineError('');
              }}
              placeholder="e.g. 24 Aug 2026"
              className={`w-full h-10 px-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border rounded-xl outline-none focus:ring-2 transition-all ${deadlineError ? 'border-red-400 focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50' : 'border-slate-200 dark:border-slate-600 focus:border-blue-400 focus:ring-blue-100'}`}
              required
            />
            {deadlineError && (
              <p className="mt-1.5 text-[12px] text-red-500 dark:text-red-400">{deadlineError}</p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-[13px] font-medium border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-4 text-[13px] font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Save Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
