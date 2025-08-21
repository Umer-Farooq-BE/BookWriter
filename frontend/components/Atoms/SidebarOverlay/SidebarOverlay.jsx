import React from 'react';
import { Icon } from '@iconify/react';
import styles from '../../Organisms/Sidebar/Sidebar.module.css';

const SidebarOverlay = ({ isMobile, isCollapsed, toggleSidebar }) => {
  return (
    <>
      {isMobile && !isCollapsed && (
        <div className={styles.overlay} onClick={toggleSidebar}></div>
      )}
      {isMobile && isCollapsed && (
        <button
          className={styles.mobileToggleBtn}
          onClick={toggleSidebar}
          aria-label="Open sidebar menu"
          title="Open sidebar menu"
        >
          <Icon icon="ph:list-bold" width="20" />
        </button>
      )}
    </>
  );
}

export default SidebarOverlay;
