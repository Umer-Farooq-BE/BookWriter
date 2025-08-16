'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import { STORAGE_KEYS } from '../../../constants/storage';

const ConditionalSidebar = () => {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check authentication status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userEmail = localStorage.getItem(STORAGE_KEYS.USER_EMAIL);
      const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
      setIsAuthenticated(!!(userEmail && userName));
      setIsLoading(false);
    }
  }, []);

  // Listen for authentication changes and sidebar state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = () => {
      const userEmail = localStorage.getItem(STORAGE_KEYS.USER_EMAIL);
      const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
      setIsAuthenticated(!!(userEmail && userName));
    };

    const handleSidebarToggle = (event) => {
      setSidebarCollapsed(event.detail?.collapsed || false);
    };

    // Listen for storage changes (login/logout)
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for immediate updates (same tab)
    window.addEventListener('authStatusChanged', handleStorageChange);
    
    // Listen for sidebar toggle events
    window.addEventListener('sidebarToggled', handleSidebarToggle);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStatusChanged', handleStorageChange);
      window.removeEventListener('sidebarToggled', handleSidebarToggle);
    };
  }, []);

  // Define pages where sidebar should not appear even if authenticated
  const noSidebarPages = ['/login', '/signup'];
  
  // Pages where sidebar should appear if authenticated
  const sidebarPages = ['/home', '/userDetail'];
  const isHomeDynamicPage = pathname.startsWith('/home/');
  const shouldShowSidebar = (sidebarPages.includes(pathname) || isHomeDynamicPage) && !noSidebarPages.includes(pathname);

  // Manage body class for sidebar spacing and state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const shouldShowSidebarClass = isAuthenticated && shouldShowSidebar && !isLoading;
    
    // Remove all sidebar-related classes first
    document.body.classList.remove('sidebar-active', 'sidebar-collapsed');
    
    if (shouldShowSidebarClass) {
      document.body.classList.add('sidebar-active');
      
      // Add collapsed state class if sidebar is collapsed
      if (sidebarCollapsed) {
        document.body.classList.add('sidebar-collapsed');
      }
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('sidebar-active', 'sidebar-collapsed');
    };
  }, [isAuthenticated, shouldShowSidebar, isLoading, sidebarCollapsed]);

  // Don't render anything during loading or if not authenticated or not on sidebar pages
  if (isLoading || !isAuthenticated || !shouldShowSidebar) {
    return null;
  }

  return <Sidebar />;
};

export default ConditionalSidebar;
