"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Home, Library, Wallet, User, Gift, Users, Shield, BarChart3, Package } from "lucide-react";
import Link from "next/link";

export function MobileBottomNav() {
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

  const userType = (session.user as any)?.userType?.toUpperCase() || "LISTENER";
  const canAccessListenerFeatures = userType === "LISTENER";
  const isAdmin = userType === "ADMIN";

  const navItems = [
    ...(isAdmin
      ? [
          { icon: Shield, label: "Admin", path: "/admin", active: isActive("/admin") || pathname?.startsWith("/admin"), show: true },
          { icon: Package, label: "Codes", path: "/admin?tab=code-system", active: false, show: true },
          { icon: BarChart3, label: "Stats", path: "/admin?tab=revenue", active: false, show: true }
        ]
      : [
          { icon: Home, label: "Home", path: "/dashboard", active: isActive("/dashboard"), show: true },
          { icon: Library, label: "My Shellff", path: "/library", active: isActive("/library"), show: canAccessListenerFeatures },
          { icon: Gift, label: "Unlock", path: "/unlock-album", active: isActive("/unlock-album"), show: canAccessListenerFeatures },
          { icon: Users, label: "Groups", path: "/group-packs", active: isActive("/group-packs"), show: canAccessListenerFeatures },
          { icon: Wallet, label: "Wallet", path: "/wallet", active: isActive("/wallet"), show: true }
        ]),
    { icon: User, label: "Profile", path: "/profile", active: isActive("/profile"), show: true }
  ].filter((item) => item.show);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-t border-gray-800">
      <div
        className={`grid h-16 max-w-full overflow-hidden ${
          navItems.length === 5 ? "grid-cols-5" : navItems.length === 4 ? "grid-cols-4" : "grid-cols-3"
        }`}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors px-1 ${
                item.active ? "text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${item.active ? "text-white" : ""}`} />
              <span className="text-[10px] sm:text-xs font-medium truncate max-w-full leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

