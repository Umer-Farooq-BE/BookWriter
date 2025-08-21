import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import styles from '../../Organisms/Sidebar/Sidebar.module.css';
import logo from '@public/assets/logo.png';

export default function SidebarHeader({ isCollapsed, isMobile, toggleSidebar }) {
  return (
    <div className={styles['sidebar-header']}>
      {!isCollapsed && (
        <Link href="/home">
          <Image src={logo} width={120} alt="logo"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </Link>
      )}
      <button
        className={styles['toggle-btn']}
        onClick={toggleSidebar}
        aria-label={isCollapsed ? 'Expand sidebar' : (isMobile ? 'Close sidebar' : 'Collapse sidebar')}
        title={isCollapsed ? 'Expand sidebar' : (isMobile ? 'Close sidebar' : 'Collapse sidebar')}
      >
        <Icon
          icon={isCollapsed ? 'ph:list-bold' : (isMobile ? 'ph:x-bold' : 'ph:list-bold')}
          width="20"
        />
      </button>
    </div>
  );
}
