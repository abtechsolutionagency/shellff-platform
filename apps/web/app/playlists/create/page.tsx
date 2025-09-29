
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { CreatePlaylistContent } from "@/components/playlist/CreatePlaylistContent";

export default async function CreatePlaylistPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  // Redirect creators to dashboard as they can't create playlists
  const userType = (session.user as any)?.userType;
  if (userType === 'Creator' || userType === 'creator') {
    redirect("/dashboard");
  }

  return <CreatePlaylistContent />;
}
