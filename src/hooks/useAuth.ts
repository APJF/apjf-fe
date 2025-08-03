import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import type { LoginCredentials } from '../types/auth';

interface User {
  id: string | number; // Support both string and number
  email?: string;
  username: string;
  avatar: string | null;
  roles: string[];
  authorities?: string[]; // Support both roles and authorities
}

const getUserFromLocalStorage = (): User | null => {
  try {
    // Ưu tiên key mới, fallback sang key cũ
    let userString = localStorage.getItem('userInfo');
    if (!userString) {
      userString = localStorage.getItem('user');
    }
    
    if (userString) {
      const userData = JSON.parse(userString);
      return userData;
    }
    return null;
  } catch (error) {
    console.error("Failed to parse user from localStorage", error);
    return null;
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(getUserFromLocalStorage());

  useEffect(() => {
    const handleAuthStateChange = () => {
      const updatedUser = getUserFromLocalStorage();
      setUser(updatedUser);
    };

    // Listen for auth state changes from authService
    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);
    // Listen for storage changes from other tabs
    window.addEventListener('storage', handleAuthStateChange as EventListener);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
      window.removeEventListener('storage', handleAuthStateChange as EventListener);
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const data = await authService.login(credentials);
    if (data.success && data.data) {
      // authService.login already stores userInfo in localStorage
      // Just refresh our local state from localStorage
      const updatedUser = getUserFromLocalStorage();
      setUser(updatedUser);
    }
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    // authService.logout() đã xóa localStorage rồi
    window.dispatchEvent(new Event('authStateChanged'));
  };


  return { user, login, logout };
};
