
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { CreatorUploadContent } from '@/components/creator/CreatorUploadContent';

export default function CreatorUploadPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session?.user && (session as any).user.userType !== 'CREATOR') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // Show loading state while session is being fetched
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300 font-inter">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated or not a creator
  if (status === 'unauthenticated' || (session?.user && (session as any).user.userType !== 'CREATOR')) {
    return null;
  }

  return (
    <MainLayout>
      <CreatorUploadContent />
    </MainLayout>
  );
}
