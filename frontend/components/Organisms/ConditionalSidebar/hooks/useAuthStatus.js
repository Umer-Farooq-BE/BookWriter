import { useEffect, useState } from "react";
import { STORAGE_KEYS } from "../../../../constants/storage";


export const useAuthStatus = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const userEmail = localStorage.getItem(STORAGE_KEYS.USER_EMAIL);
      const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
      setIsAuthenticated(!!(userEmail && userName));
      setIsLoading(false);
    };

    checkAuth();

    const handleStorageChange = () => checkAuth();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStatusChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStatusChanged', handleStorageChange);
    };
  }, []);

  return { isAuthenticated, isLoading };
};