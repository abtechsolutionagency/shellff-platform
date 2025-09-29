
"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navigation/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Palette, Construction } from "lucide-react";
import Link from "next/link";

export default function AppearanceSettingsPage() {
  const { data: session, status } = useSession() || {};

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
        <Navbar />
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-800 rounded w-48"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <Navbar />
      
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="text-purple-400 hover:text-purple-300 hover:bg-gray-800/50"
          >
            <Link href="/settings">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <Palette className="h-8 w-8 text-purple-400" />
            <div>
              <h1 className="text-3xl font-bold font-poppins bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Appearance
              </h1>
              <p className="text-gray-300 font-inter">Customize the look and feel of your app</p>
            </div>
          </div>
        </div>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-poppins text-white">
              <Construction className="h-5 w-5 text-purple-400" />
              Enhanced Customization Coming Soon
            </CardTitle>
            <CardDescription className="text-gray-400">
              Advanced appearance settings will be added in future updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 font-inter">
              Advanced theme customization, custom color schemes, layout preferences, 
              and accessibility options will be added in upcoming releases.
            </p>
            <p className="text-gray-300 font-inter mt-4">
              For now, you can change the basic theme (Light/Dark/System) in the Account Settings page.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
