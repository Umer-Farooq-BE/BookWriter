import { useEffect, useState } from "react";
import { STORAGE_KEYS } from "../../../../constants/storage";


export const useSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const prefs = localStorage.getItem(STORAGE_KEYS.SIDEBAR_PREFERENCES);
    setCollapsed(prefs ? JSON.parse(prefs).collapsed : false);

    const handleSidebarToggle = (event) => {
      setTimeout(() => {
        setCollapsed(event.detail?.collapsed || false);
      }, 0);
    };

    window.addEventListener('sidebarToggled', handleSidebarToggle);

    return () => {
      window.removeEventListener('sidebarToggled', handleSidebarToggle);
    };
  }, []);

  return collapsed;
};