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
    
    console.log('🔍 [useAuth] Getting user from localStorage:', userString ? 'found' : 'not found');
    
    if (userString) {
      const userData = JSON.parse(userString);
      console.log('✅ [useAuth] Parsed user data:', userData.username || userData.email);
      return userData;
    }
    
    console.log('❌ [useAuth] No user data in localStorage');
    return null;
  } catch (error) {
    console.error("❌ [useAuth] Failed to parse user from localStorage", error);
    return null;
  }
};

export const useAuth = () => {
  console.log('🔧 [useAuth] Hook initialized');
  const [user, setUser] = useState<User | null>(getUserFromLocalStorage());

  useEffect(() => {
    console.log('🔄 [useAuth] Setting up auth state listeners');
    
    const handleAuthStateChange = (event?: CustomEvent) => {
      console.log('🔔 [useAuth] Auth state change event received:', event?.detail || 'storage event');
      const updatedUser = getUserFromLocalStorage();
      console.log('🔄 [useAuth] Updating user state:', updatedUser ? updatedUser.username || updatedUser.email : 'null');
      setUser(updatedUser);
    };

    // Listen for auth state changes from authService
    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);
    // Listen for storage changes from other tabs
    window.addEventListener('storage', handleAuthStateChange as EventListener);

    return () => {
      console.log('🧹 [useAuth] Cleaning up listeners');
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
      window.removeEventListener('storage', handleAuthStateChange as EventListener);
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    console.log('🚀 [useAuth] Login initiated for:', credentials.email);
    const data = await authService.login(credentials);
    if (data.success && data.data) {
      console.log('✅ [useAuth] Login successful, updating user state');
      // authService.login already stores userInfo in localStorage
      // Just refresh our local state from localStorage
      const updatedUser = getUserFromLocalStorage();
      setUser(updatedUser);
    } else {
      console.log('❌ [useAuth] Login failed:', data.message);
    }
    return data;
  };

  const logout = () => {
    console.log('👋 [useAuth] Logout initiated');
    authService.logout();
    setUser(null);
    // authService.logout() đã xóa localStorage rồi
    window.dispatchEvent(new Event('authStateChanged'));
  };

  console.log('📊 [useAuth] Current user state:', user ? user.username || user.email : 'not authenticated');

  return { user, login, logout };
};
