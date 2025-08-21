import React from 'react';
import Link from 'next/link';
import UserMenu from '../../Molecules/UserMenu/UserMenu';
import BookList from '../BookList/BookList';
import styles from '../../Organisms/Sidebar/Sidebar.module.css';

export default function SidebarContent({ isCollapsed, titles, isLoadingBooks, isMobile, handleSelect, setShowClearModal }) {
  if (isCollapsed) return null;
  return (
    <div className={styles.sidebarMainContent}>
      <Link href="/home" className={styles.newBook}>+ New Book</Link>
      <hr />
      <div className={styles['s-sec1']}>
        Your Books
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
        <BookList
          isLoadingBooks={isLoadingBooks}
          titles={titles}
          isMobile={isMobile}
          handleSelect={handleSelect}
        />
      </ul>
      <UserMenu className={styles['sidebar-user-menu']} />
    </div>
  );
}
