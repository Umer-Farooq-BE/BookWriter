'use client';
import { useEffect, useState } from 'react';

export function useMe() {
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function getMe() {
    const r = await fetch('/api/auth/me', { credentials: 'include' });
    if (r.status === 401) {
      const rr = await fetch('/api/auth/refresh', { method:'POST', credentials:'include' });
      if (!rr.ok) { setMe(null); setLoading(false); return; }
      // try again
      const r2 = await fetch('/api/auth/me', { credentials: 'include' });
      if (!r2.ok) { setMe(null); setLoading(false); return; }
      setMe(await r2.json()); setLoading(false); return;
    }
    if (!r.ok) { setMe(null); setLoading(false); return; }
    setMe(await r.json()); setLoading(false);
  }

  useEffect(() => { getMe(); }, []);
  return { me, loading, refresh: getMe };
}