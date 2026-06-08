'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';

export function useAuth() {
  const { user, isLoading, setUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get('/users/me')
      .then((res) => {
        if (!cancelled) setUser(res.data.user ?? res.data);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [setUser, setLoading]);

  return { user, isLoading, logout };
}
