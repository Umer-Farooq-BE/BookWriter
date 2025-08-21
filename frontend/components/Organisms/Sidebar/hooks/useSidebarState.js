import { useState, useEffect, useCallback, useRef } from 'react';
import { STORAGE_KEYS } from '../../../../constants/storage';

export function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const firstLoad = useRef(true);

  // Load sidebar preferences on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPreferences = localStorage.getItem(STORAGE_KEYS?.SIDEBAR_PREFERENCES);
      if (savedPreferences) {
        try {
          const preferences = JSON.parse(savedPreferences);
          if (window.innerWidth > 768) {
            setIsCollapsed(preferences?.collapsed || false);
          }
        } catch (error) {
          console.warn('Failed to parse sidebar preferences:', error);
        }
      }
    }
  }, []);

  // Save sidebar preferences
  const saveSidebarPreferences = useCallback((collapsed) => {
    if (typeof window !== 'undefined') {
      const preferences = {
        collapsed,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEYS?.SIDEBAR_PREFERENCES, JSON.stringify(preferences));
    }
  }, []);

  // Handle sidebar toggle
  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => {
      const newCollapsed = !prev;
      if (!isMobile) {
        saveSidebarPreferences(newCollapsed);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sidebarToggled', { detail: { collapsed: newCollapsed } }));
      }
      return newCollapsed;
    });
  }, [isMobile, saveSidebarPreferences]);

  // Handle mobile/desktop detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (firstLoad.current) {
        // On first load, open sidebar on desktop, collapse on mobile
        setIsCollapsed(mobile);
        if (!mobile) setIsCollapsed(false);
        firstLoad.current = false;
      } else {
        if (mobile) {
          setIsCollapsed(true);
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isCollapsed, setIsCollapsed, isMobile, toggleSidebar };
}
