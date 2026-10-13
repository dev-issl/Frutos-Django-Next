"use client";

import { useEffect } from "react";
import { useDashboardAuth } from "@/app/dashboard/_context/DashboardAuthContext";
import { toast } from "@/app/dashboard/_components/Toaster";
import { Megaphone } from "lucide-react";

export default function AnnouncementListener() {
  const { user } = useDashboardAuth();

  useEffect(() => {
    if (!user || (user.userType !== 'STAFF' && user.userType !== 'ADMIN')) return;

    // Use Web Audio API to generate a beep sound
    const playNotificationSound = () => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
        
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

    let ws = null;
    let reconnectTimer = null;
    
    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const rawHost = process.env.NEXT_PUBLIC_WS_URL || "127.0.0.1:8000";
      const host = rawHost.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '').replace(/\/+$/, '');
      const wsUrl = `${protocol}//${host}/ws/announcements/`;
      
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("Connected to announcement socket");
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "new_announcement") {
            const data = message.data;
            playNotificationSound();
            toast(
              (t) => (
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => toast.dismiss(t.id)}>
                  <Megaphone className="w-5 h-5 text-indigo-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 truncate">{data.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{data.message}</p>
                  </div>
                </div>
              ),
              { duration: 6000 }
            );
            // Trigger a custom event so the announcements page can refresh if open
            window.dispatchEvent(new CustomEvent('new_announcement', { detail: data }));
          }
        } catch (error) {
          console.error("Error parsing announcement message:", error);
        }
      };

      ws.onclose = () => {
        // Attempt to reconnect after 5 seconds
        reconnectTimer = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [user]);

  return null;
}
