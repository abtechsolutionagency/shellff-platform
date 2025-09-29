
'use client';

import { useSession } from 'next-auth/react';

export function useAdmin() {
  const { data: session, status } = useSession() || {};

  const isLoading = status === 'loading';
  const isAdmin = session?.user?.userType === 'ADMIN';
  const isAuthenticated = !!session?.user;

  return {
    isAdmin,
    isLoading,
    isAuthenticated,
    user: session?.user,
  };
}
