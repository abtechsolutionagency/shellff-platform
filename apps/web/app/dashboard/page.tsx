
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { MainLayout } from "@/components/layout/MainLayout";
import { NewDashboardContent } from "@/components/dashboard/NewDashboardContent";
import { CreatorDashboardContent } from "@/components/dashboard/CreatorDashboardContent";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  // Check user type - normalize to uppercase for consistency
  const userType = (session.user as any)?.userType?.toUpperCase();
  
  // Redirect admin users directly to admin dashboard
  if (userType === 'ADMIN') {
    redirect("/admin");
  }

  const isCreator = userType === 'CREATOR';

  return (
    <MainLayout>
      {isCreator ? <CreatorDashboardContent /> : <NewDashboardContent />}
    </MainLayout>
  );
}
