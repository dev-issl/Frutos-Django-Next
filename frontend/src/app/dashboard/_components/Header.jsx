"use client";

import { useDashboardAuth } from "@/app/dashboard/_context/DashboardAuthContext";
import { Bell, Search, ShoppingCart, Package, X, ExternalLink } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ordersService } from "@/app/dashboard/_lib/services";
import api from "@/app/dashboard/_lib/api";

function NotificationDropdown({ onClose }) {
  const { data: rawNotifs } = useSWR(
    "header-notifications-admin",
    () => api.get("/api/auth/notifications/?context=dashboard"),
    { revalidateOnFocus: true, refreshInterval: 10000, dedupingInterval: 5000 }
  );

  const notifications = rawNotifs?.results || (Array.isArray(rawNotifs) ? rawNotifs : []);
  const recent = notifications.slice(0, 5);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {unreadCount > 0 && (
        <div className="px-4 py-2.5 bg-indigo-50 border-b border-indigo-100">
          <div className="flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <p className="text-xs font-semibold text-indigo-700">
              {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}

      <div className="max-h-64 overflow-y-auto">
        {recent.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-slate-400">No recent notifications</div>
        ) : (
          recent.map((notif) => {
            const isUnread = !notif.is_read;
            const iconName = notif.icon || notif.metadata?.icon || 'notifications';
            const count = notif.metadata?.message_count || 1;
            
            const content = (
              <>
                <div className={`p-1.5 rounded-lg shrink-0 h-fit ${isUnread ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{iconName}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs flex items-center gap-2 truncate ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                    {notif.title}
                    {count > 1 && (
                      <span className="inline-flex items-center justify-center bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                        {count}
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">{notif.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                </div>
                {isUnread && <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />}
              </>
            );

            let href = null;
            if (notif.type === 'admin_ticket_reply' && notif.metadata?.ticket_id) {
              href = `/dashboard/tickets?ticket_id=${notif.metadata.ticket_id}`;
            } else if (notif.type === 'new_order' || notif.type === 'order_paid' || notif.title?.toLowerCase().includes('order')) {
              href = `/dashboard/orders`;
            }

            const itemClass = `flex gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer ${isUnread ? 'bg-indigo-50/30' : ''}`;

            if (href) {
              return (
                <Link 
                  key={notif.id}
                  href={href}
                  onClick={async () => {
                    if (isUnread) {
                      await api.post('/api/auth/notifications/mark-read/', { ids: [notif.id], context: 'dashboard' });
                    }
                    onClose();
                  }}
                  className={itemClass}
                >
                  {content}
                </Link>
              );
            }

            return (
              <div key={notif.id} className={itemClass}>
                {content}
              </div>
            );
          })
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
        <Link href="/dashboard/notifications" onClick={onClose} className="flex items-center justify-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
          View all notifications <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

export default function Header({ onMenuClick }) {
  const { user } = useDashboardAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const notifRef = useRef(null);

  // Close notification dropdown on outside click
  useEffect(() => {
    if (!showNotifications) return;
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotifications]);

  // Get unread notification count
  const { data: unreadData } = useSWR(
    "header-unread-notifications-admin",
    () => api.get("/api/auth/notifications/unread-count/?context=dashboard"),
    { revalidateOnFocus: true, refreshInterval: 10000, dedupingInterval: 5000 }
  );
  const unreadCount = unreadData?.unreadCount || unreadData?.unread_count || 0;

  return (
    <header className="h-14 shrink-0 border-b border-slate-100 bg-white flex items-center px-4 md:px-6 sticky top-0 z-30 shadow-sm">
      {/* Left side — mobile sidebar toggle */}
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 mr-3 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side — all controls */}
      <div className="flex items-center gap-1">
        {/* Search bar (desktop) */}
        <div className="hidden md:flex items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-48 lg:w-60 pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 focus:w-72 transition-all duration-200"
            />
          </div>
        </div>

        {/* Search button (mobile) */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 relative transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-3.5 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-0.5">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <NotificationDropdown onClose={() => setShowNotifications(false)} />
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* User avatar + name */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-[#00694C] flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-xs font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </span>
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-bold text-slate-800 leading-tight whitespace-nowrap">{user?.name || "Admin"}</p>
            <p className="text-[10px] text-slate-400 leading-tight capitalize font-medium">
              {user?.userType === "VENDOR" && user?.vendorStatus
                ? `Vendor (${user.vendorStatus.toLowerCase()})`
                : user?.userType?.toLowerCase() || "admin"}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile search bar (expandable) */}
      {showSearch && (
        <div className="absolute left-0 right-0 top-14 px-4 py-2 bg-white border-b border-slate-100 md:hidden shadow-sm">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              autoFocus
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        </div>
      )}
    </header>
  );
}
