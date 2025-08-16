'use client';

import React, { useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import { Icon } from "@iconify/react";
import styles from "./Sidebar.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from '../../../public/assets/logo.png';
import ConfirmationModal from '../../Atoms/ConfirmationModal/ConfirmationModal';
import LoadingSpinner from '../../Atoms/LoadingSpinner/LoadingSpinner';
import UserMenu from '../../Molecules/UserMenu/UserMenu';
import { STORAGE_KEYS, CUSTOM_EVENTS, SIDEBAR_DEFAULTS } from '../../../constants/storage'; 

export default function Sidebar() {
  // Memoized book list rendering
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [titles, setTitles] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isLoadingClear, setIsLoadingClear] = useState(false);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const router = useRouter();

  const bookList = React.useMemo(() => {
    if (isLoadingBooks) {
      return (
        <li className={styles.loadingContainer}>
          <LoadingSpinner size="medium" message="Loading your books..." />
        </li>
      );
    } else if (titles.length === 0) {
      return (
        <li className={styles.emptyState}>
          <Icon icon="ph:book-open" className={styles.emptyIcon} />
          <p className={styles.emptyText}>No books yet. Create your first book!</p>
        </li>
      );
    } else {
      return titles.map((b) => (
        <li key={b.id} style={{ marginBottom: '1rem' }}>
          <button
            className={styles.bookItem}
            onClick={() => {
              handleSelect(b.id);
              if (isMobile) setIsCollapsed(true);
            }}
            aria-label={`Open book: ${b.title}`}
            title={b.title}
          >
            <Icon icon="tabler:book" className={styles.bookIcon} />
            {b.title}
          </button>
        </li>
      ));
    }
  }, [isLoadingBooks, titles, isMobile]);
  // Async-like wrappers for localStorage
  const getItemAsync = useCallback((key) => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined') {
        resolve(localStorage.getItem(key));
      } else {
        resolve(null);
      }
    });
  }, []);

  const setItemAsync = useCallback((key, value) => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
      resolve();
    });
  }, []);
  // Load sidebar preferences on mount
  useEffect(() => {
    (async () => {
      // Load sidebar preferences
      const savedPreferences = await getItemAsync(STORAGE_KEYS.SIDEBAR_PREFERENCES);
      if (savedPreferences) {
        try {
          const preferences = JSON.parse(savedPreferences);
          // Only apply saved collapsed state on desktop
          if (window.innerWidth > 768) {
            setIsCollapsed(preferences.collapsed || false);
          }
        } catch (error) {
          console.warn('Failed to parse sidebar preferences:', error);
        }
      }
    })();
  }, []);

  // Save sidebar preferences when state changes
  const saveSidebarPreferences = useCallback((collapsed) => {
    const preferences = {
      collapsed,
      timestamp: Date.now()
    };
    setItemAsync(STORAGE_KEYS.SIDEBAR_PREFERENCES, JSON.stringify(preferences));
  }, []);

  const toggleSidebar = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    // Save preference for desktop only
    if (!isMobile) {
      saveSidebarPreferences(newCollapsed);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Track if this is the first load
    let firstLoad = true;

    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (firstLoad) {
        // On initial load, auto-collapse if mobile
        setIsCollapsed(mobile);
        firstLoad = false;
      } else {
        // On resize, only auto-collapse if switching to mobile
        if (mobile) {
          setIsCollapsed(true);
        }
        // If switching back to desktop, do not overwrite user's preference
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load and listen for book titles updates with loading state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadTitles = () => {
      setIsLoadingBooks(true);
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOK_TITLES) || "[]");
        setTitles(stored);
      } catch (error) {
        console.warn('Failed to load book titles:', error);
        setTitles([]);
      } finally {
        // Add small delay to show loading state
        setTimeout(() => setIsLoadingBooks(false), 300);
      }
    };

    loadTitles();
    
    const refresh = () => {
      try {
        const updated = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOK_TITLES) || "[]");
        setTitles(updated);
      } catch (error) {
        console.warn('Failed to refresh book titles:', error);
      }
    };
    
    window.addEventListener(CUSTOM_EVENTS.TITLES_UPDATED, refresh);
    return () => window.removeEventListener(CUSTOM_EVENTS.TITLES_UPDATED, refresh);
  }, []);

  const handleSelect = (id) => {
    router.push(`/home/${id}`);
  };

  const clearAll = async () => {
    if (typeof window === 'undefined') return;
    
    setIsLoadingClear(true);
    
    try {
      // Simulate async operation for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      localStorage.removeItem(STORAGE_KEYS.BOOK_TITLES);
      titles.forEach((t) => localStorage.removeItem(`${STORAGE_KEYS.CHAT_PREFIX}${t.id}`));
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
      {/* Mobile Overlay */}
      {isMobile && !isCollapsed && (
        <div className={styles.overlay} onClick={toggleSidebar}></div>
      )}

      {/* Mobile Toggle Button - always visible on mobile when collapsed */}
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

      <div className={clsx(
        styles.sidebar,
        {
          [styles.collapsed]: isCollapsed,
          [styles.open]: !isCollapsed,
          [styles.mobile]: isMobile
        }
      )}>
        <div className={styles.sidebarContent}>
          {/* Header with Logo and Toggle - ALWAYS show toggle button */}
          <div className={styles['sidebar-header']}>
            {!isCollapsed && (
              <Link href="/home">
                <Image src={logo} width={120} alt="logo" />
              </Link>
            )}
            <button 
              className={styles['toggle-btn']} 
              onClick={toggleSidebar}
              aria-label={isCollapsed ? "Expand sidebar" : (isMobile ? "Close sidebar" : "Collapse sidebar")}
              title={isCollapsed ? "Expand sidebar" : (isMobile ? "Close sidebar" : "Collapse sidebar")}
            >
              <Icon 
                icon={isCollapsed ? "ph:list-bold" : (isMobile ? "ph:x-bold" : "ph:list-bold")} 
                width="20" 
              />
            </button>
          </div>

          {/* Content - Only show when not collapsed */}
          {!isCollapsed && (
            <div className={styles.sidebarMainContent}>
              <Link href="/home" className={styles.newBook}>+ New Book</Link>

              <hr />
              <div className={styles['s-sec1']}>
                <>Your Books</>
                <button 
                  className={styles.clear} 
                  onClick={() => setShowClearModal(true)}
                  disabled={titles.length === 0}
                  aria-label="Clear all books"
                  title="Clear all books"
                >
                  Clear All
                </button>
              </div>
              <hr />

              <ul className={styles.bookList}>
                {bookList}
              </ul>

              {/* User Menu at Bottom */}
              <UserMenu className={styles['sidebar-user-menu']} />
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Clear All */}
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
