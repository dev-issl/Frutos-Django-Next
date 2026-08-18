"use client";

import { useEffect } from "react";
import { useStaffAuth } from "@/app/staff/_context/StaffAuthContext";
import { toast } from "@/app/dashboard/_components/Toaster";
import { ShoppingBag, AlertTriangle } from "lucide-react";
import { hasValidSession } from "@/app/dashboard/_lib/auth";

/**
 * Listens to the SSE notification stream for STAFF users.
 * Plays real notification sound + shows toast when a new order arrives.
 */
export default function StaffOrderNotificationListener() {
  const { user } = useStaffAuth();

  useEffect(() => {
    if (!user || user.userType !== 'STAFF') return;

    // Staff token is stored in localStorage
    const token = localStorage.getItem('staff_access_token');
    if (!token) return;

    // Real notification sound — same WAV file used by admin
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
              addTone(880, t, 0.6, 0.22);
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
      // Use context=dashboard so we receive admin_alert + out_of_stock types
      const url = `${apiBase}/auth/notifications/stream/?context=dashboard&token=${token}`;
      es = new EventSource(url);

      es.onmessage = (event) => {
        if (!event.data || event.data.trim() === '' || event.data.includes('heartbeat')) return;

        try {
          const data = JSON.parse(event.data);

          // Only react to order-related notifications
          if (data.type !== 'admin_alert' && data.type !== 'out_of_stock') return;

          playNotificationSound();

          const isOutOfStock = data.type === 'out_of_stock';
          toast(
            (t) => (
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => toast.dismiss(t.id)}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isOutOfStock ? 'bg-orange-100' : 'bg-emerald-100'}`}>
                  {isOutOfStock
                    ? <AlertTriangle className="w-4 h-4 text-orange-600" />
                    : <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800 truncate">{data.title}</p>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{data.message}</p>
                </div>
              </div>
            ),
            { duration: 6000 }
          );

          // Dispatch event so staff pages can refresh order lists if needed
          window.dispatchEvent(new CustomEvent('staff_order_notification', { detail: data }));

        } catch { /* ignore parse errors */ }
      };

      es.onerror = () => {
        es.close();
        if (hasValidSession()) {
          reconnectTimer = setTimeout(connect, 5000);
        } else {
          // Fire event so app can log user out
          window.dispatchEvent(new CustomEvent("admin:session-expired"));
        }
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
