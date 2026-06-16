"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardAuthProvider, useDashboardAuth } from "@/app/dashboard/_context/DashboardAuthContext";
import { ToastProvider } from "@/app/dashboard/_components/Toaster";
import Sidebar from "@/app/dashboard/_components/Sidebar";
import Header from "@/app/dashboard/_components/Header";
import "@/app/dashboard/dashboard.css";

function DashboardShell({ children }) {
  const { user, loading } = useDashboardAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Login page has no shell
  if (pathname === "/dashboard/login") {
    return <>{children}</>;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated - the auth context will redirect
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        {user?.userType === "VENDOR" && user?.vendorStatus && user.vendorStatus !== "APPROVED" && (
          <div className="px-4 py-2 text-xs font-medium text-center bg-amber-50 text-amber-700 border-b border-amber-200">
            Your vendor account is <span className="font-bold">{user.vendorStatus.toLowerCase()}</span>. Some actions may be restricted until approval.
          </div>
        )}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <DashboardAuthProvider>
      <ToastProvider>
        <DashboardShell>{children}</DashboardShell>
      </ToastProvider>
    </DashboardAuthProvider>
  );
}

