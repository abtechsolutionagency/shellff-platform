
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Navbar } from "@/components/navigation/navbar";
import { MusicCatalog } from "@/components/music/music-catalog";
import { prisma } from "@/lib/db";

export default async function CatalogPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  // Get user data to check account type
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { userType: true }
  });

  // Creators can also access catalog to discover other creators' music
  // No need to redirect creators anymore

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold font-poppins bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Music Catalog
          </h1>
          <p className="text-xl text-gray-300 font-inter max-w-2xl mx-auto">
            Discover and explore amazing music from talented creators around the world
          </p>
        </div>
        
        <MusicCatalog />
      </div>
    </div>
  );
}
