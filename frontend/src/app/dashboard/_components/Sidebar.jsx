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
  Info,
  Bell,
  Home,
  FileText,
  Megaphone,
  CalendarDays,
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
      { name: "Leftover Packs", href: "/dashboard/leftover-packs", icon: Package },
      { name: "Categories", href: "/dashboard/categories", icon: Layers },
      { name: "Offers", href: "/dashboard/offers", icon: Tag },
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
      { name: "Staff", href: "/dashboard/staff", icon: Users },
      { name: "Request Days", href: "/dashboard/staff/request-days", icon: CalendarDays },
      { name: 'Stores', href: '/dashboard/stores', icon: Store },
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
      { name: "Site config", href: "/dashboard/website", icon: Globe },
      { name: "Home Page", href: "/dashboard/home", icon: Home },
      { name: "About Page", href: "/dashboard/about", icon: FileText },
      { name: "Wholesale Page", href: "/dashboard/wholesale", icon: Building2 },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Import / Export", href: "/dashboard/import-export", icon: ArrowLeftRight },
      { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
      { name: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  const pathname = usePathname();
  const { user, logout } = useDashboardAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badges, setBadges] = useState({ openTickets: 0 });

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
    if (href === "/dashboard/staff") {
      return pathname === "/dashboard/staff" || (pathname.startsWith("/dashboard/staff/") && !pathname.startsWith("/dashboard/staff/request-days"));
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const NavContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-slate-100 shrink-0 bg-white">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 shrink-0 rounded-lg overflow-hidden shadow-sm">
              <Image
                src="/favicon_orrange.jpeg"
                alt="El-Arbol Logo"
                fill
                priority
                className="object-contain"
              />
            </div>
            <span className="text-base font-bold text-slate-800 whitespace-nowrap tracking-tight">
              El-Arbol
            </span>
          </div>
        )}

        <button
          onClick={onToggle}
          className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 hidden md:flex transition-colors"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-5">
        {filteredGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-2.5 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
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
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "bg-[#00694C] text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
                    {!collapsed && <span className="flex-1">{item.name}</span>}
                    {badgeCount > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                        active ? "bg-white/20 text-white" : "bg-red-500 text-white"
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

    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-1.5 rounded-lg bg-white border border-slate-200 shadow-sm"
      >
        <Menu className="w-5 h-5 text-slate-700" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 h-full bg-white border-r border-slate-100 shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 h-screen sticky top-0 bg-white border-r border-slate-100 transition-all duration-200 shadow-sm ${
          collapsed ? "w-16" : "w-56"
        }`}
      >
        <NavContent />
      </aside>
    </>
  );
}
