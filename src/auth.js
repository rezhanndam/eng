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
