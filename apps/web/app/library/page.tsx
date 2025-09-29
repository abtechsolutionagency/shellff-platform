
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { MainLayout } from "@/components/layout/MainLayout";
import { LibraryContent } from "@/components/library/LibraryContent";

export default async function LibraryPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  // Only role-restricted creators should not have access to the library
  const userType = (session.user as any)?.userType;
  const userEmail = (session.user as any)?.email;
  const isRoleRestrictedCreator = userType === 'CREATOR' && userEmail === 'creatoronly@shellff.com';
  
  if (isRoleRestrictedCreator) {
    redirect("/creator/releases");
  }

  return (
    <MainLayout>
      <LibraryContent />
    </MainLayout>
  );
}
