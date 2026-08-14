import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Lock, Mail, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { USERS, ROLE_LABELS } from '../auth';
import { BRAND } from '../data';

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(email, password)) {
      showToast('Welcome back.');
      navigate('/');
    } else {
      showToast('Invalid email or password.', 'error');
    }
  };

  const handleQuickLogin = (account) => {
    login(account.email, account.password);
    showToast(`Signed in as ${account.name}.`);
    navigate('/');
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Sign in</h1>
          <p className="text-[13px] text-slate-400 dark:text-slate-500 mt-1">Enter your credentials to access the workspace.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
              className="w-full h-11 flex items-center justify-center gap-2 text-[13.5px] font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          </form>
        </div>

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
      </div>
    </div>
  );
}
