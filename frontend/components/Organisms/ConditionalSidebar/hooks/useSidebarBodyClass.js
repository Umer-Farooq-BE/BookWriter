import { useEffect } from "react";


export const useSidebarBodyClass = (active, collapsed) => {
  useEffect(() => {
    if (!active) {
      document.body.classList.remove('sidebar-active', 'sidebar-collapsed');
      return;
    }

    document.body.classList.add('sidebar-active');
    if (collapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }

    return () => {
      document.body.classList.remove('sidebar-active', 'sidebar-collapsed');
    };
  }, [active, collapsed]);
};