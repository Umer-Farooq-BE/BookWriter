import React from "react";
import { Icon } from "@iconify/react";
import LoadingSpinner from "../../Atoms/LoadingSpinner/LoadingSpinner";
import styles from "../../Organisms/Sidebar/Sidebar.module.css";
import { useParams } from "next/navigation";

export default function BookList({
  isLoadingBooks,
  titles,
  isMobile,
  handleSelect,
}) {
   const params = useParams();
    const { id } = params;
  if (isLoadingBooks) {
    return (
      <li className={styles.loadingContainer}>
        <LoadingSpinner size="medium" message="Loading your books..." />
      </li>
    );
  }
  if (!Array.isArray(titles) || titles.length === 0) {
    return (
      <li className={styles.emptyState}>
        <Icon icon="ph:book-open" className={styles.emptyIcon} />
        <p className={styles.emptyText}>
          No books yet. Create your first book!
        </p>
      </li>
    );
  }
  return titles.map((b) => {
    if (!b?.id || !b?.title) return null;
    const isActive = b.id === id;
    return (
      <li key={b.id} style={{ marginBottom: "1rem" }}>
        <button
          className={isActive ? `${styles.bookItem} ${styles.activeBook}` : styles.bookItem}
          onClick={() => handleSelect(b.id)}
          aria-label={`Open book: ${b.title}`}
          title={b.title}
        >
          <Icon icon="tabler:book" className={styles.bookIcon} />
          {b.title}
        </button>
      </li>
    );
  });
}
