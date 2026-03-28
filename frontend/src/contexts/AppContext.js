import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [staff, setStaff] = useState([]);
  const [residents, setResidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState('dark');

  // Initialize theme from system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('camp-theme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('camp-theme', theme);
  }, [theme]);

  // Load initial data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Try to seed data first
      await axios.post(`${API}/seed`).catch(() => {});
      
      const [staffRes, residentsRes] = await Promise.all([
        axios.get(`${API}/staff`),
        axios.get(`${API}/residents`)
      ]);
      
      setStaff(staffRes.data);
      setResidents(residentsRes.data);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check for saved session
  useEffect(() => {
    const savedUser = localStorage.getItem('camp-user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('camp-user');
      }
    }
  }, []);

  const login = async (pin) => {
    try {
      const response = await axios.post(`${API}/staff/login?pin=${pin}`);
      const user = response.data;
      setCurrentUser(user);
      localStorage.setItem('camp-user', JSON.stringify(user));
      return { success: true, user };
    } catch (error) {
      return { success: false, error: 'PIN non valido' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('camp-user');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const refreshResidents = async () => {
    try {
      const response = await axios.get(`${API}/residents`);
      setResidents(response.data);
    } catch (error) {
      console.error('Errore aggiornamento residenti:', error);
    }
  };

  const refreshStaff = async () => {
    try {
      const response = await axios.get(`${API}/staff`);
      setStaff(response.data);
    } catch (error) {
      console.error('Errore aggiornamento staff:', error);
    }
  };

  const value = {
    currentUser,
    staff,
    residents,
    isLoading,
    theme,
    login,
    logout,
    toggleTheme,
    refreshResidents,
    refreshStaff,
    loadData,
    API
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
