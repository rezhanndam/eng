import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

const STORAGE_KEYS = ['eng_projects', 'eng_tasks', 'eng_documents', 'eng_categories', 'eng_activity', 'eng_team', 'eng_daily_reports', 'activeProjectId'];

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  resetApp = () => {
    STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
          <section className="max-w-md w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-8 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-500 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">Workspace could not load</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Local workspace data may be invalid. Resetting restores the initial demo data.</p>
            <button onClick={this.resetApp} className="mt-6 inline-flex items-center gap-2 h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl cursor-pointer active:scale-95 transition-all">
              <RotateCcw className="w-4 h-4" /> Reset local data
            </button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
