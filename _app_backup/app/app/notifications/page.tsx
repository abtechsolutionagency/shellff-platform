
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { NotificationsContent } from "@/components/notifications/NotificationsContent";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  return <NotificationsContent />;
}
