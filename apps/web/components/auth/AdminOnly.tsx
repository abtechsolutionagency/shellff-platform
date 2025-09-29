
'use client';

import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
  showError?: boolean;
}

export default function AdminOnly({ 
  children, 
  fallback = null, 
  showError = false 
}: AdminOnlyProps) {
  const { data: session, status } = useSession() || {};

  if (status === 'loading') {
    return null; // Or loading spinner
  }

  const isAdmin = session?.user?.userType === 'ADMIN';

  if (!isAdmin) {
    if (showError) {
      return (
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-red-400 text-sm">Admin access required</span>
          </div>
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
