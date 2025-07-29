import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
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
      // User info is already stored in localStorage by authService.login
      // Just update the state with the userInfo from response
      const localUser: User = {
        id: data.data.userInfo.id.toString(),
        username: data.data.userInfo.username,
        avatar: data.data.userInfo.avatar || null,
        roles: data.data.userInfo.roles || []
      };
      setUser(localUser);
      window.dispatchEvent(new Event('authStateChanged'));
    }
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('authStateChanged'));
  };


  return { user, login, logout };
};
