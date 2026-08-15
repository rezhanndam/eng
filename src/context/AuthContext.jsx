import { useState, useEffect, useCallback } from 'react';
import { supabase, isCloudStorage } from '../lib/supabase';
import { USERS, ROLE_PERMISSIONS } from '../auth';
import { AuthContext } from './contexts';

const STORAGE_KEY = 'eng_user';
const DATA_KEYS = ['eng_projects', 'eng_tasks', 'eng_documents', 'eng_categories', 'eng_activity', 'eng_team', 'eng_daily_reports', 'activeProjectId'];

function clearWorkspaceCache() {
  DATA_KEYS.forEach(key => localStorage.removeItem(key));
}

function toSafeUser(legacyUser) {
  const { password: _ignored, ...safeUser } = legacyUser;
  return safeUser;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!isCloudStorage);

  // Persist the current user as a cache (used by the legacy mode).
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const fetchProfile = useCallback(async (sessionUser) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).maybeSingle();
    if (error) throw error;
    const fallbackName = sessionUser.email?.split('@')[0] || 'User';
    return {
      id: sessionUser.id,
      email: sessionUser.email,
      name: data?.name || sessionUser.user_metadata?.name || fallbackName,
      title: data?.title || 'Project Admin',
      role: data?.role || 'admin',
      avatar: data?.avatar || upperName(data?.name || fallbackName),
    };
  }, []);

  useEffect(() => {
    if (!isCloudStorage) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const restored = saved ? JSON.parse(saved) : null;
        if (restored && USERS.some((u) => u.email.toLowerCase() === (restored.email || '').toLowerCase())) {
          setUser(restored);
        }
      } catch {
        setUser(null);
      }
      setReady(true);
      return;
    }

    let mounted = true;

    async function applySession(session) {
      const sessionUser = session?.user || null;
      if (!sessionUser) {
        if (mounted) {
          setUser(null);
          setReady(true);
        }
        return;
      }
      try {
        const profile = await fetchProfile(sessionUser);
        if (mounted) setUser(profile);
      } catch (e) {
        console.error('Profile fetch failed:', e);
        if (mounted) setUser(null);
      }
      if (mounted) setReady(true);
    }

    supabase.auth.getSession().then(({ data }) => applySession(data.session));

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const login = async (email, password) => {
    if (!isCloudStorage) {
      const match = USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!match || match.password !== password) return { ok: false, error: 'Invalid email or password.' };
      setUser(toSafeUser(match));
      return { ok: true };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message || 'Invalid email or password.' };
    return { ok: true };
  };

  const signUp = async (email, password, name) => {
    if (!isCloudStorage) {
      return { ok: false, error: 'Sign up requires Supabase cloud to be configured.' };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { ok: false, error: error.message };
    if (data?.session) return { ok: true };
    return { ok: true, confirm: true };
  };

  const logout = async () => {
    clearWorkspaceCache();
    if (!isCloudStorage) {
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
  };

  const can = (permission) => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.role]?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, can, signUp, ready }}>
      {children}
    </AuthContext.Provider>
  );
}

function upperName(name) {
  const parts = String(name || 'U').trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'U';
}
