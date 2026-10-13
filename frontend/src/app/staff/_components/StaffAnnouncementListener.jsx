"use client";

import { useEffect } from "react";
import { useStaffAuth } from "@/app/staff/_context/StaffAuthContext";
import { toast } from "@/app/dashboard/_components/Toaster";
import { Megaphone } from "lucide-react";

export default function StaffAnnouncementListener() {
  const { user } = useStaffAuth();

  useEffect(() => {
    if (!user || user.userType !== 'STAFF') return;

    // Use Web Audio API to generate a beep sound
    const playNotificationSound = () => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        // Pleasant bell/ding sound
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 1.5);
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 1.5);
      } catch (err) {
        console.error("Failed to play notification sound", err);
      }
    };

    let ws = null;
    let reconnectTimer = null;
    
    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = process.env.NEXT_PUBLIC_WS_URL || "127.0.0.1:8000";
      const cleanHost = host.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '').replace(/\/+$/, '');
      const wsUrl = `${protocol}//${cleanHost}${(!cleanHost.includes(':') && protocol === 'ws:') ? ':8000' : ''}/ws/announcements/`;
      
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("Connected to announcement socket for Staff");
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
                  <div className="w-10 h-10 rounded-full bg-[#00694C]/10 flex items-center justify-center shrink-0">
                    <Megaphone className="w-5 h-5 text-[#00694C]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[#004A3A] truncate">{data.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{data.message}</p>
                  </div>
                </div>
              ),
              { duration: 8000 }
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
