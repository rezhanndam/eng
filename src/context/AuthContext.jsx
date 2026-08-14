import { useState, useEffect } from 'react';
import { USERS, ROLE_PERMISSIONS } from '../auth';
import { AuthContext } from './contexts';

const STORAGE_KEY = 'eng_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = (email, password) => {
    const match = USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!match || match.password !== password) return false;
    const { password: _ignored, ...safeUser } = match;
    setUser(safeUser);
    return true;
  };

  const logout = () => setUser(null);

  const can = (permission) => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.role]?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}
