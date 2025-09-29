import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RedemptionAnalytics from '@/components/creator/RedemptionAnalytics';
import CodeStatusTable from '@/components/creator/CodeStatusTable';

const prisma = new PrismaClient();

export const metadata: Metadata = {
  title: 'Code Analytics - Shellff Creator Dashboard',
  description: 'Track and monitor your unlock code performance and redemptions',
};

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.userType !== 'CREATOR') {
    redirect('/listener/home');
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Monitor your unlock code performance, redemptions, and revenue insights
        </p>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="codes">Code Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-0">
          <RedemptionAnalytics />
        </TabsContent>

        <TabsContent value="codes" className="space-y-0">
          <CodeStatusTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}