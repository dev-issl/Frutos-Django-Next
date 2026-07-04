"use client";

import { useState, useRef } from "react";
import useSWR from "swr";
import api from "@/app/dashboard/_lib/api";
import { User, Phone, Lock, Save, Camera, Check, Clock, Calendar, Store as StoreIcon, TrendingUp, Loader2, BarChart2, ArrowRight, ChevronDown } from "lucide-react";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import { useStaffAuth } from "../_context/StaffAuthContext";

const STATUS_STYLE = {
  IN_PROGRESS: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  COMPLETED:   "bg-blue-50 text-blue-700 border border-blue-200",
  SCHEDULED:   "bg-amber-50 text-amber-700 border border-amber-200",
  DAY_OFF:     "bg-slate-100 text-slate-500 border border-slate-200",
  ABSENT:      "bg-red-50 text-red-600 border border-red-200",
};

function fmt(timeStr) {
  if (!timeStr) return "—";
  const [h, m] = timeStr.split(":");
  let hours = parseInt(h, 10);
  const ap = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${m} ${ap}`;
}

// Helper to format decimal hours into "Xh Ym" or "Ym"
const formatHours = (decimalHours) => {
  if (!decimalHours || decimalHours <= 0) return "—";
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

function WorkHistoryTab() {
  const [storeFilter, setStoreFilter] = useState("all");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const dateInputRef = useRef(null);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);

  const { data, isLoading } = useSWR(
    "/api/staff/me/shift-history/",
    (url) => api.get(url),
    { revalidateOnFocus: false }
  );

  const shifts = data?.shifts || [];
  const totalHours = data?.total_hours || 0;
  const totalShifts = data?.total_shifts || 0;

  // Aggregate stores
  const storeStats = {};
  shifts.forEach(s => {
    const name = s.store_name || "Unassigned";
    if (!storeStats[name]) storeStats[name] = { days: 0, hours: 0 };
    storeStats[name].days++;
    storeStats[name].hours += s.hours || 0;
  });
  const storeList = Object.entries(storeStats).sort((a, b) => b[1].hours - a[1].hours);
  const maxHours = storeList[0]?.[1]?.hours || 1;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const uniqueStores = [...new Set(shifts.map(s => s.store_name).filter(Boolean))].sort();

  const filteredShiftsList = shifts.filter(shift => {
    if (storeFilter !== 'all' && shift.store_name !== storeFilter) return false;
    if (historyFilter === 'all') return true;
    
    const shiftDate = new Date(shift.date);
    const shiftDateNormalized = new Date(shiftDate.getFullYear(), shiftDate.getMonth(), shiftDate.getDate());
    
    if (historyFilter === 'month') return shiftDate >= startOfMonth;
    if (historyFilter === 'week') return shiftDate >= startOfWeek;
    if (historyFilter === 'today') return shiftDateNormalized.getTime() === todayStart.getTime();
    if (historyFilter === 'date' && selectedDate) {
      const selected = new Date(selectedDate);
      const selectedNormalized = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate());
      return shiftDateNormalized.getTime() === selectedNormalized.getTime();
    }
    return true;
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-[#00694C] animate-spin mb-3" />
      <p className="text-slate-500 text-sm">Loading work history...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#00694C] to-[#00896A] rounded-2xl p-5 text-white">
          <div className="text-3xl font-bold mb-1">{totalHours.toFixed(1)}</div>
          <div className="text-white/70 text-xs font-semibold uppercase tracking-widest">Total Hours</div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-[#004A3A] mb-1">{totalShifts}</div>
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Total Shifts</div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-[#004A3A] mb-1">{storeList.length}</div>
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Stores Worked</div>
        </div>
      </div>

      {/* Store Breakdown Chart */}
      {storeList.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <BarChart2 className="w-4 h-4 text-[#00694C]" />
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-widest">Hours by Store</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storeList.map(([name, stat]) => (
              <div key={name} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#00694C]/5 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                
                <div className="flex items-start justify-between mb-5 relative">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00694C]/5 flex items-center justify-center text-[#00694C] border border-[#00694C]/10 shadow-sm">
                      <StoreIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm truncate max-w-[150px]" title={name}>{name}</h4>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{stat.days} Shift{stat.days !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
                
                  <div className="relative">
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-[#00694C] leading-none tracking-tight">{formatHours(stat.hours)}</span>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Total</span>
                    </div>
                  
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-[#00694C] to-[#00C98A] transition-all duration-1000 ease-out"
                      style={{ width: `${(stat.hours / maxHours) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shift List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#00694C]" />
            <h3 className="font-bold text-slate-700 text-sm">Shift History</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Store Filter */}
            {/* Custom Store Filter Dropdown */}
            {uniqueStores.length > 0 && (
              <div className="relative w-full sm:w-48 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                  className="w-full flex items-center justify-between pl-3 pr-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm outline-none focus:border-[#00694C] cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    <StoreIcon className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{storeFilter === 'all' ? 'All Stores' : storeFilter}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isStoreDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isStoreDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsStoreDropdownOpen(false)}></div>
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-100 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] py-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                      <button
                        onClick={() => { setStoreFilter('all'); setIsStoreDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${storeFilter === 'all' ? 'bg-emerald-50 text-[#00694C]' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        All Stores
                      </button>
                      {uniqueStores.map(store => (
                        <button
                          key={store}
                          onClick={() => { setStoreFilter(store); setIsStoreDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${storeFilter === store ? 'bg-emerald-50 text-[#00694C]' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          <StoreIcon className={`w-3.5 h-3.5 ${storeFilter === store ? 'text-[#00694C]' : 'text-slate-400'}`} />
                          <span className="truncate">{store}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Time Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto shrink-0 overflow-x-auto pb-1">
              <div className="flex items-center bg-slate-100 p-1 rounded-lg w-full sm:w-auto shrink-0 overflow-x-auto">
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
                <button 
                  onClick={() => setHistoryFilter('today')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${historyFilter === 'today' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >Today</button>
              </div>

              <div className="flex items-center shrink-0 relative w-full sm:w-auto">
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
          </div>
        </div>

        {filteredShiftsList.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-medium text-sm">No shift history found.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {[...filteredShiftsList].sort((a, b) => new Date(b.date) - new Date(a.date)).map((s, index) => {
              const hrs = formatHours(s.hours);
              
              return (
                <div key={s.id} className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${index !== 0 ? 'border-t border-slate-100' : ''} hover:bg-slate-50/50`}>
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
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium bg-slate-100/50 px-2.5 py-1 rounded-md border border-slate-100 w-fit">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> 
                          {fmt(s.start_time)} <ArrowRight className="w-3 h-3 text-slate-300" /> {s.end_time ? fmt(s.end_time) : <span className="text-amber-500 font-bold">In Progress</span>}
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
                      {(s.status || "").replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StaffProfileSettings({ profile, user }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(profile?.photo || null);
  const { success: successToast, error: errorToast } = useToastContext();
  const { fetchUser } = useStaffAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    const formData = new FormData(e.target);
    const password = formData.get("password");
    if (!password) formData.delete("password");
    try {
      await api.patch("/api/staff/me/profile/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setSuccess(true);
      successToast("Profile updated successfully");
      if (fetchUser) await fetchUser();
      setTimeout(() => setSuccess(false), 3000);
      e.target.reset();
    } catch (err) {
      errorToast(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setPhotoPreview(URL.createObjectURL(file));
  };

  const tabs = [
    { id: "profile", label: "Profile Settings", icon: User },
    { id: "history", label: "Work History", icon: Clock },
  ];

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">
      {/* Tab Header */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === tab.id ? "bg-white text-[#00694C] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === "history" ? (
        <WorkHistoryTab />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 md:p-6 border-b border-slate-100">
            <h2 className="font-serif text-xl font-bold text-emerald-900">Profile Settings</h2>
            <p className="text-slate-500 text-xs mt-1">Update your personal information and profile photo.</p>
          </div>
          <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-5">
            {/* Photo Section */}
            <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
              <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden shrink-0 relative group">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={24} /></div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white w-5 h-5" />
                </div>
                <input type="file" name="photo" accept="image/*" onChange={handlePhotoChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Change Photo" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 text-sm">Profile Photo</h3>
                <p className="text-xs text-slate-500 mb-1.5">Click the image to upload a new photo.</p>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">{profile?.role || "Staff Member"}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-4 w-4 text-slate-400" /></div>
                  <input name="name" defaultValue={user?.name}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm" />
                </div>
              </div>
              <div className="space-y-1.5 opacity-80">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Email (Read-Only)</label>
                <input disabled defaultValue={user?.email}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed shadow-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-4 w-4 text-slate-400" /></div>
                  <input name="phone" defaultValue={profile?.phone}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                  Change Password <span className="text-[9px] text-slate-400 normal-case tracking-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-4 w-4 text-slate-400" /></div>
                  <input name="password" type="password" placeholder="New password"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm" />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button type="submit" disabled={loading}
                className={`px-5 py-2 rounded-lg font-bold text-xs text-white flex items-center gap-2 transition-all shadow-sm ${success ? "bg-green-500" : "bg-emerald-600 hover:bg-emerald-700"} disabled:opacity-70 disabled:cursor-not-allowed`}>
                {loading ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  : success ? <Check size={14} /> : <Save size={14} />}
                {success ? "Saved!" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}


