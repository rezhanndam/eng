import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Lock, Mail, LogIn, UserPlus, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { USERS, ROLE_LABELS } from '../auth';
import { isCloudStorage } from '../lib/supabase';
import { BRAND } from '../data';

export default function LoginPage() {
  const { login, signUp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        const ok = await login(email, password);
        if (ok) {
          showToast('Welcome back.');
          navigate('/');
        } else {
          setError('Invalid email or password.');
        }
      } else {
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          return;
        }
        const result = await signUp(email, password, name);
        if (!result.ok) {
          setError(result.error || 'Sign up failed.');
        } else if (result.confirm) {
          setInfo('Account created! Check your email to confirm, then sign in.');
        } else {
          showToast('Account created. Welcome!');
          navigate('/');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (account) => {
    await login(account.email, account.password);
    showToast(`Signed in as ${account.name}.`);
    navigate('/');
  };

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setInfo('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Zap className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none">{BRAND.name}</span>
            <span className="text-[12px] text-slate-400 dark:text-slate-500 block leading-none mt-1">{BRAND.subtitle}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-8">
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-700/60 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`flex-1 h-9 text-[13px] font-semibold rounded-lg transition-colors cursor-pointer ${mode === 'signin' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 h-9 text-[13px] font-semibold rounded-lg transition-colors cursor-pointer ${mode === 'signup' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Create Account
            </button>
          </div>

          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-[13px] text-slate-400 dark:text-slate-500 mt-1">
            {mode === 'signin' ? 'Enter your credentials to access the workspace.' : 'Sign up to start managing your projects.'}
          </p>

          {error && (
            <div className="mt-4 flex items-center gap-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl px-3 py-2.5 text-[12.5px] text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {info && (
            <div className="mt-4 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl px-3 py-2.5 text-[12.5px] text-emerald-600 dark:text-emerald-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full h-11 px-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 transition-all"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full h-11 pl-9 pr-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-11 pl-9 pr-3 text-[13px] bg-slate-50 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50 transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 flex items-center justify-center gap-2 text-[13.5px] font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'signin' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        {!isCloudStorage && (
          <div className="mt-6">
            <p className="text-center text-[12px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Demo Accounts</p>
            <div className="grid grid-cols-3 gap-3">
              {USERS.map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleQuickLogin(account)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-[11px] font-bold mx-auto mb-2 group-hover:scale-105 transition-transform">
                    {account.avatar}
                  </div>
                  <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 truncate">{account.role}</p>
                  <p className="text-[10.5px] text-slate-400 dark:text-slate-500 truncate">{ROLE_LABELS[account.role]}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
