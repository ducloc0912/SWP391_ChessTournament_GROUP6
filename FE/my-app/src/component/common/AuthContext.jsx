import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    user: null,
    role: null, // Lưu role riêng
    isAuthenticated: false,
    loading: true
  });

  useEffect(() => {
    const stored = localStorage.getItem('auth_data');
    if (stored) {
      setAuth(JSON.parse(stored));
    } else {
      setAuth(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const login = (data) => {
    // data nhận từ API: { success: true, user: {...}, role: "Admin", ... }
    const newAuth = {
      user: data.user,
      role: data.role, 
      isAuthenticated: true,
      loading: false
    };
    setAuth(newAuth);
    localStorage.setItem('auth_data', JSON.stringify(newAuth));
  };

  const logout = () => {
    setAuth({ user: null, role: null, isAuthenticated: false, loading: false });
    localStorage.removeItem('auth_data');
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {!auth.loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);