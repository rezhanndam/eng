import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import ProjectModal from '../components/ProjectModal';
import ConfirmModal from '../components/ConfirmModal';

export default function ProjectPortalPage({ projects, onSelectProject, can, onSaveProject, onDeleteProject, teamMembers = [], onSaveMember, onDeleteMember }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const handleNewProject = () => {
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const handleEditProject = (e, project) => {
    e.stopPropagation();
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleDeleteProject = (e, project) => {
    e.stopPropagation();
    setPendingDelete(project);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 dark:bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center mb-12">
        <div className="mb-4">
          <div className="inline-block px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 border border-blue-200/50 dark:border-blue-800 mb-4">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Project Selection</span>
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
          Engineering Project Portal
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          Select a project to load the dashboard and engineering workspace.
        </p>
        {can('project.manage') && (
          <button
            onClick={handleNewProject}
            className="mt-6 inline-flex items-center gap-2 h-10 px-5 text-[13px] font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl w-full">
        {projects.map((project) => (
          <div
            key={project.id}
            className="group relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 text-left shadow-sm hover:shadow-lg hover:border-slate-300/80 dark:hover:border-slate-600 transition-all duration-300 cursor-pointer hover:scale-105 hover:-translate-y-1 active:scale-95"
            onClick={() => onSelectProject(project.id)}
          >
            {can('project.manage') && (
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleEditProject(e, project)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="Edit Project"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleDeleteProject(e, project)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="Delete Project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm group-hover:scale-125 transition-transform duration-300"
                style={{ backgroundColor: project.color, boxShadow: `0 0 12px ${project.color}40` }}
              />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 truncate flex-1">
                {project.name}
              </h3>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors duration-200">
              Lead: {project.lead} &middot; Deadline: {project.deadline}
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">{project.completedTasks}/{project.totalTasks} Tasks</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-200">{project.progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100/80 dark:bg-slate-700/80 rounded-full overflow-hidden ring-1 ring-slate-200/50 dark:ring-slate-600/50">
                <div
                  className="h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${project.progress}%`, backgroundColor: project.color }}
                />
              </div>
            </div>

            <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="text-xs text-blue-600 font-semibold flex items-center justify-end">
                Click to enter
                <span className="ml-1.5">→</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center text-xs text-slate-400 dark:text-slate-500">
        <p>Total Projects: {projects.length}</p>
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveProject}
        project={selectedProject}
        teamMembers={teamMembers}
        onSaveMember={onSaveMember}
        onDeleteMember={onDeleteMember}
        canManageTeam={can('team.manage')}
      />

      <ConfirmModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => onDeleteProject(pendingDelete.id)}
        title="Delete project"
        message={`Are you sure you want to delete "${pendingDelete?.name}"? All tasks and documents in this project will also be removed.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
