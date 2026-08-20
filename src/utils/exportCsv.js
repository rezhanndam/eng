export const shortTaskId = (id) => (String(id).startsWith('TSK-') ? String(id).slice(-4) : id);

// Exports a task list as a CSV file that opens in Excel.
export function downloadTasksCsv(tasks, projectName) {
  const rows = [
    ['ID', 'Task', 'Assignee', 'Priority', 'Status', 'Deadline'],
    ...tasks.map(({ id, task, assignee, priority, status, deadline }) => [shortTaskId(id), task, assignee, priority, status, deadline]),
  ];
  const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${String(projectName).replaceAll(/[^a-z0-9]+/gi, '-').replaceAll(/(^-|-$)/g, '')}-tasks.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}