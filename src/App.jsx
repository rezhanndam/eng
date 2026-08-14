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
import { deleteDocumentFile } from './lib/docStorage';
import { isCloudData, loadWorkspace, saveWorkspace } from './lib/cloudData';

const ProjectPortalPage = lazy(() => import('./pages/ProjectPortalPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const JobActivityReportPage = lazy(() => import('./pages/JobActivityReportPage'));
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

  const navigate = useNavigate();
  const location = useLocation();

  const [cloudSynced, setCloudSynced] = useState(null);

  const stateRef = useRef({ projects, tasks, documents, categories, activity, teamMembers, dailyReports });
  stateRef.current = { projects, tasks, documents, categories, activity, teamMembers, dailyReports };

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
        const remote = await loadWorkspace(userId);
        if (cancelled) return;
        
        if (remote && Array.isArray(remote.projects)) {
          if (Array.isArray(remote.tasks)) setTasks(remote.tasks);
          if (Array.isArray(remote.documents)) setDocuments(remote.documents.map((d, i) => ({ ...d, id: d.id || `legacy-doc-${i}` })));
          if (remote.categories && typeof remote.categories === 'object') setCategories(remote.categories);
          if (Array.isArray(remote.activity)) setActivity(remote.activity);
          if (Array.isArray(remote.team)) setTeamMembers(remote.team.map((m, i) => ({ ...m, id: m.id || `mem-legacy-${i}` })));
          if (remote.dailyReports && typeof remote.dailyReports === 'object') setDailyReports(remote.dailyReports);
          setProjects(remote.projects);
          
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
  const saveTimer = useRef(null);
  useEffect(() => {
    if (!isCloudData || !cloudSynced || !userId) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const snapshot = stateRef.current;
      saveWorkspace(userId, {
        version: 1,
        projects: snapshot.projects,
        tasks: snapshot.tasks,
        documents: snapshot.documents,
        categories: snapshot.categories,
        activity: snapshot.activity,
        team: snapshot.teamMembers,
        dailyReports: snapshot.dailyReports,
      }).catch((e) => {
        console.error('Cloud save failed:', e);
        showToast('Gagal sinkron ke cloud. Perubahan disimpan lokal.', 'error');
      });
    }, 1500);
    return () => clearTimeout(saveTimer.current);
  }, [projects, tasks, documents, categories, activity, teamMembers, dailyReports, cloudSynced, userId, showToast]);

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

  const logActivity = (action, detail) => {
    setActivity((previous) => [{ id: crypto.randomUUID(), projectId: activeProjectId, action, detail, timestamp: new Date().toISOString() }, ...previous].slice(0, 50));
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

  const handleSaveProject = (projectData) => {
    const isEditing = projects.some((p) => p.id === projectData.id);
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === projectData.id);
      if (exists) {
        return prev.map((p) => (p.id === projectData.id ? projectData : p));
      }
      return [...prev, projectData];
    });
    if (!categories[projectData.id]) {
      setCategories((prev) => ({ ...prev, [projectData.id]: initialCategories }));
    }
    logActivity(isEditing ? 'Updated project' : 'Created project', projectData.name);
    showToast('Project saved successfully.');
  };

  const handleDeleteProject = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setTasks((prev) => prev.filter((t) => t.projectId !== projectId));
    setDocuments((prev) => prev.filter((d) => d.projectId !== projectId));
    setCategories((prev) => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });
    if (activeProjectId === projectId) {
      setActiveProjectId('');
      localStorage.removeItem('activeProjectId');
      navigate('/');
    }
    logActivity('Deleted project', project?.name || projectId);
    showToast('Project deleted.', 'info');
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  const activeProject = computedProjects.find((p) => p.id === activeProjectId);

  // Redirect logic if no active project
  useEffect(() => {
    if (!activeProjectId && location.pathname !== '/') {
      navigate('/');
    } else if (activeProjectId && location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [activeProjectId, location.pathname, navigate]);

  // Task Actions
  const handleSaveTask = (newTask) => {
    const isEditing = tasks.some((t) => t.id === newTask.id);
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === newTask.id);
      if (exists) {
        return prev.map((t) => (t.id === newTask.id ? newTask : t));
      } else {
        return [...prev, newTask];
      }
    });
    logActivity(isEditing ? 'Updated task' : 'Created task', newTask.task);
    showToast('Task saved successfully.');
  };

  const handleDeleteTask = (taskId) => {
    const task = tasks.find((item) => item.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    logActivity('Deleted task', task?.task || taskId);
    showToast('Task deleted.', 'info');
  };

  // Document CRUD Actions
  const handleAddDocument = (newDoc) => {
    setDocuments((prev) => [...prev, newDoc]);
    logActivity('Added document', newDoc.name);
    showToast('Document uploaded successfully.');
  };

  const handleEditDocument = (updatedDoc) => {
    setDocuments((prev) => prev.map((document) => (document.id === updatedDoc.id ? updatedDoc : document)));
    logActivity('Updated document', updatedDoc.name);
    showToast('Document updated successfully.');
  };

  const handleDeleteDocument = (doc) => {
    deleteDocumentFile(doc);
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    logActivity('Deleted document', doc.name);
    showToast('Document deleted.', 'info');
  };

  // Team Member CRUD Actions
  const handleSaveMember = (memberData) => {
    const isEditing = teamMembers.some((m) => m.id === memberData.id);
    setTeamMembers((prev) => {
      const exists = prev.some((m) => m.id === memberData.id);
      if (exists) {
        return prev.map((m) => (m.id === memberData.id ? memberData : m));
      }
      return [...prev, memberData];
    });
    logActivity(isEditing ? 'Updated team member' : 'Added team member', memberData.name);
    showToast('Team member saved successfully.');
  };

  const handleDeleteMember = (memberId) => {
    const member = teamMembers.find((m) => m.id === memberId);
    setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
    logActivity('Removed team member', member?.name || memberId);
    showToast('Team member removed.', 'info');
  };

  const projectDailyReports = dailyReports[activeProjectId] || [];
  const handleSaveDailyReport = (entry) => {
    setDailyReports((prev) => {
      const list = [...(prev[activeProjectId] || []).filter((e) => e.dateVal !== entry.dateVal), entry];
      return { ...prev, [activeProjectId]: list };
    });
    logActivity('Saved daily report', `${entry.name} · ${entry.dateVal}`);
  };

  const handleDeleteDailyReport = (dateVal) => {
    setDailyReports((prev) => ({
      ...prev,
      [activeProjectId]: (prev[activeProjectId] || []).filter((e) => e.dateVal !== dateVal),
    }));
    logActivity('Deleted daily report', dateVal);
  };

  // Category Actions are scoped to the active project.
  const activeCategories = (categories[activeProjectId]?.length ? categories[activeProjectId] : initialCategories);
  const handleAddCategory = (name) => {
    if (activeCategories.includes(name)) return showToast('Category already exists.', 'error');
    setCategories((prev) => ({ ...prev, [activeProjectId]: [...activeCategories, name] }));
    showToast('Category added successfully.');
  };

  const handleEditCategory = (oldName, newName) => {
    if (activeCategories.includes(newName)) return showToast('Category name already exists.', 'error');
    setCategories((prev) => ({ ...prev, [activeProjectId]: activeCategories.map((category) => category === oldName ? newName : category) }));
    setDocuments((prev) => prev.map((document) => document.projectId === activeProjectId && document.category === oldName ? { ...document, category: newName } : document));
    showToast('Category updated successfully.');
  };

  const handleDeleteCategory = (name) => {
    const next = activeCategories.filter((category) => category !== name);
    const nextCategories = next.includes('General Spec') ? next : [...next, 'General Spec'];
    setCategories((prev) => ({ ...prev, [activeProjectId]: nextCategories }));
    setDocuments((prev) => prev.map((document) => document.projectId === activeProjectId && document.category === name ? { ...document, category: 'General Spec' } : document));
    showToast(`Category "${name}" deleted. Documents moved to General Spec.`, 'info');
  };

  if (!activeProjectId) {
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
          <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
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
                can={can}
                activeProject={activeProject}
                teamMembers={teamMembers}
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
                onAddCategory={handleAddCategory}
                onEditCategory={handleEditCategory}
                onDeleteCategory={handleDeleteCategory}
                activeProjectId={activeProjectId}
                can={can}
              />
            }
          />
          <Route path="/team" element={<TeamPage projectTasks={isolatedTasks} teamMembers={teamMembers} canManage={can('team.manage')} onSaveMember={handleSaveMember} onDeleteMember={handleDeleteMember} />} />
          <Route path="/reports" element={<ReportsPage projects={activeProject ? [activeProject] : []} tasks={isolatedTasks} documents={isolatedDocs} activity={activity.filter((item) => item.projectId === activeProjectId)} />} />
          <Route path="/activity" element={<JobActivityReportPage activity={activity.filter((item) => item.projectId === activeProjectId)} activeProject={activeProject} dailyReports={projectDailyReports} onSaveDailyReport={handleSaveDailyReport} onDeleteDailyReport={handleDeleteDailyReport} />} />
          <Route path="/messages" element={<Navigate to="/activity" replace />} />
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
