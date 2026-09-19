import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, check localStorage for an existing token and verify it
  // against the backend so a stale/expired token doesn't show a false
  // "logged in" state.
  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('bv_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.data);
      } catch (err) {
        localStorage.removeItem('bv_token');
        localStorage.removeItem('bv_user');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('bv_token', token);
    localStorage.setItem('bv_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('bv_token');
    localStorage.removeItem('bv_user');
    setUser(null);
  };

  const updateUser = (userData) => {
    localStorage.setItem('bv_user', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
