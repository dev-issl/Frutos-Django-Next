"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboardAuth } from "@/app/dashboard/_context/DashboardAuthContext";
import { filterMenuByRole } from "@/app/dashboard/_lib/permissions";
import api from "@/app/dashboard/_lib/api";
import {
  LayoutDashboard,
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  Store,
  Building2,
  Truck,
  Globe,
  Layers,
  ArrowLeftRight,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Tag,
  Ticket,
  MessageSquare,
  Star,
} from "lucide-react";
import Image from "next/image";

const navGroups = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Catalog",
    items: [
      { name: "Products", href: "/dashboard/products", icon: Package },
      { name: "Categories", href: "/dashboard/categories", icon: Layers },
      { name: "Brands", href: "/dashboard/brands", icon: Tag },
      { name: "Reviews", href: "/dashboard/reviews", icon: Star },
    ],
  },
  {
    label: "Sales",
    items: [
      { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
      { name: "Coupons", href: "/dashboard/coupons", icon: Ticket },
      { name: "Shipping", href: "/dashboard/shipping", icon: Truck },
    ],
  },
  {
    label: "People",
    items: [
      { name: "Users", href: "/dashboard/users", icon: Users },
      { name: 'Stores', href: '/dashboard/stores', icon: Store },
      // { name: "Vendors", href: "/dashboard/vendors", icon: Building2 },
      { name: "Shops", href: "/dashboard/shops", icon: Store },
    ],
  },
  {
    label: "Support",
    items: [
      { name: "Tickets", href: "/dashboard/tickets", icon: MessageSquare, badgeKey: "openTickets" },
    ],
  },
  {
    label: "Content",
    items: [
      { name: "Website", href: "/dashboard/website", icon: Globe },
      { name: "Sections", href: "/dashboard/sections", icon: Layers },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Import / Export", href: "/dashboard/import-export", icon: ArrowLeftRight },
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  const pathname = usePathname();
  const { user, logout } = useDashboardAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badges, setBadges] = useState({ openTickets: 0 });

  // Poll open-ticket count every 30s for notification badge
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await api.get("/api/auth/vendor/tickets/", { status: "OPEN", page_size: 1 });
        const count = res?.count ?? (Array.isArray(res) ? res.length : 0);
        setBadges((b) => ({ ...b, openTickets: count }));
      } catch {
        // silently ignore
      }
    };
    fetchCount();
    const id = setInterval(fetchCount, 30_000);
    return () => clearInterval(id);
  }, []);

  const filteredGroups = useMemo(
    () => filterMenuByRole(navGroups, user?.userType),
    [user?.userType]
  );

  const isActive = (href) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      {/* <div className="h-14 flex items-center px-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
        {!collapsed && (
          <span className="text-base font-semibold text-gray-900 dark:text-white">
            iCommerce
          </span>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hidden md:flex"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div> */}
      {/* Logo */}
    <div className="h-14 flex items-center px-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
      {!collapsed && (
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8 shrink-0">
            <Image 
              src="/favicon_orrange.jpeg" 
              alt="El-Arbol Logo" 
              fill 
              priority 
              className="object-contain" 
            />
          </div>
          <span className="text-base font-bold text-gray-900 dark:text-white whitespace-nowrap">
            El-Arbol
          </span>
        </div>
      )}
      
      <button
        onClick={onToggle}
        className="ml-auto p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hidden md:flex"
      >
        <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
      </button>
    </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {filteredGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-2 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                      active
                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="flex-1">{item.name}</span>}
                    {badgeCount > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                        active ? "bg-white/20 text-white dark:bg-gray-900/20 dark:text-gray-900" : "bg-red-500 text-white"
                      }`}>
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-2 shrink-0">
        <button
          onClick={logout}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-1.5 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm"
      >
        <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-1 rounded-md text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 h-screen sticky top-0 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-all duration-200 ${
          collapsed ? "w-16" : "w-56"
        }`}
      >
        <NavContent />
      </aside>
    </>
  );
}
