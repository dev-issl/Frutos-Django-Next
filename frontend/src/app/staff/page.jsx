"use client";

import { useState, useEffect } from "react";
import { useStaffAuth } from "./_context/StaffAuthContext";
import useSWR from "swr";
import api from "@/app/dashboard/_lib/api";
import { Bell, Calendar, Euro, FileText, LogOut, MessageSquare, Settings, Clock, Menu, ArrowRight, Search, HelpCircle, ChevronLeft, ChevronRight, Ban, ShoppingCart, Package, Megaphone, X as XIcon, Store as StoreIcon, ClipboardCheck, MapPin, History } from "lucide-react";
import StaffOrders from "./_components/StaffOrders";
import StaffProducts from "./_components/StaffProducts";
import StaffAnnouncements from "./_components/StaffAnnouncements";
import StaffNotifications from "./_components/StaffNotifications";
import StaffRequestDayOff from "./_components/StaffRequestDayOff";
import StaffStoreInfo from "./_components/StaffStoreInfo";
import StaffProfileSettings from "./_components/StaffProfileSettings";
import StaffAttendanceView from "./_components/StaffAttendanceView";
import StaffAttendanceTab from "./_components/StaffAttendanceTab";
import StaffHistoryTab from "./_components/StaffHistoryTab";
import StaffTaskHistoryTab from "./_components/StaffTaskHistoryTab";
import StaffStoreSession from "./_components/StaffStoreSession";

export default function StaffDashboardPage() {
  const { user, logout } = useStaffAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("SETTINGS");
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [hasDismissedAttendanceModal, setHasDismissedAttendanceModal] = useState(false);
  const [selectedStoreForCheckIn, setSelectedStoreForCheckIn] = useState("");
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showStoreSwitcherModal, setShowStoreSwitcherModal] = useState(false);
  const [selectedViewStore, setSelectedViewStore] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedTaskIds, setExpandedTaskIds] = useState({});

  const { data: dashboardData, isLoading, mutate } = useSWR(
    "/api/staff/me/dashboard/",
    (url) => api.get(url),
    { refreshInterval: 3000 }
  );

  useEffect(() => {
    const handleNewAnnouncement = () => {
      // Instantly trigger an SWR re-fetch for the dashboard data (including notifications)
      mutate();
    };
    window.addEventListener("new_announcement", handleNewAnnouncement);
    return () => window.removeEventListener("new_announcement", handleNewAnnouncement);
  }, [mutate]);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { profile, shifts = [], notifications = [], tasks = [], current_active_shift, active_stores = [], has_completed_shift_today } = dashboardData || {};

  useEffect(() => {
    if (dashboardData && !isLoading) {
      if (!current_active_shift && !has_completed_shift_today && !hasDismissedAttendanceModal) {
        const timer = setTimeout(() => {
          setShowAttendanceModal(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [dashboardData, isLoading, current_active_shift, has_completed_shift_today, hasDismissedAttendanceModal]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#F1F6EB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div
              className="absolute inset-0 rounded-full border-4 animate-spin"
              style={{
                borderColor: 'rgba(0, 105, 76, 0.2)',
                borderTopColor: '#00694C',
                animationDuration: '0.75s',
              }}
            />
          </div>
          <p className="text-[#00694C] font-semibold text-sm animate-pulse">Loading portal...</p>
        </div>
      </div>
    );
  }


  const handleCheckIn = async (overrideStoreId) => {
    const storeIdToUse = overrideStoreId || selectedStoreForCheckIn;
    if (!storeIdToUse) return;
    setIsCheckingIn(true);
    try {
      await api.post("/api/staff/me/check-in/", { store_id: storeIdToUse });
      mutate();
      setShowAttendanceModal(false);
    } catch (err) {
      console.error("Check-in failed", err);
      alert(err.response?.data?.detail || "Failed to start shift");
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = () => {
    setShowCheckOutModal(true);
  };

  const confirmCheckOut = async () => {
    setIsCheckingOut(true);
    try {
      await api.post("/api/staff/me/check-out/", {});
      mutate();
      setShowCheckOutModal(false);
    } catch (err) {
      console.error("Check-out failed", err);
      alert(err.response?.data?.detail || "Failed to end shift");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await api.patch(`/api/staff/me/tasks/${taskId}/`, { status: 'COMPLETED', progress_percentage: 100 });
      mutate();
    } catch (err) {
      console.error("Failed to complete task", err);
      alert("Failed to complete task");
    }
  };

  const getWeekDates = () => {
    const today = new Date();
    
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  };

  const formatAMPM = (timeStr, dateStr = null) => {
    if (!timeStr) return '';
    if (dateStr) {
      let timeParts = timeStr.split(':');
      if (timeParts.length === 2) timeParts.push('00');
      const d = new Date(`${dateStr}T${timeParts.join(':')}Z`);
      if (!isNaN(d)) {
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      }
    }
    const [h, m] = timeStr.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours.toString().padStart(2, '0')}:${m} ${ampm}`;
  };

  const hasOrderPermissions = profile?.can_create_orders || profile?.can_update_orders || profile?.can_delete_orders;

  const sidebarMenuItems = [
    { id: "MY_SHIFTS",      name: "MY SHIFTS",       icon: Calendar,       badge: 0 },
    { id: "ORDERS",         name: "ORDER LINE",      icon: ShoppingCart,   badge: 0 },
    { id: "PRODUCTS",       name: "PRODUCTS",        icon: Package,        badge: 0 },
    { id: "NOTIFICATIONS",  name: "NOTIFICATIONS",   icon: Bell,           badge: notifications?.filter(n => !n.is_read).length || 0 },
    { id: "REQUEST_DAY_OFF",name: "REQUEST DAY OFF", icon: FileText,       badge: 0 },
    { id: "ANNOUNCEMENTS",  name: "ANNOUNCEMENTS",   icon: Megaphone,      badge: 0 },
    { id: "ATTENDANCE",     name: "ATTENDANCE",      icon: ClipboardCheck, badge: 0 },
    { id: "TASK_HISTORY",   name: "TASKS",           icon: ClipboardCheck, badge: 0 },
    { id: "HISTORY",        name: "WORK HISTORY",    icon: History,        badge: 0 },
    // Dynamic store tab — appears only when a store is selected
    ...(selectedViewStore ? [
      { id: "STORE_SESSION", name: selectedViewStore.name.toUpperCase(), icon: StoreIcon, badge: 0, isStore: true }
    ] : []),
    { id: "SETTINGS",       name: "PROFILE SETTINGS",icon: Settings,       badge: 0 },
  ];

  const staffActions = [
    { title: "Request Shift Change", desc: "Swap with a colleague or adjust hours", icon: Calendar, tab: "REQUEST_DAY_OFF" },
    { title: "Apply for Extra Day Off", desc: "Submit personal or vacation requests", icon: FileText, tab: "REQUEST_DAY_OFF" },
    { title: "View Digital Price List", desc: "Check current SKU pricing & offers", icon: Euro, tab: "PRODUCTS" },
  ];

  const weekDatesLocal = getWeekDates().map(d => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const defaultShift = {
    start_time: '09:00:00',
    end_time: '17:00:00',
    break_start: '13:00:00',
    break_end: '13:30:00'
  };

  const totalHours = weekDatesLocal.reduce((acc, dateStr) => {
    const shift = shifts?.find(s => s.date === dateStr);

    if (shift && shift.status === 'DAY_OFF') {
      return acc;
    }

    const d = new Date(dateStr);
    if (d.getDay() === 5) { // Friday
      return acc;
    }
    
    const effectiveShift = shift || defaultShift;
    
    if (effectiveShift.start_time && effectiveShift.end_time) {
      const start = new Date(`2000-01-01T${effectiveShift.start_time}`);
      const end = new Date(`2000-01-01T${effectiveShift.end_time}`);
      let diff = (end - start) / (1000 * 60 * 60);
      
      if (effectiveShift.break_start && effectiveShift.break_end) {
        const bStart = new Date(`2000-01-01T${effectiveShift.break_start}`);
        const bEnd = new Date(`2000-01-01T${effectiveShift.break_end}`);
        const bDiff = (bEnd - bStart) / (1000 * 60 * 60);
        if (bDiff > 0) diff -= bDiff;
      }
      return acc + (diff > 0 ? diff : 0);
    }
    return acc;
  }, 0) || 0;

  const getWeekLabel = () => {
    const weekDays = getWeekDates();
    const start = weekDays[0];
    const end = weekDays[6];
    const startStr = start.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const endStr = end.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    return `Week of ${startStr} – ${endStr}`;
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "NEW";
    const diffMs = new Date() - new Date(dateString);
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHrs < 1) return "JUST NOW";
    if (diffHrs < 24) return `${diffHrs}H AGO`;
    return `${Math.floor(diffHrs/24)}D AGO`;
  };

  return (
    <div className="min-h-screen bg-[#F1F6EB] flex font-sans text-slate-800 selection:bg-[#00694C] selection:text-white">
      
      {/* Mobile Header & Menu Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <Menu className="w-6 h-6 text-[#00694C]" onClick={() => setMobileMenuOpen(true)} />
          <span className="font-serif font-bold text-xl text-[#00694C]">El Árbol</span>
        </div>
        <div className="flex items-center gap-3">
          {current_active_shift && (
            <button onClick={handleCheckOut} disabled={isCheckingOut} className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-full font-bold shadow-sm transition-colors cursor-pointer">
              {isCheckingOut ? "Ending..." : "End Shift"}
            </button>
          )}
          <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer">
            <LogOut className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-[#00694C] rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
            {profile?.photo ? (
              <img src={profile.photo} alt={user?.name || "Staff"} className="w-full h-full object-cover" />
            ) : (
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || 'S')}&background=004238&color=fff&size=128&bold=true`} alt="Default Photo" className="w-full h-full object-cover" />
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-50" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 h-full bg-[#00694C] text-white p-6 flex flex-col" onClick={e => e.stopPropagation()}>
             <div className="p-6 pb-2">
              <h2 className="font-serif font-bold text-xl tracking-tight mb-5">El Árbol Staff</h2>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#004238] flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                  {profile?.photo ? (
                    <img src={profile.photo} alt={user?.name || "Staff"} className="w-full h-full object-cover" />
                  ) : (
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || 'S')}&background=00694C&color=fff&size=128&bold=true`} alt="Default Photo" className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-sm leading-tight mb-0.5">{user?.name || user?.email}</div>
                  <div className="text-[10px] text-white/50 uppercase tracking-widest font-medium">{profile?.role || 'SALES ASSOCIATE'}</div>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto min-h-0 py-2 db-scroll">
              {sidebarMenuItems.map((item, i) => {
                const isActive = activeTab === item.id;
                return (
                  <div key={i}>
                    {item.isStore && (
                      <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Store Session</span>
                        <div className="flex-1 h-px bg-white/10" />
                      </div>
                    )}
                    <button
                      onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                      className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer overflow-hidden group ${
                        isActive
                          ? 'text-white shadow-md'
                          : item.isStore
                            ? 'text-amber-200/80 hover:bg-white/5 hover:text-amber-100'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <div className={`absolute inset-0 border-l-4 ${item.isStore ? 'bg-gradient-to-r from-amber-700/40 to-amber-600/30 border-amber-300/80' : 'bg-gradient-to-r from-[#008A65] to-[#007A63] border-white/80'}`} />
                      )}
                      {isActive && (
                        <div className="absolute inset-0 w-full h-full bg-white/10 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out" />
                      )}
                      <item.icon className={`relative z-10 w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-sm' : 'group-hover:scale-110'} ${item.isStore ? 'text-amber-300' : isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
                      <span className="relative z-10 flex-1 text-left drop-shadow-sm truncate">{item.name}</span>
                      {item.isStore && <span className="relative z-10 w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />}
                      {!item.isStore && item.badge > 0 && <span className="relative z-10 bg-[#E88C30] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">{item.badge}</span>}
                    </button>
                  </div>
                );
              })}

            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#00694C] text-white flex-col h-screen sticky top-0 shrink-0 shadow-2xl">
        <div className="p-6 pb-2">
          <h2 className="font-serif font-bold text-xl tracking-tight mb-5">El Árbol Staff</h2>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#004238] flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
              {profile?.photo ? (
                <img src={profile.photo} alt={user?.name || "Staff"} className="w-full h-full object-cover" />
              ) : (
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || 'S')}&background=00694C&color=fff&size=128&bold=true`} alt="Default Photo" className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <div className="font-semibold text-sm leading-tight mb-0.5">{user?.name || user?.email}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-widest font-medium">{profile?.role || 'SALES ASSOCIATE'}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto min-h-0 py-2 staff-sidebar-scroll">
          {sidebarMenuItems.map((item, i) => {
            const isActive = activeTab === item.id;
            return (
              <div key={i}>
                {/* Separator before dynamic store tab */}
                {item.isStore && (
                  <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Store Session</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                )}
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer overflow-hidden group ${
                    isActive
                      ? 'text-white shadow-md'
                      : item.isStore
                        ? 'text-amber-200/80 hover:bg-white/5 hover:text-amber-100'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <div className={`absolute inset-0 border-l-4 ${item.isStore ? 'bg-gradient-to-r from-amber-700/40 to-amber-600/30 border-amber-300/80' : 'bg-gradient-to-r from-[#008A65] to-[#007A63] border-white/80'}`} />
                  )}
                  {isActive && (
                    <div className="absolute inset-0 w-full h-full bg-white/10 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out" />
                  )}
                  <item.icon className={`relative z-10 w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-sm' : 'group-hover:scale-110'} ${item.isStore ? 'text-amber-300' : isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
                  <span className="relative z-10 flex-1 text-left drop-shadow-sm truncate">{item.name}</span>
                  {item.isStore && (
                    <span className="relative z-10 w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  )}
                  {!item.isStore && item.badge > 0 && (
                    <span className="relative z-10 bg-[#E88C30] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">{item.badge}</span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>

      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 pt-20 md:pt-10 overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto">
          
          <header className="flex justify-between items-center mb-10 hidden md:flex">
            <div className="flex items-center gap-3 text-sm font-semibold flex-wrap">
              <span className="italic font-serif text-[#00694C] text-lg">El Árbol</span>
              {current_active_shift && current_active_shift.store_name && (
                <>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500 font-medium">{current_active_shift.store_name}</span>
                </>
              )}
              {/* Live clock chip */}
              <div className="flex items-center gap-1.5 bg-[#00694C]/8 border border-[#00694C]/15 text-[#00694C] px-3 py-1 rounded-full">
                <Clock className="w-3 h-3" />
                <span className="text-[11px] font-bold tabular-nums">
                  {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
              {/* Active shift store indicator */}
              {current_active_shift && (
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wide">Active Shift</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
               {/* Attendance button */}
               {!current_active_shift && (
                 <button
                   onClick={() => { setShowAttendanceModal(true); }}
                   className="flex items-center gap-2 px-4 py-2 rounded-full text-[#00694C] bg-[#E4EFDA] hover:bg-[#D9EFE5] font-bold text-xs transition-all cursor-pointer border border-[#BCE4D3]"
                 >
                   <ClipboardCheck className="w-3.5 h-3.5" />
                   Attendance
                 </button>
               )}

               <button className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-white transition-colors cursor-pointer">
                 <HelpCircle className="w-5 h-5" />
               </button>
               {current_active_shift && (
                 <button 
                   onClick={handleCheckOut}
                   disabled={isCheckingOut}
                   className="flex items-center gap-2 px-4 py-2 rounded-full text-white bg-red-600 font-semibold hover:bg-red-700 transition-all cursor-pointer shadow-sm text-sm"
                 >
                   {isCheckingOut ? "Leaving..." : "Leave"}
                 </button>
               )}
               <button 
                 onClick={logout} 
                 className="flex items-center gap-2 px-4 py-2 rounded-full text-slate-500 font-semibold hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all cursor-pointer group"
               >
                 <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Logout
               </button>
            </div>
          </header>

          {activeTab === "ATTENDANCE" ? (
            <StaffAttendanceTab
              profile={profile}
              shifts={shifts}
              currentActiveShift={current_active_shift}
              active_stores={active_stores}
              onSelectStore={(store) => {
                setSelectedViewStore(store);
                setSessionStartTime(Date.now());
                setActiveTab("STORE_SESSION");
              }}
            />
          ) : activeTab === "TASK_HISTORY" ? (
            <StaffTaskHistoryTab />
          ) : activeTab === "HISTORY" ? (
            <StaffHistoryTab shifts={shifts} />
          ) : activeTab === "STORE_SESSION" && selectedViewStore ? (
            <StaffStoreSession
              store={selectedViewStore}
              profile={profile}
              currentActiveShift={current_active_shift}
              sessionStartTime={sessionStartTime}
              onBack={() => {
                setSelectedViewStore(null);
                setSessionStartTime(null);
                setActiveTab("ATTENDANCE");
              }}
              onCheckIn={handleCheckIn}
              isCheckingIn={isCheckingIn}
            />
          ) : activeTab === "ORDERS" ? (
            <StaffOrders profile={profile} />
          ) : activeTab === "PRODUCTS" ? (
            <StaffProducts profile={profile} />
          ) : activeTab === "ANNOUNCEMENTS" ? (
            <StaffAnnouncements />
          ) : activeTab === "NOTIFICATIONS" ? (
            <StaffNotifications notifications={notifications} mutate={mutate} setActiveTab={setActiveTab} />
          ) : activeTab === "MY_SHIFTS" ? (
            <>
              <div className="flex justify-between items-end mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-4xl font-serif text-[#004A3A] font-medium tracking-tight">My Shifts</h1>
                    <span className="bg-[#BCE4D3] text-[#00694C] text-xs font-bold px-2.5 py-1 rounded-full mt-1">{totalHours > 0 ? `${totalHours.toFixed(1)} hours` : '0 hours'}</span>
                  </div>
                  <p className="text-slate-500 text-[13px] italic font-serif">{getWeekLabel()}</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-[#004A3A] bg-[#E4EFDA] px-4 py-2.5 rounded-full shadow-sm cursor-pointer hover:bg-[#dbe7d0] transition-colors">
                   <ChevronLeft className="w-4 h-4" />
                   <span className="tracking-widest">THIS WEEK</span>
                   <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Shifts Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-12 pt-6">
                {getWeekDates().map((dateObj, i) => {
                  const today = new Date();
                  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                  
                  const yyyy = dateObj.getFullYear();
                  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                  const dd = String(dateObj.getDate()).padStart(2, '0');
                  const localDateStr = `${yyyy}-${mm}-${dd}`;
                  const isToday = localDateStr === todayStr;
                  
                  const shift = shifts?.find(s => s.date === localDateStr);
                  
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                  const dayNum = dateObj.toLocaleDateString('en-US', { day: '2-digit' });

                  const isFriday = dateObj.getDay() === 5;
                  const isOff = isFriday || shift?.status === 'DAY_OFF';
                  const isAbsent = !isFriday && shift?.status === 'ABSENT';

                  if (isOff || isAbsent) {
                    return (
                      <div key={i} className={`relative transition-all ${isToday ? 'scale-[1.02]' : ''}`}>
                        {isToday && (
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-10 w-full text-center">
                            <span className="px-3 py-1 bg-[#00694C] text-white text-[9px] font-bold tracking-widest rounded-full uppercase shadow-sm">Today</span>
                          </div>
                        )}
                        <div className={`bg-white border rounded-xl p-4 flex flex-col h-48 h-full ${isToday ? 'border-2 border-[#00694C] shadow-md' : 'border-slate-100 shadow-sm'}`}>
                          <div className="flex justify-between items-start mb-3">
                             <div>
                               <div className="flex items-center gap-1.5 mb-1">
                                 <div className={`text-[11px] font-bold ${isToday ? 'text-[#00694C]' : 'text-slate-400'}`}>
                                   {dayName}
                                 </div>
                               </div>
                               <div className={`text-2xl font-bold leading-none ${isToday ? 'text-[#00694C]' : 'text-slate-400'}`}>{dayNum}</div>
                             </div>
                          </div>
                          <div className="flex-1 flex flex-col items-center justify-center gap-2 mt-2">
                             <Ban className={`w-8 h-8 ${isToday ? 'text-[#00694C]/40' : 'text-slate-200'}`} strokeWidth={1} />
                             <span className={`text-[13px] font-serif italic ${isToday ? 'text-[#00694C]/70' : 'text-slate-400'}`}>{isOff ? 'Day Off' : 'Absent'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const effectiveShift = shift || defaultShift;
                  
                  const start = new Date(`2000-01-01T${effectiveShift.start_time}`);
                  const end = new Date(`2000-01-01T${effectiveShift.end_time}`);
                  let diff = (end - start) / (1000 * 60 * 60);
                  
                  if (effectiveShift.break_start && effectiveShift.break_end) {
                    const bStart = new Date(`2000-01-01T${effectiveShift.break_start}`);
                    const bEnd = new Date(`2000-01-01T${effectiveShift.break_end}`);
                    const bDiff = (bEnd - bStart) / (1000 * 60 * 60);
                    if (bDiff > 0) diff -= bDiff;
                  }
                  
                  const hrs = diff > 0 ? diff.toFixed(1) : 0;
                  
                  return (
                    <div key={i} className={`relative transition-all ${isToday ? 'scale-[1.02]' : ''}`}>
                      {isToday && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-10 w-full text-center">
                          <span className="px-3 py-1 bg-[#00694C] text-white text-[9px] font-bold tracking-widest rounded-full uppercase shadow-sm">Today</span>
                        </div>
                      )}
                      <div className={`bg-[#D9EFE5] rounded-xl p-4 flex flex-col h-48 h-full ${isToday ? 'ring-2 ring-[#00694C] shadow-md' : ''}`}>
                        <div className="flex justify-between items-start mb-3">
                           <div>
                             <div className="flex items-center gap-1.5 mb-1">
                               <div className="text-[11px] font-bold text-[#00694C]/60">
                                 {dayName}
                               </div>
                             </div>
                             <div className="text-2xl font-bold text-[#00694C] leading-none">{dayNum}</div>
                           </div>
                           <span className="bg-[#C3E4D4] text-[#00694C] text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">{hrs}h</span>
                        </div>
                        <div className="text-[11px] text-[#00694C]/70 font-semibold leading-[1.3] mb-3">{profile?.store_name || 'Unassigned Store'}</div>
                        <div className="text-[13px] font-bold text-[#009b72] leading-tight mb-1">
                          {formatAMPM(effectiveShift.start_time, localDateStr)} -<br/>{formatAMPM(effectiveShift.end_time, localDateStr)}
                        </div>
                        
                        {effectiveShift.break_start && effectiveShift.break_end && (
                          <div className="mt-auto pt-3 border-t border-[#00694C]/10 text-[9px] font-bold text-[#00694C]/50 uppercase tracking-wide">
                            Break: {formatAMPM(effectiveShift.break_start, localDateStr)} - {formatAMPM(effectiveShift.break_end, localDateStr)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* My Tasks */}
              <div className="mb-12">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h2 className="text-xl font-serif text-[#004A3A] font-medium tracking-tight">My Tasks</h2>
                    <p className="text-xs text-slate-500 mt-1">Showing latest 3 tasks</p>
                  </div>
                  {tasks?.length > 3 && (
                    <button 
                      onClick={() => setActiveTab('TASK_HISTORY')}
                      className="text-xs font-bold text-[#00694C] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      View All <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                  {tasks?.length > 0 ? tasks.slice(0, 3).map((task, i) => (
                    <div key={task.id || i} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-[#004A3A] leading-tight pr-2">{task.title}</h3>
                          <div className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                            Assigned: {new Date(task.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </div>
                          {task.status === 'COMPLETED' && task.completed_at && (
                            <div className="text-[9px] text-[#009b72] mt-0.5 uppercase tracking-wider font-semibold">
                              Completed: {new Date(task.completed_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${task.status === 'COMPLETED' ? 'bg-[#D9EFE5] text-[#00694C]' : task.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                          {task.status?.replace('_', ' ')}
                        </span>
                      </div>
                      {task.description && (
                        <div className="mb-4 flex-1">
                          <p className={`text-xs text-slate-500 font-medium ${expandedTaskIds[task.id || i] ? '' : 'line-clamp-3'}`}>
                            {task.description}
                          </p>
                          {task.description.length > 120 && (
                            <button
                              onClick={() => setExpandedTaskIds(prev => ({ ...prev, [task.id || i]: !prev[task.id || i] }))}
                              className="text-[10px] font-bold text-[#00694C] hover:opacity-80 mt-1.5 focus:outline-none flex items-center gap-1 cursor-pointer transition-opacity"
                            >
                              {expandedTaskIds[task.id || i] ? 'Show Less' : 'Read More'}
                            </button>
                          )}
                        </div>
                      )}
                      <div className="mt-auto pt-3">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 tracking-wider">
                          <span>PROGRESS</span>
                          <span className={task.progress_percentage === 100 ? 'text-[#00694C]' : ''}>{task.progress_percentage || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-3">
                          <div className={`h-1.5 rounded-full ${task.progress_percentage === 100 ? 'bg-[#009b72]' : 'bg-[#E88C30]'}`} style={{ width: `${task.progress_percentage || 0}%` }}></div>
                        </div>
                        {task.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleCompleteTask(task.id)}
                            className="w-full py-2 mt-2 bg-[#00694C] hover:bg-[#004A3A] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer uppercase tracking-wider shadow-sm"
                          >
                            Mark as Complete
                          </button>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full bg-white rounded-xl p-6 text-center text-slate-500 shadow-sm text-sm">
                      No tasks assigned for today.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
                {/* Recent Notifications */}
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-serif text-[#004A3A] font-medium tracking-tight">Recent Notifications</h2>
                    <button onClick={() => setActiveTab('NOTIFICATIONS')} className="text-[10px] font-bold text-[#00694C] uppercase tracking-widest hover:text-[#004A3A] transition-colors cursor-pointer">View All</button>
                  </div>
                  <div className="space-y-3">
                    {notifications?.length > 0 ? notifications.slice(0, 5).map((n, i) => (
                      <div key={n.id || i} className="bg-white rounded-xl p-5 shadow-sm flex gap-4 hover:shadow-md transition-shadow relative group">
                         <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-[#009b72]' : 'bg-transparent'}`}></div>
                         <div className="flex-1">
                           <div className="flex justify-between items-start mb-1">
                             <h4 className="text-sm font-semibold text-[#004A3A] pr-4 leading-snug">{n.title}</h4>
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mt-0.5">{formatTimeAgo(n.created_at)}</span>
                           </div>
                           <p className="text-xs text-slate-500 font-medium pr-6">{n.message || n.msg}</p>
                         </div>
                         <button 
                           onClick={async (e) => {
                             e.stopPropagation();
                             try {
                               await api.delete(`/api/staff/me/notifications/${n.id}/`);
                               mutate(prev => ({
                                 ...prev,
                                 notifications: prev.notifications.filter(notif => notif.id !== n.id)
                               }), false);
                             } catch (err) {
                               console.error(err);
                             }
                           }}
                           className="absolute top-4 right-3 text-slate-300 hover:text-red-500 hover:bg-red-50 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                           title="Remove notification"
                         >
                           <XIcon className="w-4 h-4" />
                         </button>
                      </div>
                    )) : (
                      <div className="text-sm text-slate-500 p-4 bg-white rounded-xl shadow-sm border border-slate-100">No new notifications.</div>
                    )}
                  </div>
                </div>

                {/* Staff Actions */}
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-serif text-[#004A3A] font-medium tracking-tight">Staff Actions</h2>
                  </div>
                  <div className="space-y-3">
                    {staffActions.map((action, i) => (
                      <button key={i} onClick={() => { if(action.tab) setActiveTab(action.tab); }} className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 text-left hover:shadow-md transition-all group border border-transparent hover:border-[#00694C]/10 cursor-pointer">
                         <div className="w-11 h-11 rounded-full bg-[#F1F6EB] flex items-center justify-center shrink-0 group-hover:bg-[#E4EFDA] transition-colors">
                            <action.icon className="w-5 h-5 text-[#00694C]" />
                         </div>
                         <div className="flex-1">
                            <div className="font-semibold text-sm text-[#004A3A] mb-0.5">{action.title}</div>
                            <div className="text-xs text-slate-500 font-serif italic">{action.desc}</div>
                         </div>
                         <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-[#00694C] transition-colors transform group-hover:translate-x-1" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === "REQUEST_DAY_OFF" ? (
            <StaffRequestDayOff />
          ) : activeTab === "SETTINGS" ? (
            <StaffProfileSettings profile={profile} user={user} />
          ) : (
            <div className="bg-white rounded-xl p-8 text-center text-slate-500 shadow-sm mt-10">
              <h2 className="text-2xl font-serif text-[#004A3A] mb-2">Coming Soon</h2>
              <p>This section is currently under development.</p>
            </div>
          )}

          <div className="pb-10"></div>
        </div>
      </main>

      {/* Store Switcher Modal (from navbar Attendance button) */}
      {showStoreSwitcherModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowStoreSwitcherModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#00694C] to-[#00896A] p-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <ClipboardCheck className="w-6 h-6 text-white/90" />
                  <h2 className="text-xl font-serif font-bold text-white">Attendance — Select Store</h2>
                </div>
                <p className="text-[#BCE4D3] text-xs">Choose a store to view its products, orders, and details</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 bg-white/15 border border-white/20 px-3 py-2 rounded-xl">
                  <Clock className="w-4 h-4 text-white/80" />
                  <span className="text-white font-bold text-sm tabular-nums">
                    {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>
                {current_active_shift && (
                  <div className="flex items-center gap-1.5 text-[#BCE4D3] text-[10px] font-bold mt-1.5 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    Currently working at this store
                  </div>
                )}
              </div>
            </div>

            {/* Store Grid */}
            <div className="p-6 max-h-[70vh] overflow-y-auto db-scroll">
              {!active_stores?.length ? (
                <div className="py-8 text-center">
                  <StoreIcon className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">No active stores found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {active_stores.map((store) => {
                    const isMyShiftStore = String(current_active_shift?.store) === String(store.id) ||
                      current_active_shift?.store_name === store.name;
                    return (
                      <button
                        key={store.id}
                        onClick={() => {
                          setSelectedViewStore(store);
                          setSessionStartTime(Date.now());
                          setActiveTab("STORE_SESSION");
                          setShowStoreSwitcherModal(false);
                        }}
                        className="group flex items-center gap-4 bg-slate-50 hover:bg-[#F1F6EB] border border-slate-200 hover:border-[#00694C]/30 rounded-xl p-4 text-left transition-all cursor-pointer"
                      >
                        <div className="w-11 h-11 rounded-lg bg-white flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden">
                          {store.image ? (
                            <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
                          ) : (
                            <StoreIcon className="w-5 h-5 text-[#00694C]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#004A3A] text-sm truncate group-hover:text-[#00694C] transition-colors">{store.name}</span>
                            {isMyShiftStore && (
                              <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                Active
                              </span>
                            )}
                          </div>
                          {store.address && (
                            <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{store.address}</span>
                            </div>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#00694C] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowStoreSwitcherModal(false)}
                className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-700" onClick={() => { setShowAttendanceModal(false); setHasDismissedAttendanceModal(true); }}>
          <div className="bg-white rounded-2xl w-[90%] max-w-xs md:max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-700 ease-out" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#00694C] pt-5 pb-4 px-4 text-white text-center relative">
              <div className="h-12 w-32 md:h-14 md:w-36 mx-auto mb-2.5 flex items-center justify-center">
                <img src="/el-erbol-logo.png" alt="El Árbol Logo" className="w-full h-full object-contain brightness-0 invert" style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              <h2 className="text-base md:text-lg font-serif font-bold mb-0.5">Start Your Shift</h2>
              <p className="text-[#BCE4D3] text-[11px] md:text-xs">Please select your store for today.</p>
            </div>
            <div className="p-3.5">
              <div className="mb-2">
                <label className="block text-[11px] font-bold text-[#004A3A] mb-1.5 uppercase tracking-wide">Select Store</label>
                <div className="max-h-[35vh] md:max-h-48 overflow-y-auto pr-1.5 space-y-1.5 db-scroll">
                  {active_stores?.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-xl">No active stores available.</div>
                  ) : (
                    active_stores?.map(store => {
                      const isStoreCurrentlyOpen = (openStr, closeStr) => {
                        if (!openStr || !closeStr) return false;
                        const now = new Date();
                        const [oH, oM] = openStr.split(':').map(Number);
                        const openTime = new Date(); openTime.setHours(oH, oM, 0, 0);
                        const [cH, cM] = closeStr.split(':').map(Number);
                        const closeTime = new Date(); closeTime.setHours(cH, cM, 0, 0);
                        if (closeTime < openTime) {
                          return now >= openTime || now <= closeTime;
                        } else {
                          return now >= openTime && now <= closeTime;
                        }
                      };
                      const formatTime12h = (timeStr) => {
                        if (!timeStr) return '';
                        const [h, m] = timeStr.split(':');
                        let hours = parseInt(h, 10);
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        hours = hours % 12;
                        hours = hours ? hours : 12;
                        return `${hours.toString().padStart(2, '0')}:${m} ${ampm}`;
                      };
                      const isOpen = isStoreCurrentlyOpen(store.openTime, store.closeTime);
                      return (
                        <div
                          key={store.id} 
                          onClick={() => setSelectedStoreForCheckIn(store.id)}
                          className={`flex items-center justify-between p-2 rounded-xl border-2 cursor-pointer transition-all ${selectedStoreForCheckIn === store.id ? 'border-[#00694C] bg-emerald-50' : 'border-slate-100 bg-white hover:border-[#00694C]/30 hover:bg-slate-50'}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                              {store.image ? (
                                <img src={store.image} alt={store.name} className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <StoreIcon className="w-5 h-5 text-[#00694C]" />
                              )}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-xs md:text-sm font-bold text-slate-800 leading-tight truncate">{store.name}</span>
                              <span className="text-[9px] md:text-[10px] text-slate-500 truncate max-w-[100px] md:max-w-[130px]">{store.address}</span>
                              <div className="text-[9px] md:text-[10px] text-slate-400 font-medium">
                                {formatTime12h(store.openTime)} — {formatTime12h(store.closeTime)}
                              </div>
                            </div>
                          </div>
                          {isOpen ? (
                            <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">Open</span>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">Closed</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <button 
                onClick={handleCheckIn}
                disabled={!selectedStoreForCheckIn || isCheckingIn}
                className="w-full mt-3 bg-[#00694C] hover:bg-[#005940] disabled:bg-slate-200 text-white font-bold py-2.5 text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCheckingIn ? "Starting..." : "Start Shift Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check Out Confirmation Modal */}
      {showCheckOutModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowCheckOutModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center pt-8">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-red-100 shadow-sm">
                <LogOut className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-xl font-serif font-bold text-[#004A3A] mb-2">End Your Shift?</h2>
              <p className="text-sm text-slate-500 mb-8 font-medium">Are you sure you want to clock out for today? This will record your final checkout time.</p>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowCheckOutModal(false)}
                  disabled={isCheckingOut}
                  className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCheckOut}
                  disabled={isCheckingOut}
                  className="flex-1 py-2.5 rounded-xl bg-[#00694C] text-white font-bold text-sm hover:bg-[#00523b] transition-all shadow-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCheckingOut ? "Ending..." : "End Shift"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
