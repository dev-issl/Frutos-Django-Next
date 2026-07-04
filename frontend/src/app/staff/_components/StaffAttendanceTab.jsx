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
} from "lucide-react";

function formatAMPM(timeStr) {
  if (!timeStr) return "—";
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
  const [historyFilter, setHistoryFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");

  // Fetch full shift history (more than 7 days)
  const { data: allShiftsRaw, isLoading: shiftsLoading } = useSWR(
    "/api/staff/me/dashboard/",
    (url) => api.get(url),
    { revalidateOnFocus: false }
  );
  const allShifts = allShiftsRaw?.shifts || shifts;

  // Today info
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const todayShift = allShifts.find((s) => s.date === todayStr);

  // Filter logic
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const uniqueStores = [...new Set(allShifts.map(s => s.store_name).filter(Boolean))].sort();

  const filteredShifts = allShifts.filter(shift => {
    if (storeFilter !== 'all' && shift.store_name !== storeFilter) return false;

    if (historyFilter === 'all') return true;
    const shiftDate = new Date(shift.date);
    if (historyFilter === 'month') return shiftDate >= startOfMonth;
    if (historyFilter === 'week') return shiftDate >= startOfWeek;
    return true;
  });

  // Calculate hours for filtered shifts
  const periodHours = filteredShifts.reduce((acc, s) => {
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-400">

      {/* ── Page header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#00694C] flex items-center justify-center shadow-md shrink-0">
          <ClipboardCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-serif text-[#004A3A] font-medium tracking-tight leading-none">
            Attendance
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Your attendance overview &amp; store access
          </p>
        </div>
      </div>

      {/* ── Today's status card */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Today card */}
        <div className={`rounded-2xl p-6 border ${currentActiveShift ? "bg-gradient-to-br from-[#E4EFDA] to-[#D9EFE5] border-[#BCE4D3]" : "bg-white border-slate-100 shadow-sm"}`}>
          <div className="flex items-center gap-2 mb-4">
            <Clock className={`w-4 h-4 ${currentActiveShift ? "text-[#00694C]" : "text-slate-400"}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Today</span>
          </div>
          {currentActiveShift ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold text-[#004A3A]">Shift In Progress</span>
              </div>
              <div className="text-xs text-[#00694C]/70 font-medium space-y-1">
                <div className="flex justify-between">
                  <span>Store</span>
                  <span className="font-bold text-[#004A3A]">{currentActiveShift.store_name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Started</span>
                  <span className="font-bold text-[#004A3A]">{formatAMPM(currentActiveShift.start_time)}</span>
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
                {formatAMPM(todayShift.start_time)} – {formatAMPM(todayShift.end_time)}
              </p>
            </>
          ) : (
            <div className="flex flex-col items-start gap-2">
              <Timer className="w-8 h-8 text-slate-200" />
              <span className="text-sm font-semibold text-slate-400">No shift recorded</span>
            </div>
          )}
        </div>

        {/* Week hours card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{historyFilter === 'all' ? 'All Time' : historyFilter === 'month' ? 'This Month' : 'This Week'}</span>
          </div>
          <div className="text-4xl font-bold text-[#00694C] font-mono leading-none mb-1">
            {periodHours.toFixed(1)}
          </div>
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Hours Worked</div>
        </div>

        {/* Shift count card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Shift History</span>
          </div>
          <div className="text-4xl font-bold text-[#00694C] font-mono leading-none mb-1">
            {filteredShifts.filter((s) => s.status === "COMPLETED" || s.status === "IN_PROGRESS").length}
          </div>
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Total Shifts</div>
        </div>
      </div>

      {/* ── Recent shift history */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-sm font-bold text-[#004A3A] uppercase tracking-widest shrink-0">Working History</h2>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Store Filter */}
            {uniqueStores.length > 0 && (
              <div className="relative w-full sm:w-48 shrink-0">
                <StoreIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg appearance-none focus:outline-none focus:border-[#00694C] cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <option value="all">All Stores</option>
                  {uniqueStores.map(store => (
                    <option key={store} value={store}>{store}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            )}

            {/* Time Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto shrink-0">
              <button 
                onClick={() => setHistoryFilter('all')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${historyFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >All Time</button>
              <button 
                onClick={() => setHistoryFilter('month')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${historyFilter === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >This Month</button>
              <button 
                onClick={() => setHistoryFilter('week')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${historyFilter === 'week' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >This Week</button>
            </div>
          </div>
        </div>

        {shiftsLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-6 h-6 text-[#00694C] animate-spin" />
          </div>
        ) : allShifts.length === 0 ? (
          <div className="py-10 text-center">
            <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">No shift records yet</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {[...filteredShifts].sort((a, b) => new Date(b.date) - new Date(a.date)).map((s, index) => {
              let hrs = "—";
              if (s.start_time && s.end_time) {
                const st = new Date(`2000-01-01T${s.start_time}`);
                const en = new Date(`2000-01-01T${s.end_time}`);
                let d = (en - st) / 3600000;
                if (s.break_start && s.break_end) {
                  const bs = new Date(`2000-01-01T${s.break_start}`);
                  const be = new Date(`2000-01-01T${s.break_end}`);
                  d -= (be - bs) / 3600000;
                }
                hrs = `${Math.max(0, d).toFixed(1)}h`;
              }
              const isToday = s.date === todayStr;
              
              return (
                <div key={s.id} className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${index !== 0 ? 'border-t border-slate-100' : ''} hover:bg-slate-50/50 ${isToday ? 'bg-[#F1F6EB]/30' : ''}`}>
                  <div className="flex items-center gap-5">
                    {/* Date Block */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-[#00694C]/10 to-[#00694C]/5 text-[#00694C] flex flex-col items-center justify-center shrink-0 border border-[#00694C]/20 shadow-sm">
                      <span className="text-[10px] font-bold uppercase leading-none mb-0.5">{new Date(s.date + "T00:00:00").toLocaleDateString("en-US", { month: "short" })}</span>
                      <span className="text-base font-black leading-none">{new Date(s.date + "T00:00:00").toLocaleDateString("en-US", { day: "numeric" })}</span>
                    </div>
                    
                    {/* Shift Info */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="text-sm font-bold text-slate-800 tracking-tight">{s.store_name || "Unknown Store"}</h4>
                        {isToday && <span className="text-[9px] font-bold bg-[#00694C] text-white px-1.5 py-0.5 rounded-full uppercase shadow-sm">Today</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium bg-slate-100/50 px-2.5 py-1 rounded-md border border-slate-100 w-fit">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> 
                          {formatAMPM(s.start_time)} <ArrowRight className="w-3 h-3 text-slate-300" /> {formatAMPM(s.end_time)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats & Status */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-3 sm:mt-0 pl-[68px] sm:pl-0">
                    <div className="text-left sm:text-right flex flex-col sm:items-end">
                      <span className="text-lg font-black text-[#00694C] leading-none mb-0.5">{hrs}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Total Hours</span>
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border shadow-sm ${STATUS_STYLE[s.status] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
                      {(s.status || "").replace("_", " ")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Store selection section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <StoreIcon className="w-5 h-5 text-[#00694C]" />
          <h2 className="text-sm font-bold text-[#004A3A] uppercase tracking-widest">
            Select a Store to View
          </h2>
        </div>

        {active_stores.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-100">
            <StoreIcon className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">No active stores available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {active_stores.map((store) => {
              const isMyShiftStore =
                String(currentActiveShift?.store) === String(store.id) ||
                currentActiveShift?.store_name === store.name;
              const status = getStoreStatus(store.openTime, store.closeTime);
              return (
                <button
                  key={store.id}
                  onClick={() => onSelectStore(store)}
                  className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-[#00694C]/30 hover:shadow-md transition-all text-left cursor-pointer relative overflow-hidden"
                >
                  {isMyShiftStore && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F1F6EB] flex items-center justify-center group-hover:bg-[#E4EFDA] transition-colors overflow-hidden shrink-0">
                      {store.image ? (
                        <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
                      ) : (
                        <StoreIcon className="w-5 h-5 text-[#00694C]" />
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
