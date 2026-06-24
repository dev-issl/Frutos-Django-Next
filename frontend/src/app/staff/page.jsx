"use client";

import { useState } from "react";
import { useStaffAuth } from "./_context/StaffAuthContext";
import useSWR from "swr";
import api from "@/app/dashboard/_lib/api";
import { Bell, Calendar, Euro, FileText, LogOut, MessageSquare, Settings, Clock, Menu, ArrowRight, Search, HelpCircle, ChevronLeft, ChevronRight, Ban, ShoppingCart, Package } from "lucide-react";
import StaffOrders from "./_components/StaffOrders";
import StaffProducts from "./_components/StaffProducts";

export default function StaffDashboardPage() {
  const { user, logout } = useStaffAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("MY_SHIFTS");

  const { data: dashboardData, isLoading } = useSWR(
    "/api/staff/me/dashboard/",
    (url) => api.get(url),
    { refreshInterval: 3000 }
  );

  if (isLoading || !user) {
    return <div className="min-h-screen bg-[#F1F6EB] flex items-center justify-center text-[#00694C] font-semibold">Loading...</div>;
  }

  const { profile, shifts = [], notifications = [], tasks = [] } = dashboardData || {};

  const getWeekDates = () => {
    const today = new Date();
    
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  };

  const formatAMPM = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours.toString().padStart(2, '0')}:${m} ${ampm}`;
  };

  const hasOrderPermissions = profile?.can_create_orders || profile?.can_update_orders || profile?.can_delete_orders;

  const sidebarMenuItems = [
    { id: "MY_SHIFTS", name: "MY SHIFTS", icon: Calendar, badge: 0 },
    ...(hasOrderPermissions ? [
      { id: "ORDERS", name: "ORDER LINE", icon: ShoppingCart, badge: 0 },
      { id: "PRODUCTS", name: "PRODUCTS", icon: Package, badge: 0 }
    ] : []),
    { id: "NOTIFICATIONS", name: "NOTIFICATIONS", icon: Bell, badge: notifications?.length || 0 },
    { id: "PRICE_LIST", name: "PRICE LIST", icon: Euro, badge: 0 },
    { id: "REQUEST_DAY_OFF", name: "REQUEST DAY OFF", icon: FileText, badge: 0 },
    { id: "MESSAGES", name: "MESSAGES", icon: MessageSquare, badge: 0 },
  ];

  const staffActions = [
    { title: "Request Shift Change", desc: "Swap with a colleague or adjust hours", icon: Calendar },
    { title: "Apply for Extra Day Off", desc: "Submit personal or vacation requests", icon: FileText },
    { title: "View Digital Price List", desc: "Check current SKU pricing & offers", icon: Euro },
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
              <h2 className="font-serif font-bold text-xl tracking-tight mb-8">El Árbol Staff</h2>
              
              <div className="flex items-center gap-3 mb-10">
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
                  <button 
                    key={i} 
                    onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                    className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer overflow-hidden group ${
                      isActive 
                        ? 'text-white shadow-md' 
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-[#008A65] to-[#007A63] border-l-4 border-white/80" />
                    )}
                    {isActive && (
                      <div className="absolute inset-0 w-full h-full bg-white/10 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out" />
                    )}
                    <item.icon className={`relative z-10 w-4 h-4 transition-transform duration-300 ${isActive ? 'text-white scale-110 drop-shadow-sm' : 'text-white/60 group-hover:scale-110 group-hover:text-white'}`} />
                    <span className="relative z-10 flex-1 text-left drop-shadow-sm">{item.name}</span>
                    {item.badge > 0 && <span className="relative z-10 bg-[#E88C30] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">{item.badge}</span>}
                  </button>
                );
              })}
            </nav>

            <div className="p-4 mt-auto">
              <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#009b72] to-[#008A65] hover:from-[#008A65] hover:to-[#007A5A] text-white py-3 rounded-xl font-semibold text-sm transition-all duration-300 mb-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
                <Clock className="w-4 h-4" /> Clock In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#00694C] text-white flex-col h-screen sticky top-0 shrink-0 shadow-2xl">
        <div className="p-6 pb-2">
          <h2 className="font-serif font-bold text-xl tracking-tight mb-8">El Árbol Staff</h2>
          
          <div className="flex items-center gap-3 mb-10">
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
              <button 
                key={i} 
                onClick={() => setActiveTab(item.id)}
                className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer overflow-hidden group ${
                  isActive 
                    ? 'text-white shadow-md' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#008A65] to-[#007A63] border-l-4 border-white/80" />
                )}
                {isActive && (
                  <div className="absolute inset-0 w-full h-full bg-white/10 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out" />
                )}
                <item.icon className={`relative z-10 w-4 h-4 transition-transform duration-300 ${isActive ? 'text-white scale-110 drop-shadow-sm' : 'text-white/60 group-hover:scale-110 group-hover:text-white'}`} />
                <span className="relative z-10 flex-1 text-left drop-shadow-sm">{item.name}</span>
                {item.badge > 0 && <span className="relative z-10 bg-[#E88C30] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">{item.badge}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#009b72] to-[#008A65] hover:from-[#008A65] hover:to-[#007A5A] text-white py-3 rounded-xl font-semibold text-sm transition-all duration-300 mb-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
            <Clock className="w-4 h-4" /> Clock In
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 pt-20 md:pt-10 overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto">
          
          <header className="flex justify-between items-center mb-10 hidden md:flex">
            <div className="flex items-center gap-3 text-sm font-semibold">
              <span className="italic font-serif text-[#00694C] text-lg">El Árbol</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-medium">{profile?.store_name || "Unassigned Store"}</span>
            </div>
            <div className="flex items-center gap-4">
               {/* Search bar */}
               <div className="relative">
                 <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input type="text" placeholder="Search resources..." className="pl-11 pr-4 py-2.5 rounded-full border border-white/50 bg-white/80 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#00694C]/20 shadow-sm w-64 transition-all" />
               </div>
               <button className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-white transition-colors cursor-pointer">
                 <HelpCircle className="w-5 h-5" />
               </button>
               <button 
                 onClick={logout} 
                 className="flex items-center gap-2 px-4 py-2 rounded-full text-slate-500 font-semibold hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all cursor-pointer group"
               >
                 <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Logout
               </button>
            </div>
          </header>

          {activeTab === "ORDERS" ? (
            <StaffOrders profile={profile} />
          ) : activeTab === "PRODUCTS" ? (
            <StaffProducts profile={profile} />
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

                  const isOff = shift?.status === 'DAY_OFF';
                  const isAbsent = shift?.status === 'ABSENT';

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
                          {formatAMPM(effectiveShift.start_time)} -<br/>{formatAMPM(effectiveShift.end_time)}
                        </div>
                        
                        {effectiveShift.break_start && effectiveShift.break_end && (
                          <div className="mt-auto pt-3 border-t border-[#00694C]/10 text-[9px] font-bold text-[#00694C]/50 uppercase tracking-wide">
                            Break: {formatAMPM(effectiveShift.break_start)} - {formatAMPM(effectiveShift.break_end)}
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
                  <h2 className="text-xl font-serif text-[#004A3A] font-medium tracking-tight">My Tasks</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasks?.length > 0 ? tasks.map((task, i) => (
                    <div key={task.id || i} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-[#004A3A] leading-tight pr-2">{task.title}</h3>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${task.status === 'COMPLETED' ? 'bg-[#D9EFE5] text-[#00694C]' : task.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                          {task.status?.replace('_', ' ')}
                        </span>
                      </div>
                      {task.description && <p className="text-xs text-slate-500 mb-4 flex-1 font-medium">{task.description}</p>}
                      <div className="mt-auto pt-3">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 tracking-wider">
                          <span>PROGRESS</span>
                          <span className={task.progress_percentage === 100 ? 'text-[#00694C]' : ''}>{task.progress_percentage || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-1.5 rounded-full ${task.progress_percentage === 100 ? 'bg-[#009b72]' : 'bg-[#E88C30]'}`} style={{ width: `${task.progress_percentage || 0}%` }}></div>
                        </div>
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
                    <button className="text-[10px] font-bold text-[#00694C] uppercase tracking-widest hover:text-[#004A3A] transition-colors">View All</button>
                  </div>
                  <div className="space-y-3">
                    {notifications?.length > 0 ? notifications.map((n, i) => (
                      <div key={n.id || i} className="bg-white rounded-xl p-5 shadow-sm flex gap-4 hover:shadow-md transition-shadow cursor-pointer">
                         <div className="w-2 h-2 rounded-full bg-[#009b72] mt-1.5 shrink-0"></div>
                         <div className="flex-1">
                           <div className="flex justify-between items-start mb-1">
                             <h4 className="text-sm font-semibold text-[#004A3A] pr-4 leading-snug">{n.title}</h4>
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mt-0.5">{formatTimeAgo(n.created_at)}</span>
                           </div>
                           <p className="text-xs text-slate-500 font-medium">{n.message || n.msg}</p>
                         </div>
                      </div>
                    )) : (
                      <div className="text-sm text-slate-500 p-4 bg-white rounded-xl shadow-sm">No new notifications.</div>
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
                      <button key={i} className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 text-left hover:shadow-md transition-all group border border-transparent hover:border-[#00694C]/10">
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
          ) : (
            <div className="bg-white rounded-xl p-8 text-center text-slate-500 shadow-sm mt-10">
              <h2 className="text-2xl font-serif text-[#004A3A] mb-2">Coming Soon</h2>
              <p>This section is currently under development.</p>
            </div>
          )}

          <footer className="mt-16 pt-8 border-t border-[#00694C]/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-[#00694C]/40 font-bold uppercase tracking-widest pb-10">
            <div className="normal-case font-serif italic tracking-normal text-[13px] text-[#00694C]/50">Honest & Organic since 1994</div>
            <div className="flex gap-8">
              <a href="#" className="hover:text-[#00694C] transition-colors">Portal Guidelines</a>
              <a href="#" className="hover:text-[#00694C] transition-colors">Support</a>
              <a href="#" className="hover:text-[#00694C] transition-colors">GDPR</a>
            </div>
            <div>© 2025 El Árbol Retail Group</div>
          </footer>

        </div>
      </main>

    </div>
  );
}
