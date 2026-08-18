"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import api from "@/app/dashboard/_lib/api";
import {
  Store as StoreIcon,
  MapPin,
  Phone,
  Package,
  ShoppingCart,
  Clock,
  Users,
  User,
  RefreshCw,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  LogOut,
  Timer,
  ChevronRight,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Given store openTime / closeTime strings like "09:00" or "09:00:00",
 * return { isOpen, openTime, closeTime, label }
 */
function getStoreStatus(openTime, closeTime) {
  if (!openTime || !closeTime) return { isOpen: null, label: "Hours N/A" };

  const now = new Date();
  const toMinutes = (str) => {
    const parts = str.split(":");
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  };
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = toMinutes(openTime);
  const closeMinutes = toMinutes(closeTime);
  const isOpen = nowMinutes >= openMinutes && nowMinutes < closeMinutes;

  const fmt = (str) => {
    const parts = str.split(":");
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  return {
    isOpen,
    label: `${fmt(openTime)} – ${fmt(closeTime)}`,
    openLabel: fmt(openTime),
    closeLabel: fmt(closeTime),
  };
}

function formatDuration(startTime) {
  if (!startTime) return "0m";
  const diffMs = Date.now() - startTime;
  const totalSecs = Math.floor(diffMs / 1000);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function formatTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ─── Closed store screen ─────────────────────────────────────────────────────

function StoreClosed({ store, storeStatus, onBack }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-400">
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#004A3A] mb-2">{store?.name}</h2>
        <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-bold px-4 py-2 rounded-full mb-4">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Closed Today
        </div>
        <p className="text-slate-500 text-sm font-medium mb-2">
          This store is currently closed.
        </p>
        <p className="text-slate-400 text-xs mb-1">
          Working hours: <span className="font-bold text-slate-600">{storeStatus.label}</span>
        </p>
        <p className="text-[#00694C] text-sm font-semibold mt-6 mb-8">
          Please try a different store.
        </p>
        <button
          onClick={onBack}
          className="flex items-center gap-2 mx-auto px-6 py-3 rounded-full bg-[#00694C] hover:bg-[#00593E] text-white font-bold text-sm transition-all cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Choose Another Store
        </button>
      </div>
    </div>
  );
}

// ─── Session ended summary screen ────────────────────────────────────────────

function SessionEndedScreen({ store, sessionStart, sessionEnd, onDone }) {
  const diffMs = sessionEnd - sessionStart;
  const totalSecs = Math.floor(diffMs / 1000);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  const durationStr = hrs > 0 ? `${hrs}h ${mins}m ${secs}s` : mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-400">
      <div className="max-w-sm mx-auto mt-16 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-xl font-serif font-bold text-[#004A3A] mb-1">Session Ended</h2>
        <p className="text-slate-500 text-sm mb-6">You have left <span className="font-bold text-[#004A3A]">{store?.name}</span></p>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-left space-y-4 mb-6">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Store</span>
            <span className="text-sm font-bold text-[#004A3A]">{store?.name}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Session Start</span>
            <span className="text-sm font-bold text-slate-700">{formatTime(sessionStart)}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Session End</span>
            <span className="text-sm font-bold text-slate-700">{formatTime(sessionEnd)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Duration</span>
            <span className="text-sm font-bold text-[#00694C]">{durationStr}</span>
          </div>
        </div>

        <p className="text-slate-400 text-xs mb-6">This session has been recorded and is visible to admin.</p>

        <button
          onClick={onDone}
          className="flex items-center gap-2 mx-auto px-6 py-3 rounded-full bg-[#00694C] hover:bg-[#00593E] text-white font-bold text-sm transition-all cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Choose Another Store
        </button>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function StaffAttendanceView({ store, currentActiveShift, onSwitchStore, sessionStartTime }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [tick, setTick] = useState(0);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionEndTime, setSessionEndTime] = useState(null);

  // Live timer tick every second for duration display
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch store details (for hours, etc.)
  const { data: storeData, isLoading: storeLoading } = useSWR(
    store?.slug ? `/api/fulfillment/stores/slug/${store.slug}/` : null,
    (url) => api.get(url).then((res) => res.data || res),
    { revalidateOnFocus: false }
  );

  // Fetch staff working at this store
  const { data: storeStaffRaw, isLoading: staffLoading } = useSWR(
    store?.id ? `/api/staff/store/${store.id}/staff/` : null,
    (url) => api.get(url).then((res) => res.data || res),
    { revalidateOnFocus: false }
  );

  // Products at this store (Now fetching ALL global products)
  const { data: productsRaw, isLoading: productsLoading, mutate: mutateProducts } = useSWR(
    "/api/products/products/?page_size=500",
    (url) => api.get(url),
    { revalidateOnFocus: false }
  );

  // Store open/closed status
  const openTime = storeData?.openTime || store?.openTime;
  const closeTime = storeData?.closeTime || store?.closeTime;
  const storeStatus = getStoreStatus(openTime, closeTime);

  const storeStaff = Array.isArray(storeStaffRaw) ? storeStaffRaw : (storeStaffRaw?.results || []);
  const products = productsRaw?.results || (Array.isArray(productsRaw) ? productsRaw : []);

  const isWorking = currentActiveShift?.store_name === store?.name ||
    String(currentActiveShift?.store) === String(store?.id);

  // ── If closed, block access
  if (!storeLoading && storeStatus.isOpen === false) {
    return <StoreClosed store={store} storeStatus={storeStatus} onBack={onSwitchStore} />;
  }

  // ── If session ended, show summary
  if (sessionEnded) {
    return (
      <SessionEndedScreen
        store={store}
        sessionStart={sessionStartTime}
        sessionEnd={sessionEndTime}
        onDone={onSwitchStore}
      />
    );
  }

  const handleLeave = () => {
    setSessionEndTime(Date.now());
    setSessionEnded(true);
    setShowLeaveConfirm(false);
  };

  const sections = [
    { id: "overview", label: "Overview", icon: StoreIcon },
    { id: "staff", label: `Staff (${storeStaff.length})`, icon: Users },
    { id: "products", label: `Products (${products.length})`, icon: Package },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">

      {/* Store Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#00694C] to-[#00896A] px-8 py-6 flex items-center gap-6">
          <div className="w-16 h-16 rounded-xl bg-white/15 flex items-center justify-center overflow-hidden border border-white/20 shrink-0">
            {storeData?.image ? (
              <img src={storeData.image} alt={store?.name} className="w-full h-full object-cover" />
            ) : (
              <StoreIcon className="w-8 h-8 text-white/80" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h2 className="text-2xl font-serif font-bold text-white tracking-tight">{store?.name}</h2>
              {/* Open/Closed badge */}
              {storeStatus.isOpen === true && (
                <span className="flex items-center gap-1.5 bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/30 uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Open Now
                </span>
              )}
              {isWorking && (
                <span className="flex items-center gap-1.5 bg-amber-400/20 text-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-300/30 uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                  Your Shift Here
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {storeData?.address && (
                <span className="flex items-center gap-1.5 text-white/70 text-xs font-medium">
                  <MapPin className="w-3 h-3" />
                  {storeData.address}
                </span>
              )}
              {storeData?.phone && (
                <span className="flex items-center gap-1.5 text-white/70 text-xs font-medium">
                  <Phone className="w-3 h-3" />
                  {storeData.phone}
                </span>
              )}
              {storeStatus.label !== "Hours N/A" && (
                <span className="flex items-center gap-1.5 text-white/70 text-xs font-medium">
                  <Clock className="w-3 h-3" />
                  {storeStatus.label}
                </span>
              )}
            </div>
          </div>

          {/* Leave button */}
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="shrink-0 flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 border border-red-300/30 text-red-100 text-xs font-bold px-4 py-2 rounded-full transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Leave
          </button>
        </div>

        {/* Session timer strip */}
        {sessionStartTime && (
          <div className="flex items-center justify-between px-8 py-3 bg-[#00694C]/5 border-b border-[#00694C]/10">
            <div className="flex items-center gap-2 text-[#00694C]">
              <Timer className="w-3.5 h-3.5" />
              <span className="text-xs font-bold uppercase tracking-widest">Session Time</span>
            </div>
            <span className="text-sm font-bold text-[#004A3A] tabular-nums font-mono">
              {formatDuration(sessionStartTime)}
            </span>
          </div>
        )}

        {/* Stats row — products & staff only, no revenue */}
        <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100">
          <div className="p-5 text-center">
            <div className="text-2xl font-bold text-[#00694C] font-mono">
              {productsLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-300" /> : products.length}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Products</div>
          </div>
          <div className="p-5 text-center">
            <div className="text-2xl font-bold text-[#00694C] font-mono">
              {staffLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-300" /> : storeStaff.length}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Staff Members</div>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2">
        {sections.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeSection === sec.id
                ? "bg-[#00694C] text-white shadow-md"
                : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <sec.icon className="w-3.5 h-3.5" />
            {sec.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      {activeSection === "overview" && (
        <StoreOverview
          storeData={storeData}
          isLoading={storeLoading}
          store={store}
          storeStatus={storeStatus}
          isWorking={isWorking}
          currentActiveShift={currentActiveShift}
          sessionStartTime={sessionStartTime}
          tick={tick}
        />
      )}
      {activeSection === "staff" && (
        <StoreStaffList storeStaff={storeStaff} isLoading={staffLoading} />
      )}
      {activeSection === "products" && (
        <StoreProducts products={products} isLoading={productsLoading} onRefresh={mutateProducts} />
      )}

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6 text-center pt-8">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-serif font-bold text-[#004A3A] mb-2">Leave Store?</h2>
              <p className="text-sm text-slate-500 mb-1 font-medium">
                You are about to leave <span className="font-bold text-[#004A3A]">{store?.name}</span>.
              </p>
              {sessionStartTime && (
                <div className="bg-slate-50 rounded-xl p-3 mb-5 mt-4 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Session Duration</p>
                  <p className="text-lg font-bold text-[#00694C] font-mono tabular-nums">{formatDuration(sessionStartTime)}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Started at {formatTime(sessionStartTime)}</p>
                </div>
              )}
              <p className="text-xs text-slate-400 mb-6">Your session will be recorded and visible to admin.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors cursor-pointer"
                >
                  Stay
                </button>
                <button
                  onClick={handleLeave}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function StoreOverview({ storeData, isLoading, store, storeStatus, isWorking, currentActiveShift, sessionStartTime, tick }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-12 flex justify-center shadow-sm border border-slate-100">
        <Loader2 className="w-8 h-8 text-[#00694C] animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Store Details */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-bold text-[#004A3A] uppercase tracking-widest">Store Details</h3>
        <div className="space-y-0">
          {[
            { label: "Store Name", value: storeData?.name || store?.name },
            { label: "Store Code", value: storeData?.storeCode || storeData?.store_code || "N/A" },
            { label: "Address", value: storeData?.address || "Not available" },
            { label: "Phone", value: storeData?.phone || "Not available" },
            { label: "Opening Hours", value: storeStatus.label !== "Hours N/A" ? storeStatus.label : "Not set" },
          ].map((item) => (
            <div key={item.label} className="flex justify-between items-center gap-4 py-2.5 border-b border-slate-50 last:border-0">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide shrink-0">{item.label}</span>
              <span className="text-xs font-medium text-slate-700 text-right">{item.value}</span>
            </div>
          ))}
          {/* Store Status row */}
          <div className="flex justify-between items-center gap-4 py-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Today's Status</span>
            {storeStatus.isOpen === true ? (
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Open Now
              </span>
            ) : storeStatus.isOpen === false ? (
              <span className="flex items-center gap-1.5 text-red-700 bg-red-50 border border-red-200 text-[10px] font-bold px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Closed
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-medium">Unknown</span>
            )}
          </div>
        </div>
      </div>

      {/* Session / Shift Info */}
      <div className="space-y-4">
        {/* Current session tracking */}
        {sessionStartTime && (
          <div className="bg-gradient-to-br from-[#E4EFDA] to-[#D9EFE5] rounded-2xl p-6 border border-[#BCE4D3]">
            <div className="flex items-center gap-2 mb-4">
              <Timer className="w-4 h-4 text-[#00694C]" />
              <h3 className="text-sm font-bold text-[#004A3A] uppercase tracking-widest">Current Session</h3>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between">
                <span className="text-xs text-[#00694C]/70 font-semibold">Started At</span>
                <span className="text-xs font-bold text-[#004A3A] font-mono">{formatTime(sessionStartTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[#00694C]/70 font-semibold">Duration</span>
                <span className="text-xs font-bold text-[#004A3A] font-mono tabular-nums">{formatDuration(sessionStartTime)}</span>
              </div>
              {isWorking && currentActiveShift && (
                <div className="flex justify-between">
                  <span className="text-xs text-[#00694C]/70 font-semibold">Shift Start</span>
                  <span className="text-xs font-bold text-[#004A3A] font-mono">
                    {currentActiveShift.start_time
                      ? new Date(`2000-01-01T${currentActiveShift.start_time}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "—"}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {!sessionStartTime && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center gap-3 min-h-[140px]">
            <Timer className="w-8 h-8 text-slate-200" />
            <p className="text-xs text-slate-400 font-medium">Session timer not started</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Staff List Tab ───────────────────────────────────────────────────────────

function StoreStaffList({ storeStaff, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-12 flex justify-center shadow-sm border border-slate-100">
        <Loader2 className="w-8 h-8 text-[#00694C] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#004A3A] uppercase tracking-widest">Staff at This Store</h3>
        <span className="text-xs font-bold text-slate-400">{storeStaff.length} member{storeStaff.length !== 1 ? "s" : ""}</span>
      </div>

      {storeStaff.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-medium">No staff assigned to this store yet</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {storeStaff.map((staff) => (
            <div key={staff.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-[#004238]">
                {staff.photo ? (
                  <img src={staff.photo} alt={staff.user?.name} className="w-full h-full object-cover" />
                ) : (
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(staff.user?.name || "S")}&background=004238&color=fff&size=80&bold=true`}
                    alt={staff.user?.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-[#004A3A] truncate">{staff.user?.name || "Unknown"}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{staff.role || "Staff"}</div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {staff.staff_id && (
                  <span className="text-[10px] font-bold text-[#00694C] bg-[#F1F6EB] px-2 py-0.5 rounded-md">{staff.staff_id}</span>
                )}
                {staff.phone && (
                  <span className="text-[10px] text-slate-400 font-medium">{staff.phone}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

function StoreProducts({ products, isLoading, onRefresh }) {
  const [search, setSearch] = useState("");
  const filtered = products.filter((p) =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-[#004A3A] uppercase tracking-widest">Products</h3>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs border border-slate-200 rounded-full px-3 py-1.5 focus:outline-none focus:border-[#00694C] w-44 transition-colors"
          />
          <button onClick={onRefresh} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-[#00694C] transition-colors cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-7 h-7 text-[#00694C] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-medium">No products found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {p.thumbnail_url ? (
                        <img src={p.thumbnail_url} alt={p.name} className="w-8 h-8 rounded-lg object-cover border border-slate-100 shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <Package className="w-3.5 h-3.5 text-slate-300" />
                        </div>
                      )}
                      <span className="font-semibold text-slate-700 truncate max-w-[180px]">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-medium">{p.category?.name || "—"}</td>
                  <td className="px-4 py-3 font-bold text-slate-700">€{Number(p.price || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${Number(p.stock) < 10 ? "text-red-500" : "text-slate-700"}`}>
                      {p.stock ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
