import { useState, useEffect, useRef } from 'react';
import { X, Upload, Loader2, Paperclip, FileText } from 'lucide-react';
import { isCloudStorage } from '../lib/supabase';
import { uploadDocumentFile } from '../lib/docStorage';
import { isValidDisplayDate, displayDateToInput, inputToDisplay } from '../utils/dates';

const generateTaskId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `TSK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  }
  return `TSK-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
};

const generateDocId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `doc-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `doc-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
};

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const MAX_FILE_SIZE = isCloudStorage ? 25 * 1024 * 1024 : 3 * 1024 * 1024;

export default function TaskModal({ isOpen, onClose, onSave, task = null, projectId, projectName, teamMembers = [], taskDocuments = [], categories = [], onAddDocument }) {
  const [taskName, setTaskName] = useState('');
  const [assignee, setAssignee] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Pending');
  const [deadline, setDeadline] = useState('');
  const [deadlineInput, setDeadlineInput] = useState('');
  const [deadlineError, setDeadlineError] = useState('');
  const [category, setCategory] = useState('');
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);

  // Initialize fields only when the modal opens (or the edited task changes).
  // teamMembers is intentionally NOT a dependency: a cloud sync merge can give
  // it a new reference while the user is typing, which would otherwise wipe
  // the in-progress form.
  const wasOpen = useRef(false);
  const teamRef = useRef(teamMembers);
  teamRef.current = teamMembers;
  useEffect(() => {
    if (!isOpen) {
      wasOpen.current = false;
      return;
    }
    setDeadlineError('');
    setFileError('');
    if (!wasOpen.current) setPendingFiles([]);
    if (task) {
      setTaskName(task.task);
      setAssignee(task.assignee);
      setPriority(task.priority);
      setStatus(task.status);
      setDeadline(task.deadline);
      setDeadlineInput(displayDateToInput(task.deadline));
      setCategory(task.category || '');
    } else if (!wasOpen.current) {
      setTaskName('');
      setAssignee(teamRef.current[0]?.name || '');
      setPriority('Medium');
      setStatus('Pending');
      setDeadline('');
      setDeadlineInput('');
      setCategory('');
    }
    wasOpen.current = true;
  }, [isOpen, task]);

  if (!isOpen) return null;

  const isValidDeadline = (value) => isValidDisplayDate(value);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum size is ${isCloudStorage ? '25' : '3'} MB.`);
      return;
    }
    setFileError('');

    const dotIndex = file.name.lastIndexOf('.');
    const ext = dotIndex !== -1 ? file.name.slice(dotIndex + 1).toUpperCase() : 'PDF';
    const validTypes = ['PDF', 'DWG', 'XLSX', 'ZIP', 'DOCX'];
    const type = validTypes.includes(ext) ? ext : 'PDF';
    const sizeInMB = file.size / (1024 * 1024);
    const size = sizeInMB < 0.1 ? `${(file.size / 1024).toFixed(1)} KB` : `${sizeInMB.toFixed(1)} MB`;

    setPendingFiles((prev) => [...prev, { id: generateDocId(), file, name: file.name, type, size }]);
    e.target.value = '';
  };

  const removePendingFile = (id) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskName || !assignee || !deadline) return;
    if (!isValidDeadline(deadline)) {
      setDeadlineError('Invalid date format. Use e.g. "05 Aug 2026".');
      return;
    }

    const newDocIds = [];
    if (onAddDocument && pendingFiles.length) {
      setUploading(true);
      try {
        for (const pf of pendingFiles) {
          let fileData;
          let filePath;
          if (isCloudStorage) {
            const result = await uploadDocumentFile({ file: pf.file, projectId, docId: pf.id });
            filePath = result.filePath;
          } else {
            fileData = await toBase64(pf.file);
          }
          const payload = {
            id: pf.id,
            name: pf.name,
            type: pf.type,
            category: category || categories[0] || 'General Spec',
            size: pf.size,
            date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
            projectId,
            taskId: task.id,
          };
          if (filePath) payload.filePath = filePath;
          if (fileData) payload.fileData = fileData;
          onAddDocument(payload);
          newDocIds.push(pf.id);
        }
      } catch (error) {
        setUploading(false);
        setFileError(error?.message || 'Upload failed. Please try again.');
        return;
      }
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
      category,
      documentIds: [...(task?.documentIds || []), ...newDocIds],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
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
              type="date"
              value={deadlineInput}
              onChange={(e) => {
                setDeadlineInput(e.target.value);
                setDeadline(e.target.value ? inputToDisplay(e.target.value) : '');
                if (deadlineError) setDeadlineError('');
              }}
              className={`w-full h-10 px-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border rounded-xl outline-none focus:ring-2 transition-all cursor-pointer ${deadlineError ? 'border-red-400 focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50' : 'border-slate-200 dark:border-slate-600 focus:border-blue-400 focus:ring-blue-100'}`}
              required
            />
            {deadlineError && (
              <p className="mt-1.5 text-[12px] text-red-500 dark:text-red-400">{deadlineError}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Category <span className="normal-case font-normal text-slate-400 dark:text-slate-500">(optional)</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {task && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Attachments
              </label>
              <div className="border border-slate-200 dark:border-slate-600 rounded-xl p-3 bg-slate-50 dark:bg-slate-700/40 space-y-2">
                {taskDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-[13px] text-slate-700 dark:text-slate-200 truncate flex-1">{doc.name}</span>
                    <span className="text-[11px] text-slate-400 shrink-0">{doc.type}</span>
                  </div>
                ))}
                {pendingFiles.map((pf) => (
                  <div key={pf.id} className="flex items-center gap-2.5 min-w-0">
                    <Paperclip className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-[13px] text-slate-700 dark:text-slate-200 truncate flex-1">{pf.name}</span>
                    <span className="text-[11px] text-slate-400 shrink-0">{pf.size}</span>
                    <button
                      type="button"
                      onClick={() => removePendingFile(pf.id)}
                      aria-label={`Remove ${pf.name}`}
                      className="text-slate-400 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {taskDocuments.length === 0 && pendingFiles.length === 0 && (
                  <p className="text-[12px] text-slate-400 italic">No attachments yet.</p>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.dwg,.xlsx,.zip,.docx"
                disabled={uploading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-2.5 flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Document
              </button>
              {fileError && (
                <p className="mt-2 text-[12px] text-red-500 dark:text-red-400">{fileError}</p>
              )}
            </div>
          )}

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
              disabled={uploading}
              className="h-9 px-4 text-[13px] font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-2"
            >
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploading ? 'Uploading...' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
