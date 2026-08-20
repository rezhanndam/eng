import { useState, useEffect, useRef } from 'react';
import { X, Plus, Pencil } from 'lucide-react';
import { TEAM_MEMBERS } from '../data';
import { isValidDisplayDate, displayDateToInput, inputToDisplay } from '../utils/dates';
import { PROJECT_ACCESS_LABELS } from '../auth';
import TeamModal from './TeamModal';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const generateProjectId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `proj-${crypto.randomUUID().slice(0, 4)}`;
  }
  return `proj-${Date.now().toString(36)}`;
};

export default function ProjectModal({
  isOpen,
  onClose,
  onSave,
  project = null,
  teamMembers = [],
  onSaveMember = () => {},
  onDeleteMember = () => {},
  canManageTeam = false,
}) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('Planning');
  const [deadline, setDeadline] = useState('');
  const [deadlineInput, setDeadlineInput] = useState('');
  const [lead, setLead] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [driveLink, setDriveLink] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [accessLevel, setAccessLevel] = useState('full');
  const [deadlineError, setDeadlineError] = useState('');
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Initialize fields only when the modal opens (or the edited project changes).
  // teamMembers is intentionally NOT a dependency: adding/editing a member from
  // inside this modal changes its reference and would otherwise wipe the form.
  const wasOpen = useRef(false);
  const teamRef = useRef(teamMembers);
  teamRef.current = teamMembers;
  useEffect(() => {
    if (!isOpen) {
      wasOpen.current = false;
      return;
    }
    setDeadlineError('');
    if (project) {
      setName(project.name);
      setStatus(project.status || 'Planning');
      setDeadline(project.deadline || '');
      setDeadlineInput(displayDateToInput(project.deadline || ''));
      setLead(project.lead || teamRef.current[0]?.name || TEAM_MEMBERS[0]?.name || '');
      setColor(project.color || COLORS[0]);
      setDriveLink(project.driveLink || '');
      setWhatsapp(project.whatsapp || '');
      setAccessLevel(project.accessLevel || 'full');
    } else if (!wasOpen.current) {
      setName('');
      setStatus('Planning');
      setDeadline('');
      setDeadlineInput('');
      setLead(teamRef.current[0]?.name || TEAM_MEMBERS[0]?.name || '');
      setColor(COLORS[0]);
      setDriveLink('');
      setWhatsapp('');
      setAccessLevel('full');
    }
    wasOpen.current = true;
  }, [isOpen, project]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!isValidDisplayDate(deadline.trim())) {
      setDeadlineError('Invalid date format. Use e.g. "30 Sep 2026".');
      return;
    }

    onSave({
      id: project ? project.id : generateProjectId(),
      name: name.trim(),
      status,
      deadline: deadline.trim(),
      lead,
      color,
      progress: project?.progress ?? 0,
      totalTasks: project?.totalTasks ?? 0,
      completedTasks: project?.completedTasks ?? 0,
      driveLink: driveLink.trim(),
      whatsapp: whatsapp.trim(),
      accessLevel,
    });
    onClose();
  };

  const handleAddMember = () => {
    setEditingMember(null);
    setTeamModalOpen(true);
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setTeamModalOpen(true);
  };

  const handleSaveTeamMember = (data) => {
    onSaveMember(data);
    if (!editingMember) setLead(data.name);
  };

  const handleDeleteTeamMember = (member) => {
    if (lead === member.name) setLead('');
    onDeleteMember(member.id || member.name);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-[15px]">
            {project ? 'Edit Project' : 'New Project'}
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
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pipeline Revamp Phase 2"
              className="w-full h-10 px-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-10 px-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
              >
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
              </select>
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Project Lead
            </label>
            <input
              type="text"
              list="project-lead-members"
              value={lead}
              onChange={(e) => setLead(e.target.value)}
              placeholder="Type a name or pick from team..."
              className="w-full h-10 px-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <datalist id="project-lead-members">
              {teamMembers.map((m) => (
                <option key={m.id || m.name} value={m.name}>{m.role}</option>
              ))}
            </datalist>

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Team Members
                </label>
                {canManageTeam && (
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="flex items-center gap-1 text-[12px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Member
                  </button>
                )}
              </div>
              {teamMembers.length === 0 ? (
                <p className="text-[12px] text-slate-400 dark:text-slate-500">
                  No team members yet. Add one above or type a custom lead name.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {teamMembers.map((m) => (
                    <span
                      key={m.id || m.name}
                      className={`inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[12px] font-medium border transition-colors ${
                        lead === m.name
                          ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800'
                          : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/60 dark:text-slate-300 dark:border-slate-600'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setLead(m.name)}
                        title={`Select ${m.name} as lead`}
                        className="cursor-pointer"
                      >
                        {m.name}
                      </button>
                      {canManageTeam && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEditMember(m)}
                            aria-label={`Edit ${m.name}`}
                            title="Edit member"
                            className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTeamMember(m)}
                            aria-label={`Delete ${m.name}`}
                            title="Delete member"
                            className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Google Drive Link
              </label>
              <input
                type="url"
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full h-10 px-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                WhatsApp Number
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="e.g. 6281234567890"
                className="w-full h-10 px-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Project Access Level
            </label>
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value)}
              className="w-full h-10 px-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
            >
              {Object.entries(PROJECT_ACCESS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
              Editor &amp; View mode membatasi aksi di proyek ini untuk semua pengguna.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Color
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all cursor-pointer ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-800 scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
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
              {project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>

      <TeamModal
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        onSave={handleSaveTeamMember}
        member={editingMember}
      />
    </div>
  );
}
