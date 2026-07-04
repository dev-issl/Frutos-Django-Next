"use client";

import { useState } from "react";
import useSWR from "swr";
import api from "@/app/dashboard/_lib/api";
import { Loader2, Users, Store, ChevronDown, ChevronUp } from "lucide-react";

function RankBadge({ rank }) {
  if (rank === 1) {
    return <div className="w-8 h-8 rounded-full bg-[#00694C]/10 text-[#00694C] flex items-center justify-center font-bold text-sm shadow-sm border border-[#00694C]/20">1</div>;
  }
  if (rank === 2) {
    return <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-200">2</div>;
  }
  if (rank === 3) {
    return <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center font-bold text-sm border border-slate-200">3</div>;
  }
  return <div className="w-8 h-8 flex items-center justify-center font-medium text-slate-400 text-sm">{rank}</div>;
}

function StaffCard({ staff, rank }) {
  const [open, setOpen] = useState(false);
  const storeEntries = Object.entries(staff.stores_worked || {}).sort((a, b) => b[1].hours - a[1].hours);

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 hover:border-[#00694C]/30 transition-all duration-300">
      <div className="p-5 flex items-center gap-4">
        {/* Rank */}
        <div className="flex justify-center shrink-0">
          <RankBadge rank={rank} />
        </div>

        {/* Avatar */}
        <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-50 shrink-0 border border-slate-100 shadow-sm">
          {staff.photo
            ? <img 
                src={staff.photo.startsWith('http') ? staff.photo : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://127.0.0.1:8000'}${staff.photo.startsWith('/') ? '' : '/'}${staff.photo}`} 
                alt={staff.name} 
                className="w-full h-full object-cover" 
              />
            : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#00694C] bg-gradient-to-br from-[#00694C]/10 to-[#00694C]/5">
              {staff.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-800 truncate text-[15px]">{staff.name}</div>
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1 font-medium">
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase tracking-wider text-[10px]">
              {staff.staff_code ? `ID: ${staff.staff_code}` : "No ID"}
            </span>
            {staff.role && (
              <>
                <span className="text-slate-300">•</span>
                <span>{staff.role}</span>
              </>
            )}
            {storeEntries.length > 0 && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-[#00694C] flex items-center gap-1 bg-[#00694C]/5 px-1.5 py-0.5 rounded">
                  <Store className="w-3 h-3" />
                  {storeEntries[0][0]}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="text-right shrink-0 flex flex-col items-end">
          <div className="text-xl font-bold text-slate-800 leading-none mb-1">
            {staff.total_hours.toFixed(1)}<span className="text-xs font-semibold text-slate-400 ml-0.5">h</span>
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{staff.total_shifts} shift{staff.total_shifts !== 1 ? "s" : ""}</div>
        </div>

        {/* Expand Store Breakdown */}
        {storeEntries.length > 1 && (
          <button onClick={() => setOpen(!open)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2 ${open ? 'bg-[#00694C]/10 text-[#00694C]' : 'hover:bg-slate-100 text-slate-400'}`}>
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Expanded Details: Store Breakdown */}
      {open && storeEntries.length > 1 && (
        <div className="px-5 pb-5 bg-slate-50/50 border-t border-slate-100/80">
          <div className="pt-4 space-y-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="h-px bg-slate-200 flex-1"></span>
              Hours by Store
              <span className="h-px bg-slate-200 flex-1"></span>
            </div>
            {storeEntries.map(([name, stat]) => (
              <div key={name} className="group">
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-600 group-hover:text-[#00694C] transition-colors truncate">{name}</span>
                  <span className="text-xs font-medium text-slate-500">{stat.hours.toFixed(1)}h</span>
                </div>
                <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#00694C] to-[#00A175] transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, (stat.hours / Math.max(...storeEntries.map(e => e[1].hours))) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setStoreFilter("")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${!storeFilter ? "bg-[#00694C] text-white shadow-md shadow-[#00694C]/20" : "bg-slate-50 text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/60"}`}>
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
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex flex-col sm:flex-row items-center gap-1 sm:gap-2 ${isActive ? "bg-[#00694C] text-white shadow-md shadow-[#00694C]/20" : "bg-slate-50 text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/60"}`}>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rankedStaffList.map((staff) => (
            <StaffCard key={staff.staff_id} staff={staff} rank={staff.rank} />
          ))}
        </div>
      )}
    </div>
  );
}
