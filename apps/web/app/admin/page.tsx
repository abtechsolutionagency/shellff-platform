
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { AdminDashboardContent } from '@/components/admin/AdminDashboardContent';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const { data: session, status } = useSession() || {};
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (status === 'loading') return;
      
      if (status === 'unauthenticated' || !session?.user) {
        redirect('/auth/login');
        return;
      }

      // Check if user has admin role
      if (session.user.userType !== 'ADMIN') {
        setIsCheckingAdmin(false);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(true);
      setIsCheckingAdmin(false);
    };

    checkAdminStatus();
  }, [session, status]);

  // Loading state
  if (status === 'loading' || isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    redirect('/auth/login');
  }

  // Access denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-4">
          <div className="bg-zinc-900 rounded-lg p-6 md:p-8 border border-zinc-800">
            <AlertTriangle className="w-12 h-12 md:w-16 md:h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl md:text-2xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-zinc-400 mb-6">
              You need administrator privileges to access this page.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-zinc-500">Current user: {session?.user?.email}</p>
              <p className="text-sm text-zinc-500">Role: {session?.user?.userType || 'User'}</p>
            </div>
            <Button 
              onClick={() => window.history.back()} 
              className="mt-6 bg-blue-600 hover:bg-blue-700"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <AdminDashboardContent />
    </MainLayout>
  );
}


