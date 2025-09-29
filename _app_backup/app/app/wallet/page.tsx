
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { MainLayout } from "@/components/layout/MainLayout";
import { ListenerWalletContent } from "@/components/wallet/ListenerWalletContent";
import { CreatorWalletContent } from "@/components/wallet/CreatorWalletContent";

export default async function WalletPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  // Check if user is a creator - normalize to uppercase for consistency
  const userType = (session.user as any)?.userType?.toUpperCase();
  const isCreator = userType === 'CREATOR';

  return (
    <MainLayout>
      {isCreator ? <CreatorWalletContent /> : <ListenerWalletContent />}
    </MainLayout>
  );
}
