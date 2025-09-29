
"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Settings, User, Bell, Shield, Palette, ChevronRight } from "lucide-react";
import { RoleSwitchModal } from "@/components/profile/role-switch-modal";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session, status } = useSession() || {};

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#121212] pb-20 md:pb-8">
        <main className="md:ml-60 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-800 rounded w-48"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!session) {
    redirect("/auth/login");
  }

  const settingsCategories = [
    {
      title: "Account",
      description: "Manage your account settings and preferences",
      icon: User,
      href: "/settings/account",
      color: "text-blue-400"
    },
    {
      title: "Notifications",
      description: "Configure your notification preferences",
      icon: Bell,
      href: "/settings/notifications",
      color: "text-yellow-400"
    },
    {
      title: "Privacy & Security",
      description: "Manage your privacy and security settings",
      icon: Shield,
      href: "/settings/privacy",
      color: "text-green-400"
    },
    {
      title: "Appearance",
      description: "Customize the look and feel of your app",
      icon: Palette,
      href: "/settings/appearance",
      color: "text-purple-400"
    }
  ];

  return (
    <div className="min-h-screen bg-[#121212] pb-20 md:pb-8">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="md:hidden" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-purple-400" />
            <div>
              <h1 className="text-3xl font-bold text-white font-poppins">Settings</h1>
              <p className="text-gray-400">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="md:ml-60 p-6">
        <div className="max-w-4xl">
          {/* Settings Categories */}
          <div className="grid gap-4 md:grid-cols-2 mb-12">
            {settingsCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Link key={category.title} href={category.href}>
                  <Card className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/70 transition-all duration-200 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-gray-800">
                            <IconComponent className={`h-6 w-6 ${category.color}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-lg font-poppins">
                              {category.title}
                            </h3>
                            <p className="text-gray-400 text-sm font-inter">
                              {category.description}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Account Information Card */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white font-poppins">Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Email Address</p>
                  <p className="text-white font-medium">{session.user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Display Name</p>
                  <p className="text-white font-medium">{session.user?.name || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Account Type</p>
                  <p className="text-white font-medium">{(session.user as any)?.userType || 'Listener'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">User ID</p>
                  <p className="text-white font-medium font-mono text-sm">{(session.user as any)?.userId || 'Not assigned'}</p>
                </div>
                {(session.user as any)?.sciId && (
                  <>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Creator ID</p>
                      <p className="text-white font-medium font-mono text-sm">{(session.user as any)?.sciId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Username</p>
                      <p className="text-white font-medium">{(session.user as any)?.username || 'Not set'}</p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white" asChild>
                    <Link href="/settings/account">
                      Edit Account Details
                    </Link>
                  </Button>
                  <RoleSwitchModal 
                    currentRole={(session?.user as any)?.userType || 'LISTENER'}
                    username={(session?.user as any)?.username || session?.user?.email?.split('@')[0] || 'user'}
                    sciId={(session?.user as any)?.sciId}
                    isRoleRestricted={
                      session?.user?.email === 'creatoronly@shellff.com' ||
                      (session?.user as any)?.settings?.roleRestrictedToCreator === true
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

