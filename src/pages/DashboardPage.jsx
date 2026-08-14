import TopHeader from '../components/TopHeader';
import KpiCards from '../components/KpiCards';
import ProjectChart from '../components/RevenueChart';
import GaugeChart from '../components/GaugeChart';
import DataTable from '../components/DataTable';
import usePageLoading from '../hooks/usePageLoading';
import { TableSkeleton } from '../components/Skeleton';
import { daysUntil } from '../utils/dates';

export default function DashboardPage({ activeProject, tasks = [], activity = [], onSwitchProject }) {
  const loading = usePageLoading();
  const projectTasks = tasks.filter((t) => t.projectId === activeProject.id);
  const reminders = projectTasks.filter((task) => task.status !== 'Completed' && (daysUntil(task.deadline) ?? 999) <= 7);
  const overdueCount = reminders.filter((task) => (daysUntil(task.deadline) ?? 0) < 0).length;

  // Compute stats
  const activeTasksCount = projectTasks.filter((t) => t.status !== 'Completed').length;
  const completedTasksCount = projectTasks.filter((t) => t.status === 'Completed').length;
  const pendingTasksCount = projectTasks.filter((t) => t.status === 'Pending').length;

  const dynamicKpis = [
    {
      title: 'Active Tasks',
      value: activeTasksCount.toString(),
      trend: activeTasksCount > 2 ? +10 : -5,
      vs: 'vs last week',
      color: 'blue',
    },
    {
      title: 'Tasks Completed',
      value: completedTasksCount.toString(),
      trend: +15,
      vs: 'vs last week',
      color: 'emerald',
    },
    {
      title: 'Pending Tasks',
      value: pendingTasksCount.toString(),
      trend: -8,
      vs: 'vs last week',
      color: 'violet',
    },
    {
      title: 'Deadline Reminders',
      value: reminders.length.toString(),
      trend: overdueCount > 0 ? +20 : -100,
      vs: overdueCount ? `${overdueCount} overdue` : 'next 7 days',
      color: 'amber',
    },
  ];

  if (loading) {
    return (
      <>
        <TopHeader activeProject={activeProject} tasks={projectTasks} reminders={reminders.length} activity={activity} onSwitchProject={onSwitchProject} />
        <div className="mb-6 h-[76px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[150px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 animate-pulse" />
          ))}
        </div>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 h-[320px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 animate-pulse" />
          <div className="w-full lg:w-[300px] h-[320px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 animate-pulse" />
        </div>
        <TableSkeleton rows={4} cols={6} />
      </>
    );
  }

  return (
    <>
      <TopHeader activeProject={activeProject} tasks={projectTasks} reminders={reminders.length} activity={activity} onSwitchProject={onSwitchProject} />
      <div className="mb-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wider block">Currently Viewing Workspace</span>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-0.5">{activeProject.name}</h2>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
          <span>Lead: <strong className="text-slate-700 dark:text-slate-200">{activeProject.lead}</strong></span>
          <span>Deadline: <strong className="text-slate-700 dark:text-slate-200">{activeProject.deadline}</strong></span>
        </div>
      </div>

      <KpiCards data={dynamicKpis} />

      <div className="flex flex-col lg:flex-row gap-4">
        <ProjectChart projectTasks={projectTasks} />
        <div className="w-full lg:w-[300px] shrink-0">
          <GaugeChart
            percentage={activeProject.progress}
            current={activeProject.completedTasks}
            target={activeProject.totalTasks}
            label="Project Progress Status"
          />
        </div>
      </div>

      <DataTable tasks={projectTasks} title={`Tasks Breakdown for ${activeProject.name}`} />
    </>
  );
}
