export const ROLE_LABELS = {
  admin: 'Project Admin',
  engineer: 'Lead Engineer',
  viewer: 'Viewer',
};

// Per-project access levels (client-side gating on top of the account role).
// `full` keeps the user's own ROLE_PERMISSIONS; `editor` and `viewer` clamp
// what can be done inside that project regardless of the account role.
export const PROJECT_ACCESS_LABELS = {
  full: 'Full Access',
  editor: 'Editor',
  viewer: 'Viewer (read-only)',
};

export const PROJECT_ACCESS_PERMISSIONS = {
  full: null,
  editor: [
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
