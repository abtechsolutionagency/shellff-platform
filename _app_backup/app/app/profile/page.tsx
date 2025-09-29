
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProfileContent } from "@/components/profile/ProfileContent";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <MainLayout>
      <ProfileContent />
    </MainLayout>
  );
}
