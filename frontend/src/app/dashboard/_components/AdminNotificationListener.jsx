"use client";

import { useEffect } from "react";
import { useDashboardAuth } from "@/app/dashboard/_context/DashboardAuthContext";
import { toast } from "@/app/dashboard/_components/Toaster";
import { Bell } from "lucide-react";

export default function AdminNotificationListener() {
  const { user } = useDashboardAuth();

  useEffect(() => {
    if (!user || (user.userType !== 'STAFF' && user.userType !== 'ADMIN')) return;

    // We only need to listen if we have a token
    const getCookie = (name) => {
      const value = "; " + document.cookie;
      const parts = value.split("; " + name + "=");
      if (parts.length === 2) return parts.pop().split(";").shift();
    };
    const token = getCookie("access_token");
    if (!token) return;

    // Pleasant two-tone "ding" sound — same as user notification
    const playNotificationSound = () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        // First tone: A5
        const osc1 = ctx.createOscillator(); const g1 = ctx.createGain();
        osc1.type = 'sine'; osc1.frequency.setValueAtTime(880, ctx.currentTime);
        g1.gain.setValueAtTime(0.4, ctx.currentTime); g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc1.connect(g1); g1.connect(ctx.destination);
        osc1.start(ctx.currentTime); osc1.stop(ctx.currentTime + 0.3);
        // Second tone: E5 (slightly delayed)
        const osc2 = ctx.createOscillator(); const g2 = ctx.createGain();
        osc2.type = 'sine'; osc2.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
        g2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15); g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc2.connect(g2); g2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.15); osc2.stop(ctx.currentTime + 0.5);
      } catch { /* browser may block audio before user gesture */ }
    };

    let es = null;
    let reconnectTimer = null;
    
    const connect = () => {
      const apiBase = process.env.NEXT_PUBLIC_API_URL;
      const url = `${apiBase}/auth/notifications/stream/?context=dashboard&token=${token}`;
      es = new EventSource(url);

      es.onopen = () => {
        console.log("Connected to admin notifications stream");
      };

      es.onmessage = (event) => {
        // Ignore SSE comment-style heartbeats and empty events
        if (!event.data || event.data.trim() === '' || event.data.includes('heartbeat')) return;

        try {
          const data = JSON.parse(event.data);
          playNotificationSound();
          
          toast(
            (t) => (
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => toast.dismiss(t.id)}>
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800 truncate">{data.title}</p>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{data.message}</p>
                </div>
              </div>
            ),
            { duration: 5000 }
          );

          // Dispatch a custom event to notify components like Header to refetch counts/notifications
          window.dispatchEvent(new CustomEvent('admin_notification_received', { detail: data }));
          
        } catch (error) {
          console.error("Error parsing notification message:", error);
        }
      };

      es.onerror = () => {
        // Do not use console.error — triggers Next.js dev error overlay
        es.close();
        reconnectTimer = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (es) es.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [user]);

  return null;
}
