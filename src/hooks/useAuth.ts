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
      // Get user profile to fetch roles/authorities
      try {
        const profileData = await authService.getProfile();
        if (profileData.success) {
          const localUser: User = {
            id: profileData.data.id,
            username: profileData.data.username || profileData.data.name || profileData.data.email,
            avatar: profileData.data.avatar || null,
            roles: profileData.data.authorities || []
          };
          setUser(localUser);
          localStorage.setItem('user', JSON.stringify(localUser));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Fallback to basic user data
        const localUser: User = {
          id: data.data.user.id,
          username: data.data.user.name || data.data.user.email,
          avatar: null,
          roles: [] // Empty roles as fallback
        };
        setUser(localUser);
        localStorage.setItem('user', JSON.stringify(localUser));
      }
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

  return { user, login, logout, userId: user?.id?.toString() };
};
