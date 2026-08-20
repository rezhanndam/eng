import { RefreshCw, Zap, LogOut, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BRAND, MAIN_NAV, INTEGRATIONS } from '../data';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export default function Sidebar({ activeProject, onSwitchProject, open = false, onClose }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    localStorage.removeItem('activeProjectId');
    navigate('/');
  };

  const visibleNav = MAIN_NAV.filter((item) => {
    if (item.label === 'Job Activity Report' && user?.role === 'viewer') return false;
    return item.label !== 'Projects';
  });

  const openDrive = () => {
    const link = activeProject?.driveLink?.trim();
    const url = link && !/^https?:\/\//i.test(link) ? `https://${link}` : link;
    window.open(url || 'https://drive.google.com', '_blank', 'noopener,noreferrer');
  };

  const openWhatsapp = () => {
    const number = (activeProject?.whatsapp || '').replace(/\D/g, '');
    if (!number) {
      showToast('Set a WhatsApp number in Project settings.', 'info');
      return;
    }
    window.open(`https://wa.me/${number}`, '_blank', 'noopener,noreferrer');
  };

  const openEmail = () => {
    window.location.href = 'mailto:';
  };

  const integrationAction = {
    drive: openDrive,
    whatsapp: openWhatsapp,
    email: openEmail,
  };

  return (
    <>
      {open && <div onClick={onClose} className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col px-4 py-6 shrink-0 transition-transform duration-300 lg:translate-x-0 lg:sticky lg:top-0 lg:min-h-screen lg:bg-white/80 lg:dark:bg-slate-900/80 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center gap-2.5 px-3 mb-6 lg:pr-8">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center shadow-sm shadow-blue-500/20">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-[15px] font-bold text-slate-900 dark:text-slate-100 leading-none">{BRAND.name}</span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block leading-none mt-0.5">{BRAND.subtitle}</span>
        </div>
        <button onClick={onClose} aria-label="Close menu" className="ml-auto lg:hidden p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      {activeProject && (
        <div className="bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-3.5 mb-6 shadow-sm hover:shadow transition-all duration-200 hover:border-slate-300/80 dark:hover:border-slate-600">
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Active Project</p>
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: activeProject.color }} />
            <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 truncate">{activeProject.name}</p>
          </div>
          <button
            onClick={onSwitchProject}
            className="w-full flex items-center justify-center gap-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500 hover:shadow-sm text-[11px] font-semibold py-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Switch Project
          </button>
        </div>
      )}

      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-2">Main Menu</p>
      <nav className="flex flex-col gap-0.5 mb-6">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const itemPath = item.path === '/' ? '/dashboard' : item.path;
          return (
            <NavLink
              key={item.label}
              to={itemPath}
              end={itemPath === '/dashboard'}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-all duration-200 no-underline group ${
                  isActive
                    ? 'bg-blue-50/70 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-[3.5px] before:bg-blue-600 dark:before:bg-blue-400 before:rounded-r shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-[18px] h-[18px] group-hover:scale-105 transition-transform duration-200" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-semibold flex items-center justify-center shadow-sm shadow-red-500/20 group-hover:scale-105 transition-transform duration-200">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-2">Integrations</p>
      <nav className="flex flex-col gap-0.5 mb-6">
        {INTEGRATIONS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={integrationAction[item.id]}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] text-slate-500 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 transition-all duration-200 group cursor-pointer text-left"
            >
              <Icon className="w-[18px] h-[18px] group-hover:scale-105 transition-transform duration-200" />
              <span className="flex-1">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="flex items-center gap-3 px-3 py-4 mt-3 rounded-xl hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all duration-200 group border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-[12px] font-bold shrink-0 shadow-sm shadow-blue-500/10 group-hover:scale-105 transition-transform duration-200">
            {user?.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">{user?.name}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">{user?.title}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign out</span>
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
