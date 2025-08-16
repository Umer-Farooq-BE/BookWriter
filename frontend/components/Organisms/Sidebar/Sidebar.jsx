'use client';

import React, { useState, useCallback } from "react";
import clsx from "clsx";
import ConfirmationModal from '../../Atoms/ConfirmationModal/ConfirmationModal';
import { useRouter } from "next/navigation";
import { useSidebarState } from './hooks/useSidebarState';
import { useBookTitles } from './hooks/useBookTitles';
import SidebarHeader from '../../Molecules/SidebarHeader/SidebarHeader';
import SidebarOverlay from '../../Atoms/SidebarOverlay/SidebarOverlay';
import SidebarContent from '../../Molecules/SidebarContent/SidebarContent';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const { isCollapsed, setIsCollapsed, isMobile, toggleSidebar } = useSidebarState();
  const { titles, setTitles, isLoadingBooks } = useBookTitles();
  const [showClearModal, setShowClearModal] = useState(false);
  const [isLoadingClear, setIsLoadingClear] = useState(false);
  const router = useRouter();

  // Book select handler
  const handleSelect = useCallback((id) => {
    if (id === 'collapse') {
      setIsCollapsed(true);
      return;
    }
    router.push(`/home/${id}`);
    if (isMobile) setIsCollapsed(true);
  }, [router, setIsCollapsed, isMobile]);

  // Clear all books
  const clearAll = async () => {
    if (typeof window === 'undefined') return;
    setIsLoadingClear(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      localStorage.removeItem('book_titles');
      titles.forEach((t) => localStorage.removeItem(`chat_${t.id}`));
      setTitles([]);
      setShowClearModal(false);
    } catch (error) {
      console.error('Failed to clear books:', error);
    } finally {
      setIsLoadingClear(false);
    }
  };

  return (
    <>
      <SidebarOverlay isMobile={isMobile} isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      <div className={clsx(
        styles.sidebar,
        {
          [styles.collapsed]: isCollapsed,
          [styles.open]: !isCollapsed,
          [styles.mobile]: isMobile
        }
      )}>
        <div className={styles.sidebarContent}>
          <SidebarHeader isCollapsed={isCollapsed} isMobile={isMobile} toggleSidebar={toggleSidebar} />
          <SidebarContent
            isCollapsed={isCollapsed}
            titles={titles}
            isLoadingBooks={isLoadingBooks}
            isMobile={isMobile}
            handleSelect={handleSelect}
            setShowClearModal={setShowClearModal}
          />
        </div>
      </div>
      <ConfirmationModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={clearAll}
        title="Clear All Books"
        message={`Are you sure you want to delete all ${titles.length} book(s)? This action cannot be undone and will also remove all associated chat history.`}
        confirmText="Delete All"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isLoadingClear}
      />
    </>
  );
}
