import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, signupUser } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('smart_farm_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = async (username, password) => {
    const data = await loginUser(username, password);
    const userData = { username, token: data.token };
    setUser(userData);
    localStorage.setItem('smart_farm_user', JSON.stringify(userData));
    return data;
  };

  const signup = async (username, password, email) => {
    const data = await signupUser(username, password, email);
    const userData = { username, token: data.token };
    setUser(userData);
    localStorage.setItem('smart_farm_user', JSON.stringify(userData));
    return data;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('smart_farm_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
