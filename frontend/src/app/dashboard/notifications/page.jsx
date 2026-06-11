"use client";

import { useState } from "react";
import useSWR from "swr";
import api from "@/app/dashboard/_lib/api";
import { Bell, CheckCircle2, Trash2 } from "lucide-react";

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { data: rawNotifs, mutate } = useSWR(
    `dashboard-notifications-page-${page}-admin`,
    () => api.get(`/api/auth/notifications/?page=${page}&page_size=20&context=dashboard`),
    { revalidateOnFocus: true, refreshInterval: 10000, dedupingInterval: 5000 }
  );

  const [selectedIds, setSelectedIds] = useState([]);

  const notifications = rawNotifs?.results || (Array.isArray(rawNotifs) ? rawNotifs : []);
  const totalPages = rawNotifs?.total_pages || 1;

  const handleMarkAsRead = async (id) => {
    try {
      await api.post(`/api/auth/notifications/mark-read/`, { ids: [id], context: 'dashboard' });
      mutate(); // Refresh the list
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post("/api/auth/notifications/mark-read/", { all: true, context: 'dashboard' });
      mutate();
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === notifications.length && notifications.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map((n) => n.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      await api.delete("/api/auth/notifications/bulk-delete/", {
        body: JSON.stringify({ ids: selectedIds }),
      });
      setSelectedIds([]);
      mutate();
    } catch (err) {
      console.error("Failed to delete notifications", err);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">Stay updated with the latest system alerts and activity.</p>
        </div>
        <div className="flex gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedIds.length})
            </button>
          )}
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Mark all as read
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No notifications yet</h3>
            <p className="text-slate-500 mt-1 text-sm">When you get notifications, they'll show up here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="p-4 sm:px-5 sm:py-3 bg-slate-50 flex items-center gap-4 border-b border-slate-200">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                checked={notifications.length > 0 && selectedIds.length === notifications.length}
                onChange={handleSelectAll}
              />
              <span className="text-sm font-semibold text-slate-600">Select All</span>
            </div>
            {notifications.map((notif) => {
              const isUnread = !notif.is_read;
              const iconName = notif.icon || notif.metadata?.icon || 'notifications';

              return (
                <div key={notif.id} className={`p-4 sm:p-5 flex gap-4 transition-colors hover:bg-slate-50 ${isUnread ? 'bg-indigo-50/20' : ''}`}>
                  <div className="shrink-0 flex items-center pt-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                      checked={selectedIds.includes(notif.id)}
                      onChange={() => handleToggleSelect(notif.id)}
                    />
                  </div>
                  <div className={`mt-1 p-2.5 rounded-xl shrink-0 h-fit ${isUnread ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{iconName}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className={`text-sm ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                        {new Date(notif.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                  
                  {isUnread && (
                    <div className="shrink-0 flex items-center">
                      <button 
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
