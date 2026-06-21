"use client";

import { useState } from "react";
import { useStaffAuth } from "./_context/StaffAuthContext";
import useSWR from "swr";
import api from "@/app/dashboard/_lib/api";
import { Bell, Calendar, Euro, FileText, LogOut, MessageSquare, Settings, Clock, Menu, ArrowRight, Search, HelpCircle, ChevronLeft, ChevronRight, Ban } from "lucide-react";

export default function StaffDashboardPage() {
  const { user, logout } = useStaffAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: dashboardData, isLoading } = useSWR(
    "/api/staff/me/dashboard/",
    (url) => api.get(url)
  );

  if (isLoading || !user) {
    return <div className="min-h-screen bg-[#F1F6EB] flex items-center justify-center text-[#00694C] font-semibold">Loading...</div>;
  }

  const { profile, shifts = [], notifications = [] } = dashboardData || {};

  const sidebarMenuItems = [
    { name: "MY SHIFTS", icon: Calendar, active: true },
    { name: "NOTIFICATIONS", icon: Bell, active: false, badge: notifications?.length || 0 },
    { name: "PRICE LIST", icon: Euro, active: false },
    { name: "REQUEST DAY OFF", icon: FileText, active: false },
    { name: "MESSAGES", icon: MessageSquare, active: false },
  ];

  const staffActions = [
    { title: "Request Shift Change", desc: "Swap with a colleague or adjust hours", icon: Calendar },
    { title: "Apply for Extra Day Off", desc: "Submit personal or vacation requests", icon: FileText },
    { title: "View Digital Price List", desc: "Check current SKU pricing & offers", icon: Euro },
  ];

  const totalHours = shifts?.reduce((acc, shift) => {
    if (shift.status !== 'DAY_OFF' && shift.start_time && shift.end_time) {
      const start = new Date(`2000-01-01T${shift.start_time}`);
      const end = new Date(`2000-01-01T${shift.end_time}`);
      const diff = (end - start) / (1000 * 60 * 60);
      return acc + (diff > 0 ? diff : 0);
    }
    return acc;
  }, 0) || 0;

  const getWeekLabel = () => {
    if (!shifts || shifts.length === 0) return "This Week";
    const start = new Date(shifts[0].date);
    const end = new Date(shifts[shifts.length - 1].date);
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
        <div className="w-8 h-8 bg-[#00694C] rounded-full flex items-center justify-center text-white font-bold text-sm">
          {user?.name?.charAt(0) || user?.email?.charAt(0) || 'S'}
        </div>
      </div>

      {/* Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-50" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 h-full bg-[#00594C] text-white p-6 flex flex-col" onClick={e => e.stopPropagation()}>
             <div className="p-6 pb-2">
              <h2 className="font-serif font-bold text-xl tracking-tight mb-8">El Árbol Staff</h2>
              
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 rounded-full bg-[#004238] flex items-center justify-center overflow-hidden border border-white/10">
                   <span className="text-sm font-bold text-white/90">{user?.name?.charAt(0) || user?.email?.charAt(0) || 'S'}</span>
                </div>
                <div>
                  <div className="font-semibold text-sm leading-tight mb-0.5">{user?.name || user?.email}</div>
                  <div className="text-[10px] text-white/50 uppercase tracking-widest font-medium">{profile?.role || 'SALES ASSOCIATE'}</div>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-4 space-y-1.5">
              {sidebarMenuItems.map((item, i) => (
                <button key={i} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-semibold tracking-wide transition-colors ${item.active ? 'bg-[#007A63] text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
                  <item.icon className={`w-4 h-4 ${item.active ? 'text-white' : 'text-white/60'}`} />
                  <span className="flex-1 text-left">{item.name}</span>
                  {item.badge > 0 && <span className="bg-[#E88C30] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{item.badge}</span>}
                </button>
              ))}
            </nav>

            <div className="p-4 mt-auto">
              <button className="w-full flex items-center justify-center gap-2 bg-[#009b72] hover:bg-[#008A65] text-white py-3 rounded-xl font-semibold text-sm transition-colors mb-6 shadow-sm">
                <Clock className="w-4 h-4" /> Clock In
              </button>
              <div className="space-y-1 flex justify-between px-2">
                <button className="flex items-center gap-2 text-white/50 hover:text-white text-xs font-medium transition-colors">
                  <Settings className="w-4 h-4" /> Settings
                </button>
                <button onClick={logout} className="flex items-center gap-2 text-white/50 hover:text-white text-xs font-medium transition-colors">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#00594C] text-white flex-col h-screen sticky top-0 shrink-0 shadow-2xl">
        <div className="p-6 pb-2">
          <h2 className="font-serif font-bold text-xl tracking-tight mb-8">El Árbol Staff</h2>
          
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-full bg-[#004238] flex items-center justify-center overflow-hidden border border-white/10">
               <span className="text-sm font-bold text-white/90">{user?.name?.charAt(0) || user?.email?.charAt(0) || 'S'}</span>
            </div>
            <div>
              <div className="font-semibold text-sm leading-tight mb-0.5">{user?.name || user?.email}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-widest font-medium">{profile?.role || 'SALES ASSOCIATE'}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
          {sidebarMenuItems.map((item, i) => (
            <button key={i} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-semibold tracking-wide transition-colors ${item.active ? 'bg-[#007A63] text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
              <item.icon className={`w-4 h-4 ${item.active ? 'text-white' : 'text-white/60'}`} />
              <span className="flex-1 text-left">{item.name}</span>
              {item.badge > 0 && <span className="bg-[#E88C30] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <button className="w-full flex items-center justify-center gap-2 bg-[#009b72] hover:bg-[#008A65] text-white py-3 rounded-xl font-semibold text-sm transition-colors mb-6 shadow-sm">
            <Clock className="w-4 h-4" /> Clock In
          </button>
          <div className="space-y-1 flex justify-between px-2">
            <button className="flex items-center gap-2 text-white/50 hover:text-white text-xs font-medium transition-colors">
              <Settings className="w-4 h-4" /> Settings
            </button>
            <button onClick={logout} className="flex items-center gap-2 text-white/50 hover:text-white text-xs font-medium transition-colors">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 pt-20 md:pt-10 overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto">
          
          <header className="flex justify-between items-center mb-10 hidden md:flex">
            <div className="flex items-center gap-3 text-sm font-semibold">
              <span className="italic font-serif text-[#00694C] text-lg">El Árbol</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-medium">{profile?.branch_location || "Móstoles Centro Branch"}</span>
            </div>
            <div className="flex items-center gap-4">
               {/* Search bar */}
               <div className="relative">
                 <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input type="text" placeholder="Search resources..." className="pl-11 pr-4 py-2.5 rounded-full border border-white/50 bg-white/80 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#00694C]/20 shadow-sm w-64 transition-all" />
               </div>
               <button className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-white transition-colors">
                 <HelpCircle className="w-5 h-5" />
               </button>
               <button className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-white transition-colors">
                 <Settings className="w-5 h-5" />
               </button>
            </div>
          </header>

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
          {shifts?.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-12">
              {shifts.map((shift, i) => {
                const isOff = shift.status === 'DAY_OFF';
                const dateObj = new Date(shift.date);
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                const dayNum = dateObj.toLocaleDateString('en-US', { day: '2-digit' });

                if (isOff) {
                  return (
                    <div key={i} className="bg-white rounded-xl p-4 flex flex-col items-center justify-center text-center h-48 shadow-sm">
                       <div className="text-[11px] font-bold text-slate-400 mb-1">{dayName} {dayNum}</div>
                       <div className="flex-1 flex flex-col items-center justify-center gap-2">
                         <Ban className="w-8 h-8 text-slate-200" strokeWidth={1} />
                         <span className="text-[13px] text-slate-400 font-serif italic">Day Off</span>
                       </div>
                    </div>
                  );
                }
                
                const start = new Date(`2000-01-01T${shift.start_time}`);
                const end = new Date(`2000-01-01T${shift.end_time}`);
                const diff = (end - start) / (1000 * 60 * 60);
                const hrs = diff > 0 ? diff.toFixed(1) : 0;
                
                return (
                  <div key={i} className="bg-[#D9EFE5] rounded-xl p-4 flex flex-col h-48">
                    <div className="flex justify-between items-start mb-3">
                       <div>
                         <div className="text-[11px] font-bold text-[#00694C]/60 mb-0.5">{dayName}</div>
                         <div className="text-xl font-bold text-[#00694C]">{dayNum}</div>
                       </div>
                       <span className="bg-[#C3E4D4] text-[#00694C] text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">{hrs}h</span>
                    </div>
                    <div className="text-[11px] text-[#00694C]/70 font-semibold leading-[1.3] mb-3">{shift.location || profile?.branch_location}</div>
                    <div className="text-lg font-bold text-[#009b72] leading-tight mb-1">{shift.start_time?.slice(0,5)} -<br/>{shift.end_time?.slice(0,5)}</div>
                    {shift.break_start && shift.break_end && (
                      <div className="mt-auto text-[9px] font-semibold text-[#009b72]/60 uppercase tracking-wide">Break: {shift.break_start.slice(0,5)}-{shift.break_end.slice(0,5)}</div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 mb-12 text-center text-slate-500 shadow-sm">
              No shifts scheduled for this week.
            </div>
          )}

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
