"use client";

import { useState } from "react";
import useSWR from "swr";
import api, { getPhotoUrl } from "@/app/dashboard/_lib/api";
import { Loader2, Users, Store, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function FormattedHours({ hours, large = false }) {
  if (!hours || hours <= 0) {
    return <>0<span className={large ? "text-xs font-semibold text-slate-400 ml-0.5" : "font-normal text-slate-400 ml-0.5"}>min</span></>;
  }
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  
  const unitClass = large ? "text-xs font-semibold text-slate-400 ml-0.5" : "font-normal text-slate-400 ml-0.5";
  const spacingClass = "mr-1";
  
  return (
    <>
      {h > 0 && (
        <>
          {h}<span className={`${unitClass} ${m > 0 ? spacingClass : ''}`}>h</span>
        </>
      )}
      {m > 0 && (
        <>
          {m}<span className={unitClass}>min</span>
        </>
      )}
    </>
  );
}

function StaffCard({ staff, rank }) {
  const [open, setOpen] = useState(false);
  const storeEntries = Object.entries(staff.stores_worked || {}).sort((a, b) => b[1].hours - a[1].hours);

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 hover:border-[#00694C]/30 transition-all duration-300">
      <div className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 relative">
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-slate-50 border border-slate-100 shadow-sm">
              {staff.photo
                ? <img 
                    src={getPhotoUrl(staff.photo)} 
                    alt={staff.name} 
                    className="w-full h-full object-cover" 
                  />
                : <div className="w-full h-full flex items-center justify-center text-sm md:text-base font-bold text-[#00694C] bg-gradient-to-br from-[#00694C]/10 to-[#00694C]/5">
                  {staff.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>}
            </div>
            {/* Rank Badge */}
            <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 md:w-[22px] md:h-[22px] rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-bold shadow-sm border-2 border-white ${
              rank === 1 ? 'bg-[#00694C] text-white' : 
              rank === 2 ? 'bg-slate-700 text-white' : 
              rank === 3 ? 'bg-slate-400 text-white' : 
              'bg-slate-200 text-slate-600'
            }`}>
              {rank}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col min-w-0 flex-1 justify-center">
            <div className="font-bold text-slate-800 truncate text-[14px] md:text-[15px] leading-tight mb-1" title={staff.name}>{staff.name}</div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium min-w-0">
              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold shrink-0 text-[9px] md:text-[10px]">
                {staff.staff_code ? `ID: ${staff.staff_code}` : "No ID"}
              </span>
              {staff.role && (
                <>
                  <span className="text-slate-300 shrink-0">•</span>
                  <span className="truncate text-slate-500 leading-tight" title={staff.role}>{staff.role}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 mt-1 sm:mt-0">
          {/* Stats */}
          <div className="text-left sm:text-right flex flex-col justify-center">
            <div className="text-base md:text-lg font-bold text-slate-800 leading-none mb-1">
              <FormattedHours hours={staff.total_hours} large />
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{staff.total_shifts} shift{staff.total_shifts !== 1 ? "s" : ""}</div>
          </div>

          {/* Expand Store Breakdown */}
          {storeEntries.length > 1 ? (
            <button onClick={() => setOpen(!open)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-1 ${open ? 'bg-[#00694C]/10 text-[#00694C]' : 'hover:bg-slate-100 text-slate-400'}`}>
              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          ) : (
             <div className="w-8 shrink-0 ml-1"></div>
          )}
        </div>
      </div>

      {/* Expanded Details: Store Breakdown */}
      <AnimatePresence initial={false}>
        {open && storeEntries.length > 1 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 bg-slate-50/50 border-t border-slate-100/80">
              <div className="pt-4 space-y-2.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="h-px bg-slate-200 flex-1"></span>
                  Hours by Store
                  <span className="h-px bg-slate-200 flex-1"></span>
                </div>
                {storeEntries.map(([name, stat]) => (
                  <div key={name} className="relative overflow-hidden p-3 bg-white border border-slate-200/60 rounded-xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_-4px_rgba(0,105,76,0.08)] hover:border-[#00694C]/20 transition-all group">
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-[#00694C]/5 group-hover:text-[#00694C] group-hover:border-[#00694C]/10 transition-all duration-300 overflow-hidden">
                          {stat.image ? (
                            <img 
                              src={getPhotoUrl(stat.image)} 
                              alt={name} 
                              className="w-full h-full object-cover" 
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                          ) : null}
                          {(!stat.image) && (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500 bg-slate-100">
                              {name?.charAt(0)?.toUpperCase() || 'S'}
                            </div>
                          )}
                          {stat.image && (
                            <div style={{display: 'none'}} className="w-full h-full items-center justify-center text-xs font-bold text-slate-500 bg-slate-100">
                              {name?.charAt(0)?.toUpperCase() || 'S'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{name}</div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">{stat.days} shift{stat.days !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-slate-600 group-hover:text-[#00694C] transition-colors">
                          <FormattedHours hours={stat.hours} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StaffRankingTab({ stores }) {
  const [storeFilter, setStoreFilter] = useState("");

  const { data, isLoading } = useSWR(
    "/api/staff/admin/shift-stats/",
    (url) => api.get(url),
    { revalidateOnFocus: false }
  );

  const allStaff = data?.results || [];

  // Local filtering & ranking
  const getStaffStoreHours = (staff, storeName) => {
    return staff.stores_worked && staff.stores_worked[storeName] ? staff.stores_worked[storeName].hours : 0;
  };

  const filteredStaff = storeFilter
    ? allStaff.filter(s => {
      const storeObj = stores.find(st => String(st.id) === storeFilter);
      return storeObj && s.stores_worked && s.stores_worked[storeObj.name];
    }).sort((a, b) => {
      const storeName = stores.find(st => String(st.id) === storeFilter)?.name;
      return getStaffStoreHours(b, storeName) - getStaffStoreHours(a, storeName);
    })
    : [...allStaff]; // Backend already sorts by total hours globally

  const rankedStaffList = filteredStaff.map((s, idx) => ({ ...s, rank: idx + 1 }));

  const getStoreStaffCount = (storeName) => {
    return allStaff.filter(s => s.stores_worked && s.stores_worked[storeName]).length;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Section */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-4">

        {/* Simple Totals */}
        <div className="flex items-center gap-6 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#00694C]/10 text-[#00694C] flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Stores</div>
              <div className="text-lg font-extrabold text-slate-800 leading-none mt-0.5">{stores.length}</div>
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Staff</div>
              <div className="text-lg font-extrabold text-slate-800 leading-none mt-0.5">{allStaff.length}</div>
            </div>
          </div>
        </div>

        {/* Store Filters */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            Filter Ranking By Store
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <button onClick={() => setStoreFilter("")}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${!storeFilter ? "bg-[#00694C] text-white shadow-md shadow-[#00694C]/20" : "bg-slate-50 text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/60"}`}>
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
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${isActive ? "bg-[#00694C] text-white shadow-md shadow-[#00694C]/20" : "bg-slate-50 text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/60"}`}>
                  {store.name}
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ranking List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-slate-100 border-dashed">
          <Loader2 className="w-8 h-8 text-[#00694C]/50 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Analyzing shift data...</p>
        </div>
      ) : rankedStaffList.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-xl border border-slate-100 border-dashed">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-lg text-slate-700 font-bold mb-1">No shift records found</p>
          <p className="text-slate-500 text-sm">Staff rankings will appear here once they start working shifts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
          {rankedStaffList.map((staff) => (
            <StaffCard key={staff.staff_id} staff={staff} rank={staff.rank} />
          ))}
        </div>
      )}
    </div>
  );
}
