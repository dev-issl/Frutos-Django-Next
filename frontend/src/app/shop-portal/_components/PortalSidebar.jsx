"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  User,
  Package,
  HelpCircle,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/shop-portal", icon: LayoutDashboard },
  { name: "Order Line", href: "/shop-portal/order-line", icon: ShoppingCart },
  { name: "Account Info", href: "/shop-portal/account", icon: User },
  { name: "Orders", href: "/shop-portal/orders", icon: Package, badge: "3" },
  { name: "Support Tickets", href: "/shop-portal/support", icon: HelpCircle },
  { name: "Notification", href: "/shop-portal/notifications", icon: Bell },
  { name: "Settings", href: "/shop-portal/settings", icon: Settings },
];

export default function PortalSidebar({ collapsed, onToggle }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href) => {
    if (href === "/shop-portal") return pathname === "/shop-portal";
    return pathname.startsWith(href);
  };

  const NavContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Mobile Collapse Header */}
      <div className="h-4 flex items-center justify-end px-2 shrink-0 md:hidden mt-2">
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-[15px] font-medium transition-all ${
                active
                  ? "bg-[#e8f3ef] text-[#00694C] shadow-sm relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-8 before:w-1 before:bg-[#00694C] before:rounded-r-md"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 ${active ? "text-[#00694C]" : "text-slate-400"}`} />
              {!collapsed && <span className="flex-1">{item.name} {item.badge && `(${item.badge})`}</span>}
            </Link>
          );
        })}

        <button
          className="flex items-center gap-3 px-3 py-3 mt-4 w-full rounded-lg text-[15px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0 text-slate-400" />
          {!collapsed && <span>Logout</span>}
        </button>
      </nav>

      {/* User Profile Footer */}
      <div className="p-6 shrink-0 bg-white">
        <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white font-medium text-lg shadow-md">
          N
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-[80px] left-3 z-50 p-2 rounded-lg bg-white border border-slate-200 shadow-sm"
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
          <aside className="relative w-64 h-full bg-white border-r border-slate-100 shadow-xl pt-[80px]">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 min-h-[calc(100vh-80px)] bg-white border-r border-slate-100 transition-all duration-200 shadow-sm ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <NavContent />
      </aside>
    </>
  );
}
