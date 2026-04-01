import React, { createContext, useState, useEffect } from 'react';
import { apiFetch } from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (userData, isRegister = false) => {
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const apiUser = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      setUser(apiUser);
      localStorage.setItem('auth_user', JSON.stringify(apiUser));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
