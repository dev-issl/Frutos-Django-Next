"use client";

import { Euro, ShoppingCart, Users, Package, Loader2, Store, MapPin, ToggleLeft, ToggleRight, Archive, Tag, UserCircle, ShieldCheck, Briefcase, Clock, BadgeCheck, UserX } from "lucide-react";
import useSWR from "swr";
import Link from "next/link";
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Container from "@/app/dashboard/_components/Container";
import StatCard from "@/app/dashboard/_components/StatCard";
import { fetchAdminDashboardStats } from "@/app/dashboard/_lib/auth";
import { ordersService, storesService, leftoverPacksService, offersService } from "@/app/dashboard/_lib/services";

const STATUS_COLORS = {
  pending: { bg: "bg-amber-100", text: "text-amber-700" },
  processing: { bg: "bg-blue-100", text: "text-blue-700" },
  shipped: { bg: "bg-indigo-100", text: "text-indigo-700" },
  delivered: { bg: "bg-emerald-100", text: "text-emerald-700" },
  cancelled: { bg: "bg-red-100", text: "text-red-700" },
};

const BAR_COLORS = {
  PENDING: "#f97316", PROCESSING: "#10b981",
  SHIPPED: "#f97316", DELIVERED: "#10b981", CANCELLED: "#f97316",
};

function UserSegmentGrid({ stats, loading }) {
  if (loading) return (
    <div className="h-32 rounded-2xl bg-white border border-slate-100 shadow-sm animate-pulse" />
  );

  const mainSegments = [
    { label: "Customers", value: stats?.total_customers, icon: UserCircle, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "Sellers", value: stats?.total_sellers, icon: Briefcase, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
    { label: "Wholesale", value: stats?.total_wholesale, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { label: "Admins", value: stats?.total_admins, icon: ShieldCheck, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-50/80 bg-gradient-to-r from-slate-50/50 to-white flex justify-between items-center">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="w-4 h-4" />
          </div>
          User Demographics
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 lg:divide-x divide-slate-100">
        {mainSegments.map((seg, i) => (
          <div key={seg.label} className="p-6 hover:bg-slate-50/50 transition-colors group flex flex-col justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${seg.bg} ${seg.color} border ${seg.border} group-hover:scale-110 transition-transform duration-300`}>
                <seg.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{seg.label}</p>
                <p className="text-3xl font-black text-slate-800 tracking-tight">{Number(seg.value || 0).toLocaleString()}</p>
              </div>
            </div>

            {seg.label === "Wholesale" && (
              <div className="mt-5 pt-4 border-t border-slate-100/80 grid grid-cols-2 gap-2">
                <div className="bg-white rounded-lg border border-slate-100 p-2.5 flex flex-col justify-center items-center shadow-sm">
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-slate-500 uppercase">
                    <BadgeCheck className="w-3 h-3 text-teal-500" />
                    Approved
                  </div>
                  <span className="text-lg font-black text-slate-700">{Number(stats?.wholesale_approved || 0).toLocaleString()}</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-100 p-2.5 flex flex-col justify-center items-center shadow-sm">
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-slate-500 uppercase">
                    <Clock className="w-3 h-3 text-amber-500" />
                    Pending
                  </div>
                  <span className="text-lg font-black text-slate-700">{Number(stats?.wholesale_pending || 0).toLocaleString()}</span>
                </div>
              </div>
            )}
            {seg.label === "Customers" && (
              <div className="mt-5 pt-4 border-t border-slate-100/80">
                <div className="bg-white rounded-lg border border-slate-100 p-3 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                    <UserX className="w-3.5 h-3.5 text-slate-400" />
                    Inactive Users
                  </div>
                  <span className="text-sm font-black text-slate-700">{Number(stats?.inactive_users || 0).toLocaleString()}</span>
                </div>
              </div>
            )}
            {seg.label === "Sellers" && (
              <div className="mt-5 pt-4 border-t border-slate-100/80 opacity-0 pointer-events-none">
                <div className="p-3" />
              </div>
            )}
            {seg.label === "Admins" && (
              <div className="mt-5 pt-4 border-t border-slate-100/80 opacity-0 pointer-events-none">
                <div className="p-3" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StaffPerformanceSection({ stats, loading }) {
  if (loading) return (
    <div className="h-32 rounded-2xl bg-white border border-slate-100 shadow-sm animate-pulse" />
  );

  const totalStaff = stats?.total_staff || 0;
  const topStaff = stats?.top_staff || [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
      <div className="px-6 py-5 border-b border-slate-50/80 bg-gradient-to-r from-slate-50/50 to-white flex justify-between items-center">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
            <BadgeCheck className="w-4 h-4" />
          </div>
          Staff Performance
        </h3>
        <div className="text-sm font-semibold text-slate-500">
          Total Staff: <span className="text-slate-800 font-bold">{totalStaff}</span>
        </div>
      </div>
      
      <div className="p-6">
        {topStaff.length === 0 ? (
          <div className="text-center text-sm font-medium text-slate-400 py-4">No staff data available</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topStaff.map((staff, index) => (
              <div key={staff.id} className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                {index === 0 && <div className="absolute top-0 right-0 bg-amber-400 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">Top 1</div>}
                {index === 1 && <div className="absolute top-0 right-0 bg-slate-300 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg">Top 2</div>}
                {index === 2 && <div className="absolute top-0 right-0 bg-amber-700 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">Top 3</div>}
                
                {staff.photo ? (
                  <img src={staff.photo} alt={staff.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm">
                    {(staff.name || 'S').charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-slate-800">{staff.name}</p>
                  <p className="text-xs font-medium text-slate-500 mb-1">{staff.role}</p>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex">
                    <BadgeCheck className="w-3 h-3" />
                    {staff.completed_tasks} Tasks Completed
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardHomePage() {
  const { data: rawStats, isLoading: statsLoading } = useSWR(
    "admin-dashboard-stats", fetchAdminDashboardStats, { revalidateOnFocus: false }
  );
  const stats = rawStats?.statistics || rawStats || {};

  const { data: ordersRaw } = useSWR(
    "dash-recent-orders",
    () => ordersService.list({ page_size: 50, ordering: "-ordered_at" }),
    { revalidateOnFocus: false }
  );

  const { data: storesRaw } = useSWR(
    "dash-stores",
    () => storesService.list(),
    { revalidateOnFocus: false }
  );
  const allStores = Array.isArray(storesRaw) ? storesRaw : (storesRaw?.results || []);
  const activeStores = allStores.filter(s => s.is_active);
  const inactiveStores = allStores.filter(s => !s.is_active);
  const allOrders = Array.isArray(ordersRaw) ? ordersRaw : (ordersRaw?.results || []);
  const recentOrders = allOrders.slice(0, 6);

  const { data: leftoverPacksData } = useSWR(
    "dash-leftover-packs",
    () => leftoverPacksService.list(),
    { revalidateOnFocus: false }
  );
  const leftoverPacks = Array.isArray(leftoverPacksData) ? leftoverPacksData : (leftoverPacksData?.results || []);

  const { data: offersRaw } = useSWR(
    "dash-offers",
    () => offersService.list(),
    { revalidateOnFocus: false }
  );
  const allOffers = Array.isArray(offersRaw) ? offersRaw : (offersRaw?.results || []);
  const activeOffers = allOffers.filter(o => o.is_active !== false);

  let availableLeftoverPacks = 0;
  leftoverPacks.forEach(p => { availableLeftoverPacks += Number(p.stock || 0); });

  let soldLeftoverPacks = 0;
  allOrders.forEach(o => {
    (o.items || []).forEach(item => {
      if (item.leftover_pack) soldLeftoverPacks += Number(item.quantity || 1);
    });
  });

  const dailyTrend = (() => {
    const map = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      map[key] = { day: key, orders: 0, revenue: 0 };
    }
    allOrders.forEach(o => {
      const d = new Date(o.ordered_at || o.created_at);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (map[key]) {
        map[key].orders += 1;
        map[key].revenue += Number(o.total_amount || 0);
      }
    });
    return Object.values(map);
  })();

  const statusCounts = (() => {
    const m = {};
    allOrders.forEach(o => { m[o.status] = (m[o.status] || 0) + 1; });
    return Object.entries(m).map(([status, count]) => ({ status, count }));
  })();

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500 font-medium mt-1">Welcome back. Here is your store performance at a glance.</p>
      </div>

      {/* Top 7 stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7 gap-3 sm:gap-4 mb-8">
        {statsLoading
          ? Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 h-28 animate-pulse shadow-sm" />
          ))
          : <>
            <Link href="/dashboard/users" className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all min-w-0">
              <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-2">
                <div className="p-1.5 sm:p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight line-clamp-2">Total Users</p>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-800 truncate">{Number(stats?.total_users || 0).toLocaleString()}</p>
            </Link>

            <Link href="/dashboard/products" className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all min-w-0">
              <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-2">
                <div className="p-1.5 sm:p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight line-clamp-2">Total Products</p>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-800 truncate">{Number(stats?.total_products || 0).toLocaleString()}</p>
            </Link>

            <Link href="/dashboard/offers" className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all min-w-0">
              <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-2">
                <div className="p-1.5 sm:p-2 bg-fuchsia-50 text-fuchsia-600 rounded-lg shrink-0">
                  <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight line-clamp-2">Active Offers</p>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-800 truncate">{activeOffers.length.toLocaleString()}</p>
            </Link>

            <Link href="/dashboard/leftover-packs" className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all min-w-0">
              <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-2">
                <div className="p-1.5 sm:p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                  <Archive className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight line-clamp-2">Leftover Packs</p>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-800 truncate">{leftoverPacks.length.toLocaleString()}</p>
            </Link>

            <Link href="/dashboard/orders" className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all min-w-0">
              <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-2">
                <div className="p-1.5 sm:p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight line-clamp-2">Total Orders</p>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-800 truncate">{Number(stats?.total_orders || 0).toLocaleString()}</p>
            </Link>

            <Link href="/dashboard/analytics" className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all min-w-0">
              <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-2">
                <div className="p-1.5 sm:p-2 bg-green-50 text-green-600 rounded-lg shrink-0">
                  <Euro className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight line-clamp-2">Revenue</p>
              </div>
              <p className="text-xl sm:text-2xl font-black text-green-600 truncate">€{Number(stats?.total_revenue || 0).toLocaleString()}</p>
            </Link>

            <Link href="/dashboard/analytics" className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all min-w-0">
              <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-2">
                <div className="p-1.5 sm:p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                  <Euro className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight line-clamp-2">Pending Amt</p>
              </div>
              <p className="text-xl sm:text-2xl font-black text-amber-600 truncate">€{Number(stats?.total_pending_amount || 0).toLocaleString()}</p>
            </Link>
          </>
        }
      </div>

      {/* User breakdown */}
      <div className="mb-8">
        <UserSegmentGrid stats={stats} loading={statsLoading} />
      </div>
      
      {/* Staff Performance */}
      <StaffPerformanceSection stats={stats} loading={statsLoading} />

      {/* Secondary Metrics Row */}
      <div className="flex flex-wrap gap-4 mb-8">
        {/* Pending Orders */}
        {!statsLoading && (
          <div className="bg-white shadow-sm border border-slate-100 border-l-4 border-l-amber-400 rounded-xl px-6 py-4 flex items-center gap-4 min-w-[200px] hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Orders</p>
              <p className="text-3xl font-black text-amber-500 leading-none">
                {Number(stats?.pending_orders || 0).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Offers Quick Stats */}
        {!statsLoading && (
          <div className="bg-white shadow-sm border border-slate-100 border-l-4 border-l-blue-500 rounded-xl px-6 py-4 flex items-center gap-8 min-w-[280px] hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Offers</p>
              <p className="text-3xl font-black text-blue-600 leading-none">
                {allOffers.length.toLocaleString()}
              </p>
            </div>
            <div className="w-px h-12 bg-slate-100"></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Active Offers</p>
              <p className="text-3xl font-black text-emerald-500 leading-none">
                {activeOffers.length.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Leftover Packs Quick Stats */}
        {!statsLoading && (
          <div className="bg-white shadow-sm border border-slate-100 border-l-4 border-l-emerald-500 rounded-xl px-6 py-4 flex items-center gap-8 min-w-[280px] hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Available Packs</p>
              <p className="text-3xl font-black text-emerald-600 leading-none">
                {availableLeftoverPacks.toLocaleString()}
              </p>
            </div>
            <div className="w-px h-12 bg-slate-100"></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Packs Sold</p>
              <p className="text-3xl font-black text-amber-500 leading-none">
                {soldLeftoverPacks.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white shadow-sm border border-slate-100 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-800">Revenue — Last 14 Days</h3>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full">Analytics</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={dailyTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" interval={3} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" axisLine={false} tickLine={false} dx={-10} />
                <Tooltip
                  contentStyle={{ fontSize: "12px", borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(v, n) => [n === "revenue" ? `€${Number(v).toLocaleString()}` : v, n === "revenue" ? "Revenue" : "Orders"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revGrad)" strokeWidth={3} dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white shadow-sm border border-slate-100 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-800">Orders by Status</h3>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">Distribution</span>
          </div>
          <div className="h-64">
            {statusCounts.length === 0
              ? <div className="flex items-center justify-center h-full text-sm font-medium text-slate-400">No orders yet</div>
              : <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={statusCounts} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" allowDecimals={false} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" name="Orders" radius={[6, 6, 0, 0]}>
                    {statusCounts.map((e, i) => (
                      <Cell key={i} fill={BAR_COLORS[e.status] || "#94a3b8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            }
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stores Overview */}
        <div className="bg-white shadow-sm border border-slate-100 rounded-xl lg:col-span-1 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                <Store className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-800">Store Locations</h2>
            </div>
          </div>
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
              {activeStores.length} Active
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shadow-sm" />
              {inactiveStores.length} Inactive
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {!storesRaw ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
            ) : allStores.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm font-medium text-slate-400">No stores available</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {allStores.slice(0, 5).map(store => (
                  <div key={store.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    {store.image ? (
                      <img src={store.image} alt={store.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-slate-200 shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-200">
                        <Store className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{store.name}</p>
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> <span className="truncate">{store.city}</span>
                      </p>
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${store.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {store.is_active ? 'Active' : 'Offline'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {allStores.length > 5 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
              <a href="/dashboard/stores" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-all">
                View all {allStores.length} stores &rarr;
              </a>
            </div>
          )}
        </div>

        {/* Recent Orders table */}
        <div className="bg-white shadow-sm border border-slate-100 rounded-xl lg:col-span-2 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-800">Recent Orders</h2>
            </div>
            <a href="/dashboard/orders" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-all">
              View All &rarr;
            </a>
          </div>
          <div className="flex-1 overflow-x-auto">
            {!ordersRaw ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Order ID", "Customer", "Amount", "Status", "Date"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.length === 0
                    ? <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-medium">No recent orders</td></tr>
                    : recentOrders.map(order => {
                      const sc = STATUS_COLORS[order.status?.toLowerCase()] || { bg: "bg-slate-100", text: "text-slate-600" };
                      let displayStatus = order.status_display || order.status;
                      if (displayStatus === 'Pending Confirmation') displayStatus = 'Pending';

                      return (
                        <tr key={order.id || order.order_number} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 font-bold text-indigo-600">#{order.order_number}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-700">{order.customer_name}</td>
                          <td className="px-4 py-2.5 font-bold text-slate-800">€{Number(order.total_amount).toLocaleString()}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full ${sc.bg} ${sc.text}`}>
                              {displayStatus}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-medium text-slate-500">
                            {order.ordered_at ? new Date(order.ordered_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}
                          </td>
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}