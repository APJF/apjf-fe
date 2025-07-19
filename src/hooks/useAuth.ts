import { useState, useEffect } from 'react';
import * as authService from '../services/authService';
import type { LoginCredentials } from '../types/auth';

interface User {
  id: string;
  username: string;
  avatar: string | null;
  roles: string[];
}

const getUserFromLocalStorage = (): User | null => {
  try {
    const userString = localStorage.getItem('user');
    if (userString) {
      return JSON.parse(userString);
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
      setUser(getUserFromLocalStorage());
    };

    window.addEventListener('authStateChanged', handleAuthStateChange);
    window.addEventListener('storage', handleAuthStateChange);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChange);
      window.removeEventListener('storage', handleAuthStateChange);
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const data = await authService.login(credentials);
    if (data.success && data.data) {
      // Map the auth service user to local User interface
      const localUser: User = {
        id: data.data.user.id,
        username: data.data.user.name || data.data.user.email,
        avatar: null,
        roles: []
      };
      setUser(localUser);
      window.dispatchEvent(new Event('authStateChanged'));
    }
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    window.dispatchEvent(new Event('authStateChanged'));
  };

  return { user, login, logout, userId: user?.id?.toString() };
};
