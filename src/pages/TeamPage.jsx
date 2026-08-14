import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { TEAM_MEMBERS } from '../data';
import { useAuth } from '../hooks/useAuth';
import TeamModal from '../components/TeamModal';
import ConfirmModal from '../components/ConfirmModal';
import { ListChecks } from 'lucide-react';

export default function TeamPage({ projectTasks = [], teamMembers = TEAM_MEMBERS, canManage, onSaveMember, onDeleteMember }) {
  const { can } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const canEdit = canManage ?? can('team.manage');
  const assignees = new Set(projectTasks.map((t) => t.assignee));
  const projectMembers = teamMembers.filter((m) => assignees.has(m.name));
  const displayMembers = projectMembers.length > 0 ? projectMembers : teamMembers.slice(0, 3);

  const handleEdit = (member) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedMember(null);
    setIsModalOpen(true);
  };

  const handleDelete = (member) => setPendingDelete(member);

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Project Team Members</h1>
          <p className="text-[13.5px] text-slate-400 dark:text-slate-500 mt-1">
            {displayMembers.length} active members on this project workspace
          </p>
        </div>
        {canEdit && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 h-9 px-4 text-[13px] font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayMembers.map((member) => {
          const memberActiveTasks = projectTasks.filter(
            (t) => t.assignee === member.name && t.status !== 'Completed'
          ).length;

          return (
            <div
              key={member.id || member.name}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow relative group"
            >
              {canEdit && (
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(member)}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="Edit Member"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(member)}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="Delete Member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-white text-[13px] font-bold shrink-0 shadow-sm shadow-blue-500/10`}>
                  {member.avatar}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-slate-800 dark:text-slate-100">{member.name}</p>
                  <p className="text-[12px] text-slate-400 dark:text-slate-500">{member.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[12.5px] text-slate-500 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                <ListChecks className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span>{memberActiveTasks} active tasks on this project</span>
              </div>
            </div>
          );
        })}
      </div>

      <TeamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveMember}
        member={selectedMember}
      />

      <ConfirmModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => onDeleteMember(pendingDelete.id || pendingDelete.name)}
        title="Delete team member"
        message={`Are you sure you want to remove "${pendingDelete?.name}"? Tasks assigned to them will remain.`}
        confirmLabel="Remove"
      />
    </div>
  );
}
