import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('fg_token');
    const storedUser = localStorage.getItem('fg_user');
    if (storedToken && storedUser && storedUser !== "undefined") {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Invalid fg_user in localStorage", err);
        localStorage.removeItem("fg_user");
        localStorage.removeItem("fg_token");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, email: userEmail, role: userRole, userId, name: userName } = res.data;
    const userData = { email: userEmail, role: userRole, userId, name: userName };
    localStorage.setItem('fg_token', newToken);
    localStorage.setItem('fg_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    navigate('/dashboard');
    return res.data;
  }, [navigate]);

  const register = useCallback(async (email, password, name, role) => {
    const res = await api.post('/auth/register', { email, password, name, role });
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('fg_token');
    localStorage.removeItem('fg_user');
    setToken(null);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
