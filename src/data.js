import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Users,
  BarChart3,
  Activity,
  MessageSquare,
  FileText,
  Globe,
  Trash2,
} from 'lucide-react';

export const BRAND = {
  name: 'EngDesk',
  subtitle: 'Project Management',
};

export const MAIN_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: FolderKanban, label: 'Projects', path: '/projects', badge: 5 },
  { icon: ListChecks, label: 'Tasks', path: '/tasks' },
  { icon: FileText, label: 'Documents', path: '/documents' },
  { icon: Users, label: 'Team', path: '/team' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: Activity, label: 'Job Activity Report', path: '/activity' },
  { icon: Trash2, label: 'Trash', path: '/trash' },
];

export const INTEGRATIONS = [
  { icon: FileText, label: 'Google Docs' },
  { icon: MessageSquare, label: 'Slack' },
  { icon: Globe, label: 'Jira' },
];

export const PROMO = {
  title: 'Storage Full?',
  description: 'Upgrade to upload unlimited project documents.',
  cta: 'Upgrade Plan',
};

export const USER = {
  name: 'John Carter',
  role: 'Lead Engineer',
  avatar: 'JC',
};

export const KPI_DATA = [
  {
    title: 'Active Projects',
    value: '5',
    trend: +2,
    vs: 'vs last month',
    color: 'blue',
  },
  {
    title: 'Tasks Completed',
    value: '48',
    trend: +12.5,
    vs: 'vs last month',
    color: 'emerald',
  },
  {
    title: 'Pending Tasks',
    value: '16',
    trend: -5.3,
    vs: 'vs last month',
    color: 'violet',
  },
  {
    title: 'Overdue',
    value: '3',
    trend: +1,
    vs: 'vs last month',
    color: 'amber',
  },
];

export const PROJECT_CHART_DATA = [
  { name: 'Pipeline Revamp', progress: 85 },
  { name: 'Turbine Overhaul', progress: 62 },
  { name: 'Plant Expansion', progress: 45 },
  { name: 'Safety Audit', progress: 90 },
  { name: 'Control Upgrade', progress: 30 },
];

export const GAUGE_DATA = {
  percentage: 72,
  target: 100,
  current: 72,
  label: 'Overall Completion',
};

export const PROJECTS = [
  {
    id: 'proj-001',
    name: 'Pipeline Revamp Phase 2',
    status: 'In Progress',
    deadline: '30 Sep 2026',
    progress: 85,
    totalTasks: 24,
    completedTasks: 20,
    lead: 'John Carter',
    color: '#3b82f6',
  },
  {
    id: 'proj-002',
    name: 'Turbine Overhaul Unit 3',
    status: 'In Progress',
    deadline: '15 Oct 2026',
    progress: 62,
    totalTasks: 18,
    completedTasks: 11,
    lead: 'Sarah Lee',
    color: '#8b5cf6',
  },
  {
    id: 'proj-003',
    name: 'Plant Expansion - East Wing',
    status: 'In Progress',
    deadline: '20 Dec 2026',
    progress: 45,
    totalTasks: 32,
    completedTasks: 14,
    lead: 'Michael Tan',
    color: '#10b981',
  },
  {
    id: 'proj-004',
    name: 'Safety Audit Q3',
    status: 'Review',
    deadline: '25 Aug 2026',
    progress: 90,
    totalTasks: 12,
    completedTasks: 11,
    lead: 'Emily Wong',
    color: '#f59e0b',
  },
  {
    id: 'proj-005',
    name: 'Control System Upgrade',
    status: 'Planning',
    deadline: '01 Nov 2026',
    progress: 30,
    totalTasks: 20,
    completedTasks: 6,
    lead: 'David Lim',
    color: '#ef4444',
  },
];

export const TASKS = [
  { id: 'TSK-101', task: 'Prepare P&ID drawings', project: 'Pipeline Revamp Phase 2', projectId: 'proj-001', assignee: 'John Carter', priority: 'High', status: 'Completed', deadline: '05 Aug 2026' },
  { id: 'TSK-102', task: 'Material procurement review', project: 'Pipeline Revamp Phase 2', projectId: 'proj-001', assignee: 'Sarah Lee', priority: 'Medium', status: 'In Progress', deadline: '12 Aug 2026' },
  { id: 'TSK-103', task: 'Vibration analysis report', project: 'Turbine Overhaul Unit 3', projectId: 'proj-002', assignee: 'Michael Tan', priority: 'High', status: 'In Progress', deadline: '18 Aug 2026' },
  { id: 'TSK-104', task: 'Foundation load calculation', project: 'Plant Expansion - East Wing', projectId: 'proj-003', assignee: 'Emily Wong', priority: 'High', status: 'Pending', deadline: '20 Aug 2026' },
  { id: 'TSK-105', task: 'Hazard identification checklist', project: 'Safety Audit Q3', projectId: 'proj-004', assignee: 'David Lim', priority: 'Medium', status: 'Review', deadline: '22 Aug 2026' },
  { id: 'TSK-106', task: 'PLC programming scope', project: 'Control System Upgrade', projectId: 'proj-005', assignee: 'John Carter', priority: 'Low', status: 'Pending', deadline: '01 Sep 2026' },
  { id: 'TSK-107', task: 'Welding inspection schedule', project: 'Pipeline Revamp Phase 2', projectId: 'proj-001', assignee: 'Sarah Lee', priority: 'Medium', status: 'Completed', deadline: '08 Aug 2026' },
  { id: 'TSK-108', task: 'Bearing replacement plan', project: 'Turbine Overhaul Unit 3', projectId: 'proj-002', assignee: 'Michael Tan', priority: 'High', status: 'Pending', deadline: '25 Aug 2026' },
];

export const TASK_COLUMNS = ['', 'ID', 'Task', 'Project', 'Assignee', 'Priority', 'Status', 'Deadline'];

export const TEAM_MEMBERS = [
  { name: 'John Carter', role: 'Lead Engineer', avatar: 'JC', activeTasks: 4, color: 'from-blue-500 to-blue-600' },
  { name: 'Sarah Lee', role: 'Mechanical Engineer', avatar: 'SL', activeTasks: 3, color: 'from-violet-500 to-purple-600' },
  { name: 'Michael Tan', role: 'Structural Engineer', avatar: 'MT', activeTasks: 5, color: 'from-emerald-500 to-teal-600' },
  { name: 'Emily Wong', role: 'Safety Engineer', avatar: 'EW', activeTasks: 2, color: 'from-amber-500 to-orange-600' },
  { name: 'David Lim', role: 'Electrical Engineer', avatar: 'DL', activeTasks: 3, color: 'from-rose-500 to-pink-600' },
  { name: 'Anna Chen', role: 'Project Coordinator', avatar: 'AC', activeTasks: 6, color: 'from-cyan-500 to-blue-600' },
];

export const DOCUMENTS = [
  { name: 'P&ID Drawing Rev3.dwg', type: 'DWG', size: '4.2 MB', date: '10 Aug 2026', projectId: 'proj-001', category: 'CF SPEC' },
  { name: 'Material Spec Sheet.pdf', type: 'PDF', size: '1.8 MB', date: '08 Aug 2026', projectId: 'proj-001', category: 'PIS' },
  { name: 'Welding Procedure WPS-001.pdf', type: 'PDF', size: '920 KB', date: '06 Aug 2026', projectId: 'proj-001', category: 'QCPC' },
  { name: 'Vibration Analysis Report.xlsx', type: 'XLSX', size: '3.1 MB', date: '09 Aug 2026', projectId: 'proj-002', category: 'CF SPEC' },
  { name: 'Turbine Disassembly SOP.pdf', type: 'PDF', size: '2.4 MB', date: '05 Aug 2026', projectId: 'proj-002', category: 'PIS' },
  { name: 'Structural Load Calc.xlsx', type: 'XLSX', size: '1.5 MB', date: '11 Aug 2026', projectId: 'proj-003', category: 'QCPC' },
  { name: 'Foundation Layout.dwg', type: 'DWG', size: '5.7 MB', date: '07 Aug 2026', projectId: 'proj-003', category: 'CF SPEC' },
  { name: 'HAZOP Worksheet.xlsx', type: 'XLSX', size: '890 KB', date: '10 Aug 2026', projectId: 'proj-004', category: 'PIS' },
  { name: 'PLC I/O List Draft.xlsx', type: 'XLSX', size: '1.2 MB', date: '04 Aug 2026', projectId: 'proj-005', category: 'QCPC' },
];

export const INITIAL_CATEGORIES = ['CF SPEC', 'PIS', 'QCPC', 'General Spec'];
