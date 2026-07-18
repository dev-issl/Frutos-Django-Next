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

    // Real notification sound — WAV file preloaded from /public/
    const notifAudio = new Audio('/notification.wav');
    notifAudio.preload = 'auto';
    notifAudio.volume = 0.8;

    const playNotificationSound = () => {
      try {
        notifAudio.currentTime = 0;
        notifAudio.play().catch(() => {
          // Fallback: AudioContext synth
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const resume = ctx.state === 'suspended' ? ctx.resume() : Promise.resolve();
            resume.then(() => {
              const t = ctx.currentTime;
              const addTone = (freq, start, amp, decay) => {
                const osc = ctx.createOscillator(); const g = ctx.createGain();
                osc.type = 'sine'; osc.frequency.setValueAtTime(freq, start);
                g.gain.setValueAtTime(0.001, start);
                g.gain.linearRampToValueAtTime(amp, start + 0.004);
                g.gain.exponentialRampToValueAtTime(0.001, start + decay);
                osc.connect(g); g.connect(ctx.destination);
                osc.start(start); osc.stop(start + decay + 0.05);
              };
              addTone(880,    t,        0.6, 0.22);
              addTone(1108.7, t + 0.13, 0.5, 0.28);
            });
          } catch { /* silent */ }
        });
      } catch { /* silent */ }
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
