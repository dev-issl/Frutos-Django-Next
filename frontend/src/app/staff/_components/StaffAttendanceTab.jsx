"use client";

import { useState } from "react";
import useSWR from "swr";
import api from "@/app/dashboard/_lib/api";
import {
  ClipboardCheck,
  Store as StoreIcon,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  ArrowRight,
  Loader2,
  Calendar,
  Timer,
  TrendingUp,
  ChevronDown,
  Check,
} from "lucide-react";

function formatAMPM(timeStr, dateStr = null) {
  if (!timeStr) return "—";
  
  if (dateStr) {
    let timeParts = timeStr.split(':');
    if (timeParts.length === 2) timeParts.push('00');
    const d = new Date(`${dateStr}T${timeParts.join(':')}Z`);
    if (!isNaN(d)) {
      return d.toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  }

  const [h, m] = timeStr.split(":");
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours.toString().padStart(2, "0")}:${m} ${ampm}`;
}

function getStoreStatus(openTime, closeTime) {
  if (!openTime || !closeTime) return { isOpen: null };
  const now = new Date();
  const toMin = (s) => { const p = s.split(":"); return +p[0] * 60 + +p[1]; };
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isOpen = nowMin >= toMin(openTime) && nowMin < toMin(closeTime);
  const fmt = (s) => { const p = s.split(":"); let h = +p[0]; const m = p[1]; const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return `${h}:${m} ${ap}`; };
  return { isOpen, label: `${fmt(openTime)} – ${fmt(closeTime)}` };
}

const STATUS_STYLE = {
  IN_PROGRESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED:   "bg-blue-50 text-blue-700 border-blue-200",
  SCHEDULED:   "bg-amber-50 text-amber-700 border-amber-200",
  DAY_OFF:     "bg-slate-100 text-slate-500 border-slate-200",
  ABSENT:      "bg-red-50 text-red-600 border-red-200",
};

export default function StaffAttendanceTab({
  profile,
  shifts = [],
  currentActiveShift,
  active_stores = [],
  onSelectStore,
}) {
  // Fetch full shift history
  const { data: allShiftsRaw } = useSWR(
    "/api/staff/me/dashboard/",
    (url) => api.get(url),
    { revalidateOnFocus: false }
  );
  const allShifts = allShiftsRaw?.shifts || shifts;

  // Today info
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const todayShift = allShifts.find((s) => s.date === todayStr);

  // Monthly stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyShifts = allShifts.filter(shift => new Date(shift.date) >= startOfMonth);

  const monthlyHours = monthlyShifts.reduce((acc, s) => {
    if (!s.start_time || !s.end_time || s.status === "DAY_OFF" || s.status === "ABSENT") return acc;
    const start = new Date(`2000-01-01T${s.start_time}`);
    const end   = new Date(`2000-01-01T${s.end_time}`);
    let diff = (end - start) / 3600000;
    if (s.break_start && s.break_end) {
      const bs = new Date(`2000-01-01T${s.break_start}`);
      const be = new Date(`2000-01-01T${s.break_end}`);
      diff -= (be - bs) / 3600000;
    }
    return acc + Math.max(0, diff);
  }, 0);

  const formatTotalTime = (hoursDecimal) => {
    const totalMins = Math.round(hoursDecimal * 60);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    if (m > 0) return `${m}m`;
    return "0m";
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">

      {/* ── Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#00694C] flex items-center justify-center shadow-md shrink-0">
          <ClipboardCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-serif text-[#004A3A] font-medium tracking-tight leading-none">
            Attendance
          </h1>
          <p className="text-slate-500 text-[11px] mt-1">
            Your attendance overview &amp; store access
          </p>
        </div>
      </div>

      {/* ── Today's status card */}
      <div className="grid md:grid-cols-3 gap-3">
        {/* Today card */}
        <div className={`rounded-xl p-4 border ${currentActiveShift ? "bg-gradient-to-br from-[#E4EFDA] to-[#D9EFE5] border-[#BCE4D3]" : "bg-white border-slate-100 shadow-sm"}`}>
          <div className="flex items-center gap-1.5 mb-3">
            <Clock className={`w-3.5 h-3.5 ${currentActiveShift ? "text-[#00694C]" : "text-slate-400"}`} />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Today</span>
          </div>
          {currentActiveShift ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-[#004A3A]">Shift In Progress</span>
              </div>
              <div className="text-xs text-[#00694C]/70 font-medium space-y-1">
                <div className="flex justify-between">
                  <span>Store</span>
                  <span className="font-bold text-[#004A3A]">{currentActiveShift.store_name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Started</span>
                  <span className="font-bold text-[#004A3A]">{formatAMPM(currentActiveShift.start_time, currentActiveShift.date || todayStr)}</span>
                </div>
              </div>
            </>
          ) : todayShift?.status === "DAY_OFF" ? (
            <div className="flex flex-col items-start gap-2">
              <Ban className="w-8 h-8 text-slate-300" strokeWidth={1.5} />
              <span className="text-sm font-semibold text-slate-400 italic">Day Off</span>
            </div>
          ) : todayShift?.status === "COMPLETED" ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-bold text-slate-600">Shift Completed</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {formatAMPM(todayShift.start_time, todayShift.date)} – {formatAMPM(todayShift.end_time, todayShift.date)}
              </p>
            </>
          ) : (
            <div className="flex flex-col items-start gap-2">
              <Timer className="w-8 h-8 text-slate-200" />
              <span className="text-sm font-semibold text-slate-400">No shift recorded</span>
            </div>
          )}
        </div>

        {/* Monthly total time card */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">This Month</span>
          </div>
          <div className="text-3xl font-bold text-[#00694C] font-mono leading-none mb-1">
            {formatTotalTime(monthlyHours)}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Total Time</div>
        </div>

        {/* Shift count card */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-1.5 mb-3">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">This Month</span>
          </div>
          <div className="text-3xl font-bold text-[#00694C] font-mono leading-none mb-1">
            {monthlyShifts.filter((s) => s.status === "COMPLETED" || s.status === "IN_PROGRESS").length}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Total Shifts</div>
        </div>
      </div>

      {/* ── Store selection section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <StoreIcon className="w-4 h-4 text-[#00694C]" />
          <h2 className="text-xs font-bold text-[#004A3A] uppercase tracking-widest">
            Select a Store to View
          </h2>
        </div>

        {active_stores.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-slate-100">
            <StoreIcon className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-[11px] text-slate-400 font-medium">No active stores available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {active_stores.map((store) => {
              const isMyShiftStore =
                String(currentActiveShift?.store) === String(store.id) ||
                currentActiveShift?.store_name === store.name;
              const status = getStoreStatus(store.openTime, store.closeTime);
              return (
                <button
                  key={store.id}
                  onClick={() => onSelectStore(store)}
                  className="group bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:border-[#00694C]/30 hover:shadow-md transition-all text-left cursor-pointer relative overflow-hidden"
                >
                  {isMyShiftStore && (
                    <span className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  )}
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#F1F6EB] flex items-center justify-center group-hover:bg-[#E4EFDA] transition-colors overflow-hidden shrink-0">
                      {store.image ? (
                        <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
                      ) : (
                        <StoreIcon className="w-4 h-4 text-[#00694C]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[#004A3A] text-sm truncate group-hover:text-[#00694C] transition-colors">
                        {store.name}
                      </h3>
                      {store.address && (
                        <div className="flex items-center gap-1 text-slate-400 text-[10px] mt-0.5">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{store.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Open/closed status */}
                  {status.isOpen !== null && (
                    <div className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2 py-1 rounded-full mb-3 ${status.isOpen ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-600"}`}>
                      <span className={`w-1 h-1 rounded-full ${status.isOpen ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                      {status.isOpen ? "Open Now" : "Closed"}
                      {status.label && <span className="text-slate-500 font-medium ml-1">· {status.label}</span>}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#00694C] group-hover:gap-2.5 transition-all">
                    Open Store Tab
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
