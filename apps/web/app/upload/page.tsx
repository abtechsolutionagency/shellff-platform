import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function UploadPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  // Get user data to check account type
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { primaryRole: true }
  });

  // Redirect based on user type
  if (user?.primaryRole === 'CREATOR') {
    redirect("/creator/upload");
  } else {
    // For listeners, redirect to profile where they can switch roles
    redirect("/profile");
  }
}