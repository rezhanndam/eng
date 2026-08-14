import { ListChecks } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import EmptyState from './EmptyState';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg text-[12px]">
      <p className="font-semibold">{label}</p>
      <p className="text-blue-300">{payload[0].value} Tasks</p>
    </div>
  );
};

export default function ProjectChart({ projectTasks = [] }) {
  // Count tasks by status
  const statusCounts = {
    'Pending': 0,
    'In Progress': 0,
    'Review': 0,
    'Completed': 0,
  };

  projectTasks.forEach((t) => {
    if (statusCounts[t.status] !== undefined) {
      statusCounts[t.status]++;
    }
  });

  const chartData = [
    { status: 'Pending', count: statusCounts['Pending'], color: '#f59e0b' },
    { status: 'In Progress', count: statusCounts['In Progress'], color: '#3b82f6' },
    { status: 'Review', count: statusCounts['Review'], color: '#8b5cf6' },
    { status: 'Completed', count: statusCounts['Completed'], color: '#10b981' },
  ];

  const hasData = chartData.some(d => d.count > 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm flex-1">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">Task Status Distribution</h3>
      </div>

      {!hasData ? (
        <div className="h-[260px] flex items-center justify-center">
          <EmptyState 
            icon={ListChecks}
            title="No task data"
            description="Add tasks to see status distribution."
          />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barSize={40}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" strokeOpacity={0.2} />
            <XAxis
              dataKey="status"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
