"use client";

import { useState, useMemo, useRef } from "react";
import useSWR from "swr";
import api from "@/app/dashboard/_lib/api";
import { Loader2, Users, Store, Clock, Calendar, ChevronRight, ChevronLeft, X, AlertCircle, CalendarClock, CalendarOff, CheckCircle2, Printer } from "lucide-react";

// Helper for photo URL
const getPhotoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://127.0.0.1:8000';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Helper to format decimal hours into "Xh Ym" or "Ym"
const formatHours = (decimalHours) => {
  if (!decimalHours || decimalHours <= 0) return "—";
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

export default function StaffAttendanceTab({ stores }) {
  const [storeFilter, setStoreFilter] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [historyFilter, setHistoryFilter] = useState("all"); // 'all', 'month', 'week', 'today', 'date'
  const [selectedDate, setSelectedDate] = useState("");
  const dateInputRef = useRef(null);

  const { data, isLoading } = useSWR(
    "/api/staff/admin/shift-stats/",
    (url) => api.get(url),
    { revalidateOnFocus: false }
  );

  const allStaff = data?.results || [];

  // Filter staff by store (if they worked at least once in the selected store)
  const staffList = storeFilter
    ? allStaff.filter(s => {
        const storeObj = stores.find(st => String(st.id) === storeFilter);
        return storeObj && s.stores_worked && s.stores_worked[storeObj.name];
      })
    : allStaff;

  const getStoreStaffCount = (storeName) => {
    return allStaff.filter(s => s.stores_worked && s.stores_worked[storeName]).length;
  };

  // --- Detailed View Logic ---
  const currentStaffDetails = selectedStaff ? allStaff.find(s => s.staff_id === selectedStaff) : null;

  const filteredShifts = useMemo(() => {
    if (!currentStaffDetails) return [];
    const shifts = currentStaffDetails.shifts || [];
    const now = new Date();
    
    return shifts.filter(shift => {
      if (historyFilter === 'all') return true;

      const shiftDate = new Date(shift.date);
      const shiftDateNormalized = new Date(shiftDate.getFullYear(), shiftDate.getMonth(), shiftDate.getDate());
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (historyFilter === 'month') {
        return shiftDate.getMonth() === now.getMonth() && shiftDate.getFullYear() === now.getFullYear();
      }
      if (historyFilter === 'week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        startOfWeek.setHours(0,0,0,0);
        return shiftDate >= startOfWeek;
      }
      if (historyFilter === 'today') {
        return shiftDateNormalized.getTime() === todayStart.getTime();
      }
      if (historyFilter === 'date' && selectedDate) {
        const selected = new Date(selectedDate);
        const selectedNormalized = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate());
        return shiftDateNormalized.getTime() === selectedNormalized.getTime();
      }
      return true;
    });
  }, [currentStaffDetails, historyFilter, selectedDate]);

  const periodHours = filteredShifts.reduce((acc, curr) => curr.status === 'COMPLETED' || curr.status === 'IN_PROGRESS' ? acc + (curr.hours || 0) : acc, 0);
  const totalDays = new Set(filteredShifts.filter(s => s.status === 'COMPLETED' || s.status === 'IN_PROGRESS').map(s => s.date)).size;

  const getStatusBadge = (status) => {
    switch(status) {
      case 'COMPLETED':
        return <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case 'IN_PROGRESS':
        return <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md"><Clock className="w-3 h-3" /> Working</span>;
      case 'ABSENT':
        return <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-red-600 bg-red-50 px-2 py-1 rounded-md"><AlertCircle className="w-3 h-3" /> Absent</span>;
      case 'DAY_OFF':
        return <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded-md"><CalendarOff className="w-3 h-3" /> Day Off</span>;
      default:
        return <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{status}</span>;
    }
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            overflow: visible !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
      
      {selectedStaff && currentStaffDetails && (
        <div id="print-area" className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[700px] print:h-auto print:overflow-visible print:border-none print:shadow-none print:block animate-in fade-in zoom-in-95 duration-200 mb-6">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-white border-2 border-white shadow-md shrink-0">
                {currentStaffDetails.photo
                  ? <img src={getPhotoUrl(currentStaffDetails.photo)} alt={currentStaffDetails.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xl font-bold text-[#00694C] bg-gradient-to-br from-[#00694C]/10 to-[#00694C]/5">
                      {currentStaffDetails.name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{currentStaffDetails.name}</h2>
                <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                  <span className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded shadow-sm uppercase tracking-wider text-[11px] font-semibold">ID: {currentStaffDetails.staff_code}</span>
                  <span className="text-slate-300">•</span>
                  <span>{currentStaffDetails.role}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 print:hidden">
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-[#00694C] text-white hover:bg-[#005940] flex items-center gap-2 font-semibold text-sm transition-colors shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Report
              </button>
              <button 
                onClick={() => setSelectedStaff(null)}
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 flex items-center gap-2 font-semibold text-sm transition-colors shadow-sm cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Staff
              </button>
            </div>
          </div>

        {/* Filters & Stats */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white z-10 sticky top-0 shadow-sm print:relative print:shadow-none print:border-b-2 print:border-black">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto print:hidden overflow-x-auto">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg shrink-0">
              <button 
                onClick={() => setHistoryFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${historyFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >All Time</button>
              <button 
                onClick={() => setHistoryFilter('month')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${historyFilter === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >This Month</button>
              <button 
                onClick={() => setHistoryFilter('week')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${historyFilter === 'week' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >This Week</button>
              <button 
                onClick={() => setHistoryFilter('today')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${historyFilter === 'today' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >Today</button>
            </div>
            
            <div className="flex items-center relative w-full sm:w-auto shrink-0">
              <div 
                onClick={() => {
                  try { dateInputRef.current?.showPicker(); } catch (e) { console.error(e) }
                }}
                className={`flex items-center justify-between w-full sm:w-[140px] px-3 py-1.5 h-[32px] rounded-lg text-xs font-bold transition-all border cursor-pointer shadow-sm ${historyFilter === 'date' ? 'bg-[#00694C] text-white border-[#00694C]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
              >
                <span>{selectedDate ? new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "Choose Date"}</span>
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <input
                ref={dateInputRef}
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (e.target.value) setHistoryFilter('date');
                  else setHistoryFilter('all');
                }}
                className="absolute opacity-0 pointer-events-none w-0 h-0"
              />
            </div>
          </div>

          <div className="hidden print:block font-bold text-lg text-slate-800 uppercase tracking-widest">
            {historyFilter === 'month' ? 'Monthly Report' : historyFilter === 'week' ? 'Weekly Report' : historyFilter === 'today' ? 'Daily Report' : historyFilter === 'date' ? `Report for ${selectedDate}` : 'All Time Report'}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#00694C]/5 px-4 py-2 rounded-lg border border-[#00694C]/10 print:bg-transparent print:border-none print:p-0">
              <Calendar className="w-4 h-4 text-[#00694C] print:hidden" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider print:text-[10px]">Total Days:</span>
              <span className="text-lg font-extrabold text-[#00694C] print:text-black print:text-base leading-none">{totalDays}</span>
            </div>
            <div className="hidden print:block text-slate-300">•</div>
            <div className="flex items-center gap-2 bg-[#00694C]/5 px-4 py-2 rounded-lg border border-[#00694C]/10 print:bg-transparent print:border-none print:p-0">
              <CalendarClock className="w-4 h-4 text-[#00694C] print:hidden" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider print:text-[10px]">Total Time:</span>
              <span className="text-lg font-extrabold text-[#00694C] print:text-black print:text-base leading-none">{formatHours(periodHours)}</span>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="flex-1 overflow-y-auto bg-slate-50/30 p-6 print:overflow-visible print:bg-white print:p-0 print:pt-4">
          {filteredShifts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 print:hidden">
                <Calendar className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-slate-700 font-bold mb-1">No shifts found</p>
              <p className="text-slate-500 text-sm">There are no records for the selected period.</p>
            </div>
          ) : (
            <div className="space-y-3 print:space-y-0">
              {/* Print Header for Table */}
              <div className="hidden print:flex items-center justify-between py-2 border-b-2 border-black font-bold text-[10px] uppercase tracking-wider text-black">
                <div className="flex items-center gap-4">
                  <div className="w-24">Date</div>
                  <div>Store & Time</div>
                </div>
                <div className="text-right">Total Hours</div>
              </div>

              {filteredShifts.map((shift, idx) => (
                <div key={idx} className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow print:border-0 print:border-b print:border-slate-200 print:rounded-none print:shadow-none print:px-0 print:py-2 print:gap-2">
                  
                  <div className="flex items-center gap-4 print:gap-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0 print:hidden">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(shift.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-lg font-extrabold text-slate-700 leading-none">{new Date(shift.date).getDate()}</span>
                    </div>
                    <div className="hidden print:block font-bold text-[11px] text-black w-24 shrink-0">
                      {new Date(shift.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 print:text-black print:text-[11px] flex items-center gap-2">
                        {shift.store_name}
                        {getStatusBadge(shift.status)}
                      </div>
                      <div className="text-xs font-medium text-slate-500 mt-1.5 flex items-center gap-2 print:mt-0.5 print:text-[10px] print:text-slate-600">
                        {shift.status !== 'ABSENT' && shift.status !== 'DAY_OFF' ? (
                          <>
                            <Clock className="w-3.5 h-3.5 print:hidden" />
                            {shift.start_time ? shift.start_time.substring(0,5) : '--:--'} - {shift.end_time ? shift.end_time.substring(0,5) : 'Present'}
                          </>
                        ) : (
                          <span className="text-slate-400">No time recorded</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right bg-slate-50 sm:bg-transparent p-2 sm:p-0 rounded-lg print:bg-transparent print:p-0">
                    {(shift.status === 'COMPLETED' || shift.status === 'IN_PROGRESS') ? (
                      <>
                        <div className="text-lg font-bold text-slate-800 print:text-[11px] print:text-black">{formatHours(shift.hours)}</div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider print:hidden">Logged</div>
                      </>
                    ) : (
                      <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1 print:text-[11px] print:text-black">--</div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      <div className={selectedStaff ? "hidden" : "space-y-6"}>
      {/* Store filter */}
      <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 pl-2">
          <Store className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter Staff By Store</span>
        </div>
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-50 rounded-lg w-full sm:w-auto">
          <button onClick={() => setStoreFilter("")}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${!storeFilter ? "bg-[#00694C] text-white shadow-md shadow-[#00694C]/20" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
            All Stores
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${!storeFilter ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"}`}>
              {allStaff.length}
            </span>
          </button>
          {stores.map(store => {
            const count = getStoreStaffCount(store.name);
            const isActive = String(store.id) === storeFilter;
            return (
              <button key={store.id} onClick={() => setStoreFilter(isActive ? "" : String(store.id))}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all cursor-pointer flex flex-col sm:flex-row items-center gap-1 sm:gap-2 ${isActive ? "bg-[#00694C] text-white shadow-md shadow-[#00694C]/20" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
                {store.name}
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Staff List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-slate-100 border-dashed">
          <Loader2 className="w-8 h-8 text-[#00694C]/50 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Loading attendance data...</p>
        </div>
      ) : staffList.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-xl border border-slate-100 border-dashed">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-lg text-slate-700 font-bold mb-1">No staff found</p>
          <p className="text-slate-500 text-sm">No staff matched the current filter.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 divide-y divide-slate-100">
            {staffList.map((staff) => (
              <div 
                key={staff.staff_id} 
                onClick={() => setSelectedStaff(staff.staff_id)}
                className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-50 border border-slate-200 shrink-0 shadow-sm">
                    {staff.photo
                      ? <img src={getPhotoUrl(staff.photo)} alt={staff.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#00694C] bg-gradient-to-br from-[#00694C]/10 to-[#00694C]/5">
                          {staff.name?.charAt(0)?.toUpperCase() || 'S'}
                        </div>}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-[15px]">{staff.name}</div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase tracking-wider text-[10px]">ID: {staff.staff_code}</span>
                      <span className="text-slate-300">•</span>
                      <span>{staff.role}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="hidden sm:block text-right">
                    <div className="text-sm font-bold text-slate-700">{staff.total_hours.toFixed(1)}h</div>
                    <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Total Time</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-[#00694C] group-hover:text-white transition-all shadow-sm">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
