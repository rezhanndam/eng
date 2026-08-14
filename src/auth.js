export const USERS = [
  { email: 'admin@engdesk.id', password: 'admin123', name: 'Admin User', role: 'admin', title: 'Project Admin', avatar: 'AU' },
  { email: 'engineer@engdesk.id', password: 'engineer123', name: 'John Carter', role: 'engineer', title: 'Lead Engineer', avatar: 'JC' },
  { email: 'viewer@engdesk.id', password: 'viewer123', name: 'Sarah Lee', role: 'viewer', title: 'Viewer', avatar: 'SL' },
];

export const ROLE_LABELS = {
  admin: 'Project Admin',
  engineer: 'Lead Engineer',
  viewer: 'Viewer',
};

export const ROLE_PERMISSIONS = {
  admin: [
    'project.manage',
    'task.create',
    'task.edit',
    'task.delete',
    'document.upload',
    'document.edit',
    'document.delete',
    'category.manage',
    'team.manage',
    'reports.view',
    'team.view',
  ],
  engineer: [
    'task.create',
    'task.edit',
    'task.delete',
    'document.upload',
    'document.edit',
    'document.delete',
    'reports.view',
    'team.view',
  ],
  viewer: ['reports.view', 'team.view'],
};
