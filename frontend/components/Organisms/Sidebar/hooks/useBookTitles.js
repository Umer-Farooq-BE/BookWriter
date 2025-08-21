import { useState, useEffect } from 'react';
import { CUSTOM_EVENTS, STORAGE_KEYS } from '../../../../constants/storage';

export function useBookTitles() {
  const [titles, setTitles] = useState([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loadTitles = () => {
      setIsLoadingBooks(true);
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS?.BOOK_TITLES) || '[]');
        setTitles(stored);
      } catch (error) {
        console.warn('Failed to load book titles:', error);
        setTitles([]);
      } finally {
        setTimeout(() => setIsLoadingBooks(false), 300);
      }
    };
    loadTitles();
    const refresh = () => {
      try {
        const updated = JSON.parse(localStorage.getItem(STORAGE_KEYS?.BOOK_TITLES) || '[]');
        setTitles(updated);
      } catch (error) {
        console.warn('Failed to refresh book titles:', error);
      }
    };
    window.addEventListener(CUSTOM_EVENTS?.TITLES_UPDATED, refresh);
    return () => window.removeEventListener(CUSTOM_EVENTS?.TITLES_UPDATED, refresh);
  }, []);

  return { titles, setTitles, isLoadingBooks };
}
