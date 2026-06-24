"use client";

import { useState } from "react";
import PortalSidebar from "./_components/PortalSidebar";

export default function ShopPortalLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#f8fafc]">
      <PortalSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
