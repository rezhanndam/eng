import { useState } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '../components/DataTable';
import TaskModal from '../components/TaskModal';

export default function TasksPage({ tasks, onSaveTask, onDeleteTask, can, activeProject, teamMembers = [], documents = [], categories = [], onAddDocument }) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleNewTask = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const selectedTaskDocs = selectedTask ? documents.filter((d) => selectedTask.documentIds?.includes(d.id)) : [];

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Active Project Tasks</h1>
          <p className="text-[13.5px] text-slate-400 dark:text-slate-500 mt-1">{tasks.length} tasks in this project</p>
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

      <DataTable
        tasks={tasks}
        title="Project Tasks"
        onEditTask={can('task.edit') ? handleEditTask : undefined}
        onDeleteTask={can('task.delete') ? onDeleteTask : undefined}
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
