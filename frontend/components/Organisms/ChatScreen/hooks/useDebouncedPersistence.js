import { useRef, useEffect } from 'react';
import { saveChatState } from '../../../../utils/api';

export function useDebouncedPersistence(enabled, bookId, payload, delay = 1000) {
  const timerRef = useRef(null);
  useEffect(() => {
    if (!enabled || !bookId) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    const id = window.setTimeout(() => {
      saveChatState(bookId, payload).catch((e) =>
        console.error("Failed to save chat", e)
      );
    }, delay);
    timerRef.current = id;
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [enabled, bookId, payload, delay]);
}