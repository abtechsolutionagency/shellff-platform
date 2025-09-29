"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Home,
  Library,
  Wallet,
  User,
  Music,
  Settings,
  LogOut,
  QrCode,
  Upload,
  Gift,
  BarChart3,
  Users,
  Shield,
  Package,
  DollarSign,
  Percent,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function DesktopSidebar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || status !== "authenticated" || !session?.user) {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/login" });
  };

  const getUserInitials = () => {
    if (session.user?.name) {
      return session.user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase();
    }

    return (session.user as any)?.firstName?.[0]?.toUpperCase() || "U";
  };

  const userType = (session.user as any)?.userType?.toUpperCase() || "LISTENER";
  const canAccessListenerFeatures = userType === "LISTENER";
  const isCreator = userType === "CREATOR";
  const isAdmin = userType === "ADMIN";

  const navItems = [
    ...(isAdmin
      ? [
          {
            icon: Shield,
            label: "Admin Dashboard",
            path: "/admin",
            active: isActive("/admin") || pathname?.startsWith("/admin")
          },
          {
            icon: Package,
            label: "Code System",
            path: "/admin?tab=code-system",
            active: false
          },
          {
            icon: DollarSign,
            label: "Revenue Reports",
            path: "/admin?tab=revenue",
            active: false
          },
          {
            icon: AlertTriangle,
            label: "Security",
            path: "/admin?tab=security",
            active: false
          },
          {
            icon: Percent,
            label: "Discounts",
            path: "/admin?tab=discounts",
            active: false
          }
        ]
      : [
          {
            icon: Home,
            label: "Home",
            path: "/dashboard",
            active: isActive("/dashboard")
          }
        ]),
    ...(canAccessListenerFeatures
      ? [
          {
            icon: Library,
            label: "My Shellff",
            path: "/library",
            active: isActive("/library")
          },
          {
            icon: Gift,
            label: "Unlock Album",
            path: "/unlock-album",
            active: isActive("/unlock-album")
          },
          {
            icon: Users,
            label: "Group Packs",
            path: "/group-packs",
            active: isActive("/group-packs")
          }
        ]
      : []),
    ...(isCreator
      ? [
          {
            icon: Upload,
            label: "Upload Music",
            path: "/creator/upload",
            active: isActive("/creator/upload")
          },
          {
            icon: Music,
            label: "My Releases",
            path: "/creator/releases",
            active: isActive("/creator/releases") || pathname?.startsWith("/creator/releases")
          },
          {
            icon: QrCode,
            label: "Unlock Codes",
            path: "/creator/unlock-codes",
            active: isActive("/creator/unlock-codes") || pathname?.startsWith("/creator/unlock-codes")
          },
          {
            icon: BarChart3,
            label: "Analytics",
            path: "/creator/analytics",
            active: isActive("/creator/analytics") || pathname?.startsWith("/creator/analytics")
          }
        ]
      : []),
    ...(!isAdmin
      ? [
          {
            icon: Wallet,
            label: "Wallet",
            path: "/wallet",
            active: isActive("/wallet")
          }
        ]
      : []),
    {
      icon: User,
      label: "Profile",
      path: "/profile",
      active: isActive("/profile")
    }
  ];

  return (
    <div className="hidden md:block fixed left-0 top-0 h-screen w-60 bg-black border-r border-gray-800 z-40">
      <div className="flex flex-col h-full">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Music className="h-6 w-6 text-purple-500" />
            <span className="font-bold text-xl text-white font-poppins">Shellff</span>
          </Link>
        </div>

        <nav className="flex-1 px-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                      item.active
                        ? "bg-purple-600/20 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={session.user.image || undefined} alt={session.user.name || "User"} />
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session.user.name || session.user.email}
              </p>
              <p className="text-xs text-gray-400">
                {userType === "CREATOR" ? "Creator" : userType === "ADMIN" ? "Administrator" : "Listener"}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-400 hover:text-white"
              asChild
            >
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-400 hover:text-red-400"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
