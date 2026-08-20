import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { useToast } from './hooks/useToast';
import { useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import { deleteDocumentFiles } from './lib/docStorage';
import { isCloudData, loadWorkspace, saveWorkspaceSafely } from './lib/cloudData';
import { PROJECT_ACCESS_PERMISSIONS } from './auth';

const ProjectPortalPage = lazy(() => import('./pages/ProjectPortalPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const KanbanPage = lazy(() => import('./pages/KanbanPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const JobActivityReportPage = lazy(() => import('./pages/JobActivityReportPage'));
const TrashPage = lazy(() => import('./pages/TrashPage'));
const DataPage = lazy(() => import('./pages/DataPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

// Import initial data
import {
  PROJECTS as initialProjects,
  TASKS as initialTasks,
  DOCUMENTS as initialDocuments,
  INITIAL_CATEGORIES as initialCategories,
  TEAM_MEMBERS as initialTeamMembers,
} from './data';

function NavigationWrapper() {
  const { showToast } = useToast();
  const { can, user } = useAuth();
  const userId = user?.id;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load state from localStorage or fallback to initial data
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('eng_projects');
    return saved ? JSON.parse(saved) : initialProjects;
  });

  const [teamMembers, setTeamMembers] = useState(() => {
    const saved = localStorage.getItem('eng_team');
    const source = saved ? JSON.parse(saved) : initialTeamMembers;
    return source.map((member, index) => ({ ...member, id: member.id || `mem-legacy-${index}` }));
  });

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('eng_tasks');
    return saved ? JSON.parse(saved) : initialTasks;
  });

  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem('eng_documents');
    const source = saved ? JSON.parse(saved) : initialDocuments;
    return source.map((document, index) => ({ ...document, id: document.id || `legacy-doc-${index}` }));
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('eng_categories');
    if (!saved) return Object.fromEntries(initialProjects.map((project) => [project.id, initialCategories]));
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) return Object.fromEntries(initialProjects.map((project) => [project.id, parsed]));
    return parsed;
  });

  const [activeProjectId, setActiveProjectId] = useState(() => {
    return localStorage.getItem('activeProjectId') || '';
  });

  const [activity, setActivity] = useState(() => {
    const saved = localStorage.getItem('eng_activity');
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });

  const [dailyReports, setDailyReports] = useState(() => {
    const saved = localStorage.getItem('eng_daily_reports');
    try { return saved ? JSON.parse(saved) : {}; } catch { return {}; }
  });

  const [trash, setTrash] = useState(() => {
    const saved = localStorage.getItem('eng_trash');
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });

  const navigate = useNavigate();
  const location = useLocation();

  const [cloudSynced, setCloudSynced] = useState(null);

  const deletedRef = useRef([]);
  const lastSavedUpdatedAt = useRef(null);
  const stateRef = useRef({ projects, tasks, documents, categories, activity, teamMembers, dailyReports, trash });
  stateRef.current = { projects, tasks, documents, categories, activity, teamMembers, dailyReports, trash, deleted: deletedRef.current };

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Load workspace from Supabase on mount; fall back to localStorage silently.
  useEffect(() => {
    let cancelled = false;
    let toastShown = false;
    let retryCount = 0;
    const MAX_RETRIES = 2;

    async function initCloud() {
      if (!isCloudData || !userId) {
        setCloudSynced(false);
        return;
      }
      
      try {
        const loaded = await loadWorkspace(userId);
        if (cancelled) return;
        const remote = loaded?.data || null;
        lastSavedUpdatedAt.current = loaded?.updatedAt || null;

        if (remote && Array.isArray(remote.projects)) {
          if (Array.isArray(remote.tasks)) setTasks(remote.tasks);
          if (Array.isArray(remote.documents)) setDocuments(remote.documents.map((d, i) => ({ ...d, id: d.id || `legacy-doc-${i}` })));
          if (remote.categories && typeof remote.categories === 'object') setCategories(remote.categories);
          if (Array.isArray(remote.activity)) setActivity(remote.activity);
          if (Array.isArray(remote.team)) setTeamMembers(remote.team.map((m, i) => ({ ...m, id: m.id || `mem-legacy-${i}` })));
          if (remote.dailyReports && typeof remote.dailyReports === 'object') setDailyReports(remote.dailyReports);
          if (Array.isArray(remote.trash)) setTrash(remote.trash);
          setProjects(remote.projects);
          if (Array.isArray(remote.deleted)) deletedRef.current = remote.deleted;

          if (!toastShown) {
            toastShown = true;
            showToast('Cloud sync aktif — data dimuat dari cloud.', 'info');
          }
        } else if (!toastShown) {
          toastShown = true;
          showToast('Cloud sync aktif — data lokal diunggah ke cloud.', 'info');
        }
        setCloudSynced(true);
      } catch (e) {
        console.error('Cloud load failed:', e);
        if (cancelled) return;
        
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          setTimeout(initCloud, 2000 * retryCount);
        } else {
          showToast('Cloud sync gagal terhubung. Menggunakan data lokal.', 'error');
          setCloudSynced(false);
        }
      }
    }

    initCloud();
    return () => {
      cancelled = true;
    };
  }, [showToast, userId]);

  // Debounced upsert of the whole workspace to Supabase whenever anything changes.
  // If the remote blob was modified elsewhere since we last saved, it is pulled
  // and merged (per-item, newest updatedAt wins) so no work is silently lost.
  const saveTimer = useRef(null);
  useEffect(() => {
    if (!isCloudData || !cloudSynced || !userId) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const snapshot = stateRef.current;
      try {
        const result = await saveWorkspaceSafely(userId, {
          version: 1,
          projects: snapshot.projects,
          tasks: snapshot.tasks,
          documents: snapshot.documents,
          categories: snapshot.categories,
          activity: snapshot.activity,
          team: snapshot.teamMembers,
          dailyReports: snapshot.dailyReports,
          trash: snapshot.trash,
          deleted: snapshot.deleted,
        }, lastSavedUpdatedAt.current);
        lastSavedUpdatedAt.current = result.updatedAt;
        if (result.merged) {
          setProjects(result.merged.projects);
          setTasks(result.merged.tasks);
          setDocuments(result.merged.documents);
          setCategories(result.merged.categories);
          setActivity(result.merged.activity);
          setTeamMembers(result.merged.team);
          setDailyReports(result.merged.dailyReports);
          setTrash(result.merged.trash || []);
          deletedRef.current = result.merged.deleted || [];
        }
      } catch (e) {
        console.error('Cloud save failed:', e);
        showToast('Gagal sinkron ke cloud. Perubahan disimpan lokal.', 'error');
      }
    }, 1500);
    return () => clearTimeout(saveTimer.current);
  }, [projects, tasks, documents, categories, activity, teamMembers, dailyReports, trash, cloudSynced, userId, showToast]);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem('eng_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('eng_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('eng_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('eng_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('eng_activity', JSON.stringify(activity));
  }, [activity]);

  useEffect(() => {
    localStorage.setItem('eng_team', JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem('eng_daily_reports', JSON.stringify(dailyReports));
  }, [dailyReports]);

  useEffect(() => {
    localStorage.setItem('eng_trash', JSON.stringify(trash));
  }, [trash]);

  const logActivity = (action, detail, projectId = activeProjectId) => {
    setActivity((previous) => [{ id: crypto.randomUUID(), projectId, action, detail, user: user?.name || '', timestamp: new Date().toISOString() }, ...previous].slice(0, 50));
  };

  // Compute projects dynamically with dynamic progress and task counts
  const computedProjects = projects.map((proj) => {
    const projTasks = tasks.filter((t) => t.projectId === proj.id);
    const total = projTasks.length;
    const completed = projTasks.filter((t) => t.status === 'Completed').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      ...proj,
      totalTasks: total,
      completedTasks: completed,
      progress,
    };
  });

  const handleSelectProject = (id) => {
    setActiveProjectId(id);
    localStorage.setItem('activeProjectId', id);
    navigate('/dashboard');
  };

  const handleSwitchProject = () => {
    setActiveProjectId('');
    localStorage.removeItem('activeProjectId');
    navigate('/');
  };

  const handleImportData = (backup) => {
    if (Array.isArray(backup.projects)) setProjects(backup.projects);
    if (Array.isArray(backup.tasks)) setTasks(backup.tasks);
    if (Array.isArray(backup.documents)) {
      setDocuments(backup.documents.map((d, i) => ({ ...d, id: d.id || `legacy-doc-${i}` })));
    }
    if (backup.categories && typeof backup.categories === 'object') setCategories(backup.categories);
    if (Array.isArray(backup.teamMembers)) {
      setTeamMembers(backup.teamMembers.map((m, i) => ({ ...m, id: m.id || `mem-legacy-${i}` })));
    }
    if (Array.isArray(backup.activity)) setActivity(backup.activity);
    if (backup.dailyReports && typeof backup.dailyReports === 'object') setDailyReports(backup.dailyReports);
    if (Array.isArray(backup.trash)) setTrash(backup.trash);
    if (Array.isArray(backup.deleted)) deletedRef.current = backup.deleted;
    logActivity('Imported data backup', 'All data restored from a backup file');
    showToast('Data imported successfully.');
  };

  const handleSaveProject = (projectData) => {
    const isEditing = projects.some((p) => p.id === projectData.id);
    const data = { ...projectData, updatedAt: new Date().toISOString() };
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === data.id);
      if (exists) {
        return prev.map((p) => (p.id === data.id ? data : p));
      }
      return [...prev, data];
    });
    if (!categories[data.id]) {
      setCategories((prev) => ({ ...prev, [data.id]: initialCategories }));
    }
    logActivity(isEditing ? 'Updated project' : 'Created project', data.name, data.id);
    showToast('Project saved successfully.');
  };

  const handleDeleteProject = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    const ts = new Date().toISOString();
    const projTasks = tasks.filter((t) => t.projectId === projectId);
    const projDocs = documents.filter((d) => d.projectId === projectId);
    deletedRef.current = [
      ...deletedRef.current,
      { type: 'project', id: projectId, ts },
      ...projTasks.map((t) => ({ type: 'task', id: t.id, ts })),
      ...projDocs.map((d) => ({ type: 'document', id: d.id, ts })),
    ].slice(-500);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setTasks((prev) => prev.filter((t) => t.projectId !== projectId));
    setDocuments((prev) => prev.filter((d) => d.projectId !== projectId));
    setCategories((prev) => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });
    setTrash((prev) => [
      { type: 'project', id: projectId, item: { ...project, categories: categories[projectId] }, deletedAt: ts },
      ...projTasks.map((t) => ({ type: 'task', id: t.id, item: t, deletedAt: ts })),
      ...projDocs.map((d) => ({ type: 'document', id: d.id, item: d, deletedAt: ts })),
      ...prev,
    ]);
    if (activeProjectId === projectId) {
      setActiveProjectId('');
      localStorage.removeItem('activeProjectId');
      navigate('/');
    }
    logActivity('Deleted project', project?.name || projectId);
    showToast('Project moved to trash.', 'info');
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  const activeProject = computedProjects.find((p) => p.id === activeProjectId);

  // Project-scoped permissions: an Editor/Viewer access level on the active
  // project clamps `can()` regardless of the account role.
  const projectCan = (permission) => {
    const level = activeProject?.accessLevel;
    const levelPerms = PROJECT_ACCESS_PERMISSIONS[level];
    if (levelPerms) return levelPerms.includes(permission);
    return can(permission);
  };

  // Redirect logic if no active project, or if the active project no longer
  // exists (e.g. it was deleted on another device while its id was still
  // cached locally). Falling back to the portal avoids crashes on /dashboard.
  useEffect(() => {
    const projectExists = projects.some((p) => p.id === activeProjectId);
    if (activeProjectId && !projectExists) {
      setActiveProjectId('');
      localStorage.removeItem('activeProjectId');
    } else if (!activeProjectId && location.pathname !== '/') {
      navigate('/');
    } else if (activeProjectId && location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [activeProjectId, projects, location.pathname, navigate]);

  // Task Actions
  const handleAddTaskComment = (taskId, text) => {
    const task = tasks.find((t) => t.id === taskId);
    const comment = { id: crypto.randomUUID(), user: user?.name || '', text: text.trim(), timestamp: new Date().toISOString() };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, comments: [...(t.comments || []), comment], updatedAt: new Date().toISOString() } : t)));
    logActivity('Commented on task', task?.task || taskId);
    showToast('Comment added.');
  };

  const handleAddDocumentComment = (docId, text) => {
    const doc = documents.find((d) => d.id === docId);
    const comment = { id: crypto.randomUUID(), user: user?.name || '', text: text.trim(), timestamp: new Date().toISOString() };
    setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, comments: [...(d.comments || []), comment], updatedAt: new Date().toISOString() } : d)));
    logActivity('Commented on document', doc?.name || docId);
    showToast('Comment added.');
  };

  const handleSaveTask = (newTask) => {
    const isEditing = tasks.some((t) => t.id === newTask.id);
    const data = { ...newTask, updatedAt: new Date().toISOString() };
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === data.id);
      if (exists) {
        return prev.map((t) => (t.id === data.id ? data : t));
      } else {
        return [...prev, data];
      }
    });
    logActivity(isEditing ? 'Updated task' : 'Created task', data.task);
    showToast('Task saved successfully.');
  };

  const handleDeleteTask = (taskId) => {
    const task = tasks.find((item) => item.id === taskId);
    const ts = new Date().toISOString();
    const attachedDocs = documents.filter((d) => task?.documentIds?.includes(d.id) || d.taskId === taskId);
    deletedRef.current = [
      ...deletedRef.current,
      { type: 'task', id: taskId, ts },
      ...attachedDocs.map((d) => ({ type: 'document', id: d.id, ts })),
    ].slice(-500);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setDocuments((prev) => prev.filter((d) => !attachedDocs.some((ad) => ad.id === d.id)));
    setTrash((prev) => [
      { type: 'task', id: taskId, item: task, deletedAt: ts },
      ...attachedDocs.map((d) => ({ type: 'document', id: d.id, item: d, deletedAt: ts })),
      ...prev,
    ]);
    logActivity('Deleted task', task?.task || taskId);
    showToast('Task moved to trash.', 'info');
  };

  // Document CRUD Actions
  const handleAddDocument = (newDoc) => {
    const data = { ...newDoc, updatedAt: new Date().toISOString() };
    setDocuments((prev) => [...prev, data]);
    logActivity('Added document', data.name);
    showToast('Document uploaded successfully.');
  };

  const handleEditDocument = (updatedDoc) => {
    const data = { ...updatedDoc, updatedAt: new Date().toISOString() };
    setDocuments((prev) => prev.map((document) => (document.id === data.id ? data : document)));
    logActivity('Updated document', data.name);
    showToast('Document updated successfully.');
  };

  const handleRestoreDocumentVersion = (doc) => {
    const data = { ...doc, updatedAt: new Date().toISOString() };
    setDocuments((prev) => prev.map((document) => (document.id === data.id ? data : document)));
    logActivity('Restored document version', data.name);
    showToast('Document version restored.');
  };

  const handleDeleteDocument = (doc) => {
    // File is kept in storage so the document can be restored from trash.
    const ts = new Date().toISOString();
    deletedRef.current = [...deletedRef.current, { type: 'document', id: doc.id, ts }].slice(-500);
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    setTrash((prev) => [{ type: 'document', id: doc.id, item: doc, deletedAt: ts }, ...prev]);
    // Clean up the reference on the task it was attached to (if any).
    if (doc.taskId) {
      setTasks((prev) => prev.map((t) =>
        t.id === doc.taskId && t.documentIds?.includes(doc.id)
          ? { ...t, documentIds: t.documentIds.filter((id) => id !== doc.id), updatedAt: new Date().toISOString() }
          : t
      ));
    }
    logActivity('Deleted document', doc.name);
    showToast('Document moved to trash.', 'info');
  };

  // Team Member CRUD Actions
  const handleSaveMember = (memberData) => {
    const isEditing = teamMembers.some((m) => m.id === memberData.id);
    const data = { ...memberData, updatedAt: new Date().toISOString() };
    setTeamMembers((prev) => {
      const exists = prev.some((m) => m.id === data.id);
      if (exists) {
        return prev.map((m) => (m.id === data.id ? data : m));
      }
      return [...prev, data];
    });
    logActivity(isEditing ? 'Updated team member' : 'Added team member', data.name);
    showToast('Team member saved successfully.');
  };

  const handleDeleteMember = (memberId) => {
    const member = teamMembers.find((m) => m.id === memberId);
    const ts = new Date().toISOString();
    deletedRef.current = [...deletedRef.current, { type: 'member', id: memberId, ts }].slice(-500);
    setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
    setTrash((prev) => [{ type: 'member', id: memberId, item: member, deletedAt: ts }, ...prev]);
    logActivity('Removed team member', member?.name || memberId);
    showToast('Team member moved to trash.', 'info');
  };

  const projectDailyReports = dailyReports[activeProjectId] || [];
  const handleSaveDailyReport = (entry) => {
    const data = { ...entry, updatedAt: new Date().toISOString() };
    setDailyReports((prev) => {
      const list = [...(prev[activeProjectId] || []).filter((e) => e.dateVal !== data.dateVal), data];
      return { ...prev, [activeProjectId]: list };
    });
    logActivity('Saved daily report', `${data.name} · ${data.dateVal}`);
  };

  const handleDeleteDailyReport = (dateVal) => {
    const ts = new Date().toISOString();
    const id = `${activeProjectId}:${dateVal}`;
    const entry = (dailyReports[activeProjectId] || []).find((e) => e.dateVal === dateVal);
    deletedRef.current = [...deletedRef.current, { type: 'daily', id, ts }].slice(-500);
    setDailyReports((prev) => ({
      ...prev,
      [activeProjectId]: (prev[activeProjectId] || []).filter((e) => e.dateVal !== dateVal),
    }));
    setTrash((prev) => [{ type: 'daily', id, item: { ...entry, projectId: activeProjectId }, deletedAt: ts }, ...prev]);
    logActivity('Deleted daily report', dateVal);
  };

  // Trash / restore actions.
  const restoreFromTrash = (entry) => {
    const ts = new Date().toISOString();
    // A project restore also brings its tasks & documents back.
    const related = entry.type === 'project'
      ? trash.filter((e) => (e.type === 'task' || e.type === 'document') && e.item?.projectId === entry.id)
      : [];
    const removeKeys = new Set([`${entry.type}:${entry.id}`, ...related.map((r) => `${r.type}:${r.id}`)]);
    deletedRef.current = deletedRef.current.filter((t) => !removeKeys.has(`${t.type}:${t.id}`));
    setTrash((prev) => prev.filter((e) => !removeKeys.has(`${e.type}:${e.id}`)));

    if (entry.type === 'project') {
      setProjects((prev) => (prev.some((p) => p.id === entry.id) ? prev : [...prev, { ...entry.item, updatedAt: ts }]));
      if (entry.item?.categories) setCategories((prev) => ({ ...prev, [entry.id]: entry.item.categories }));
      const restoredTasks = related.filter((r) => r.type === 'task').map((r) => ({ ...r.item, updatedAt: ts }));
      const restoredDocs = related.filter((r) => r.type === 'document').map((r) => ({ ...r.item, updatedAt: ts }));
      if (restoredTasks.length) setTasks((prev) => [...prev, ...restoredTasks.filter((t) => !prev.some((x) => x.id === t.id))]);
      if (restoredDocs.length) setDocuments((prev) => [...prev, ...restoredDocs.filter((d) => !prev.some((x) => x.id === d.id))]);
    } else if (entry.type === 'task') {
      setTasks((prev) => (prev.some((t) => t.id === entry.id) ? prev : [...prev, { ...entry.item, updatedAt: ts }]));
    } else if (entry.type === 'document') {
      setDocuments((prev) => (prev.some((d) => d.id === entry.id) ? prev : [...prev, { ...entry.item, updatedAt: ts }]));
    } else if (entry.type === 'member') {
      setTeamMembers((prev) => (prev.some((m) => m.id === entry.id) ? prev : [...prev, { ...entry.item, updatedAt: ts }]));
    } else if (entry.type === 'daily') {
      setDailyReports((prev) => {
        const projectId = entry.item?.projectId;
        const list = projectId ? prev[projectId] || [] : [];
        if (!projectId || list.some((e) => e.dateVal === entry.item.dateVal)) return prev;
        return { ...prev, [projectId]: [...list, { ...entry.item, updatedAt: ts }] };
      });
    }
    logActivity('Restored', entry.item?.name || entry.item?.task || entry.id);
    showToast('Item restored from trash.');
  };

  const permanentDelete = (entry) => {
    const related = entry.type === 'project'
      ? trash.filter((e) => e.type === 'document' && e.item?.projectId === entry.id)
      : [];
    const removeKeys = new Set([`${entry.type}:${entry.id}`, ...related.map((r) => `document:${r.id}`)]);
    if (entry.type === 'document' && entry.item?.filePath) deleteDocumentFiles(entry.item);
    related.forEach((r) => r.item?.filePath && deleteDocumentFiles(r.item));
    setTrash((prev) => prev.filter((e) => !removeKeys.has(`${e.type}:${e.id}`)));
    logActivity('Permanently deleted', entry.item?.name || entry.item?.task || entry.id);
    showToast('Item permanently deleted.', 'info');
  };

  const emptyTrash = () => {
    trash.forEach((e) => {
      if (e.type === 'document' && e.item?.filePath) deleteDocumentFiles(e.item);
    });
    setTrash([]);
    logActivity('Emptied trash', 'All deleted items were permanently removed');
    showToast('Trash emptied.', 'info');
  };

  // Category Actions are scoped to the active project.
  const activeCategories = (categories[activeProjectId]?.length ? categories[activeProjectId] : initialCategories);
  const handleAddCategory = (name) => {
    if (activeCategories.includes(name)) return showToast('Category already exists.', 'error');
    // Mark this category as (re)added so a stale delete tombstone from another
    // device does not filter it out during a cloud merge.
    deletedRef.current = [...deletedRef.current, { type: 'category-revive', id: `${activeProjectId}:${name}`, ts: new Date().toISOString() }].slice(-500);
    setCategories((prev) => ({ ...prev, [activeProjectId]: [...activeCategories, name] }));
    showToast('Category added successfully.');
  };

  const handleEditCategory = (oldName, newName) => {
    if (activeCategories.includes(newName)) return showToast('Category name already exists.', 'error');
    const ts = new Date().toISOString();
    // The renamed category is effectively re-added under the new name.
    deletedRef.current = [...deletedRef.current, { type: 'category-revive', id: `${activeProjectId}:${newName}`, ts }].slice(-500);
    setCategories((prev) => ({ ...prev, [activeProjectId]: activeCategories.map((category) => category === oldName ? newName : category) }));
    setDocuments((prev) => prev.map((document) => document.projectId === activeProjectId && document.category === oldName ? { ...document, category: newName, updatedAt: ts } : document));
    showToast('Category updated successfully.');
  };

  const handleDeleteCategory = (name) => {
    const next = activeCategories.filter((category) => category !== name);
    const nextCategories = next.includes('General Spec') ? next : [...next, 'General Spec'];
    const ts = new Date().toISOString();
    // Track the deletion so the merge does not resurrect it from a stale copy.
    deletedRef.current = [...deletedRef.current, { type: 'category', id: `${activeProjectId}:${name}`, ts }].slice(-500);
    setCategories((prev) => ({ ...prev, [activeProjectId]: nextCategories }));
    setDocuments((prev) => prev.map((document) => document.projectId === activeProjectId && document.category === name ? { ...document, category: 'General Spec', updatedAt: ts } : document));
    showToast(`Category "${name}" deleted. Documents moved to General Spec.`, 'info');
  };

  if (!activeProject) {
    return (
      <Routes>
        <Route
          path="/"
          element={
            <ProjectPortalPage
              projects={computedProjects}
              onSelectProject={handleSelectProject}
              can={can}
              onSaveProject={handleSaveProject}
              onDeleteProject={handleDeleteProject}
              teamMembers={teamMembers}
              onSaveMember={handleSaveMember}
              onDeleteMember={handleDeleteMember}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Filter lists according to active project (Project isolation)
  const isolatedTasks = tasks.filter((t) => t.projectId === activeProjectId);
  const isolatedDocs = documents.filter((d) => d.projectId === activeProjectId);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar activeProject={activeProject} onSwitchProject={handleSwitchProject} open={isSidebarOpen} onClose={closeSidebar} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        <div className="flex items-center justify-between lg:hidden mb-6">
          <button onClick={() => setIsSidebarOpen(true)} aria-label="Open menu" className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <DashboardPage
                activeProject={activeProject}
                tasks={tasks}
                activity={activity}
                documents={isolatedDocs}
                projects={computedProjects}
                onSelectProject={handleSelectProject}
                onSwitchProject={handleSwitchProject}
              />
            }
          />
          <Route path="/projects" element={<Navigate to="/dashboard" replace />} />
          <Route path="/projects/:id" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/tasks"
            element={
              <TasksPage
                tasks={isolatedTasks}
                projects={computedProjects}
                onSaveTask={handleSaveTask}
                onDeleteTask={handleDeleteTask}
                can={projectCan}
                activeProject={activeProject}
                teamMembers={teamMembers}
                documents={documents}
                categories={activeCategories}
                onAddDocument={handleAddDocument}
                onAddTaskComment={handleAddTaskComment}
              />
            }
          />
          <Route
            path="/kanban"
            element={
              <KanbanPage
                tasks={isolatedTasks}
                can={projectCan}
                activeProject={activeProject}
                teamMembers={teamMembers}
                documents={documents}
                categories={activeCategories}
                onSaveTask={handleSaveTask}
                onAddDocument={handleAddDocument}
                onAddTaskComment={handleAddTaskComment}
              />
            }
          />
          <Route
            path="/documents"
            element={
              <DocumentsPage
                documents={isolatedDocs}
                categories={activeCategories}
                onAddDocument={handleAddDocument}
                onEditDocument={handleEditDocument}
                onDeleteDocument={handleDeleteDocument}
                onRestoreVersion={handleRestoreDocumentVersion}
                onAddCategory={handleAddCategory}
                onEditCategory={handleEditCategory}
                onDeleteCategory={handleDeleteCategory}
                onAddDocumentComment={handleAddDocumentComment}
                activeProjectId={activeProjectId}
                can={projectCan}
              />
            }
          />
          <Route path="/team" element={<TeamPage projectTasks={isolatedTasks} teamMembers={teamMembers} canManage={projectCan('team.manage')} onSaveMember={handleSaveMember} onDeleteMember={handleDeleteMember} />} />
          <Route path="/reports" element={<ReportsPage projects={activeProject ? [activeProject] : []} tasks={isolatedTasks} documents={isolatedDocs} activity={activity.filter((item) => item.projectId === activeProjectId)} />} />
          <Route path="/activity" element={user?.role === 'viewer' ? <Navigate to="/dashboard" replace /> : <JobActivityReportPage activity={activity.filter((item) => item.projectId === activeProjectId)} activeProject={activeProject} dailyReports={projectDailyReports} onSaveDailyReport={handleSaveDailyReport} onDeleteDailyReport={handleDeleteDailyReport} />} />
          <Route path="/messages" element={<Navigate to="/activity" replace />} />
          <Route
            path="/trash"
            element={
              <TrashPage
                trash={trash}
                onRestore={restoreFromTrash}
                onPermanentDelete={permanentDelete}
                onEmptyTrash={emptyTrash}
                can={projectCan}
              />
            }
          />
          <Route
            path="/backup"
            element={
              <DataPage
                data={stateRef.current}
                onImport={handleImportData}
                can={can}
              />
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AuthGate() {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-slate-200 dark:border-slate-700 border-t-blue-600 rounded-full animate-spin" />
      </main>
    );
  }
  if (!user) return <LoginPage />;
  return <NavigationWrapper />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>
            <BrowserRouter>
              <Suspense fallback={<main className="min-h-screen bg-slate-50 dark:bg-slate-900" />}>
                <AuthGate />
              </Suspense>
            </BrowserRouter>
          </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
