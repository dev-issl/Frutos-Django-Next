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

    // Use Web Audio API to generate a beep sound
    const playNotificationSound = () => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = "sine";
        // Slightly different pitch from announcement to distinguish
        oscillator.frequency.setValueAtTime(660, audioCtx.currentTime); // E5 note
        oscillator.frequency.exponentialRampToValueAtTime(330, audioCtx.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
      } catch (err) {
        console.error("Failed to play notification sound", err);
      }
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
        // Ignored heartbeats
        if (event.data === "heartbeat" || !event.data) return;

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

      es.onerror = (err) => {
        console.error("SSE error, attempting reconnect", err);
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
