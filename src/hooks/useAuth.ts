import { useState, useEffect } from 'react';

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
    // Also listen for direct storage changes (e.g., from other tabs)
    window.addEventListener('storage', handleAuthStateChange);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChange);
      window.removeEventListener('storage', handleAuthStateChange);
    };
  }, []);

  return { user, userId: user?.id?.toString() };
};
