// // src/app/dashboard/page.jsx
// "use client";

// import { DollarSign, ShoppingCart, Users, Package, Loader2 } from "lucide-react";
// import useSWR from "swr";
// import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
// import Container from "@/app/dashboard/_components/Container";
// import StatCard from "@/app/dashboard/_components/StatCard";
// import { fetchAdminDashboardStats } from "@/app/dashboard/_lib/auth";
// import { ordersService } from "@/app/dashboard/_lib/services";

// const STATUS_COLORS = {
//   pending:    { bg: "bg-amber-50 dark:bg-amber-950/30",    text: "text-amber-700 dark:text-amber-400" },
//   processing: { bg: "bg-blue-50 dark:bg-blue-950/30",      text: "text-blue-700 dark:text-blue-400" },
//   shipped:    { bg: "bg-violet-50 dark:bg-violet-950/30",  text: "text-violet-700 dark:text-violet-400" },
//   delivered:  { bg: "bg-emerald-50 dark:bg-emerald-950/30",text: "text-emerald-700 dark:text-emerald-400" },
//   cancelled:  { bg: "bg-red-50 dark:bg-red-950/30",        text: "text-red-700 dark:text-red-400" },
// };

// const BAR_COLORS = {
//   PENDING: "#f59e0b", PROCESSING: "#3b82f6",
//   SHIPPED: "#8b5cf6", DELIVERED: "#10b981", CANCELLED: "#ef4444",
// };

// function UserSegmentGrid({ stats, loading }) {
//   if (loading) return (
//     <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
//       {Array.from({ length: 7 }).map((_, i) => (
//         <div key={i} className="h-20 rounded-lg bg-gray-100 dark:bg-gray-900 animate-pulse" />
//       ))}
//     </div>
//   );

//   const segments = [
//     { label: "Customers",    value: stats?.total_customers,   color: "border-l-blue-400" },
//     { label: "Sellers",      value: stats?.total_sellers,     color: "border-l-violet-400" },
//     { label: "Admins",       value: stats?.total_admins,      color: "border-l-red-400" },
//     { label: "Wholesale",    value: stats?.total_wholesale,   color: "border-l-emerald-400" },
//     { label: "WS Approved",  value: stats?.wholesale_approved,color: "border-l-green-400" },
//     { label: "WS Pending",   value: stats?.wholesale_pending, color: "border-l-amber-400" },
//     { label: "Inactive",     value: stats?.inactive_users,    color: "border-l-gray-400" },
//   ];

//   return (
//     <div>
//       <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
//         User Breakdown
//       </p>
//       <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
//         {segments.map(({ label, value, color }) => (
//           <div
//             key={label}
//             className={`bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 border-l-4 ${color} rounded-lg px-3 py-3`}
//           >
//             <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mb-1">{label}</p>
//             <p className="text-xl font-bold text-gray-900 dark:text-white">
//               {Number(value || 0).toLocaleString()}
//             </p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default function DashboardHomePage() {
//   const { data: rawStats, isLoading: statsLoading } = useSWR(
//     "admin-dashboard-stats", fetchAdminDashboardStats, { revalidateOnFocus: false }
//   );
//   const stats = rawStats?.statistics || rawStats || {};

//   const { data: ordersRaw } = useSWR(
//     "dash-recent-orders",
//     () => ordersService.list({ page_size: 50, ordering: "-ordered_at" }),
//     { revalidateOnFocus: false }
//   );
//   const allOrders    = Array.isArray(ordersRaw) ? ordersRaw : (ordersRaw?.results || []);
//   const recentOrders = allOrders.slice(0, 6);

//   const dailyTrend = (() => {
//     const map = {};
//     const now = new Date();
//     for (let i = 13; i >= 0; i--) {
//       const d = new Date(now); d.setDate(d.getDate() - i);
//       const key = `${d.getMonth() + 1}/${d.getDate()}`;
//       map[key] = { day: key, orders: 0, revenue: 0 };
//     }
//     allOrders.forEach(o => {
//       const d   = new Date(o.ordered_at || o.created_at);
//       const key = `${d.getMonth() + 1}/${d.getDate()}`;
//       if (map[key]) {
//         map[key].orders  += 1;
//         map[key].revenue += Number(o.total_amount || 0);
//       }
//     });
//     return Object.values(map);
//   })();

//   const statusCounts = (() => {
//     const m = {};
//     allOrders.forEach(o => { m[o.status] = (m[o.status] || 0) + 1; });
//     return Object.entries(m).map(([status, count]) => ({ status, count }));
//   })();

//   return (
//     <Container title="Dashboard" description="Overview of your store performance">

//       {/* Top 4 stat cards */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//         {statsLoading
//           ? Array.from({ length: 4 }).map((_, i) => (
//               <div key={i} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4 h-24 animate-pulse" />
//             ))
//           : <>
//               <StatCard label="Total Users"    value={Number(stats?.total_users    || 0).toLocaleString()} icon={Users} />
//               <StatCard label="Total Products" value={Number(stats?.total_products || 0).toLocaleString()} icon={Package} />
//               <StatCard label="Total Orders"   value={Number(stats?.total_orders   || 0).toLocaleString()} icon={ShoppingCart} />
//               <StatCard label="Revenue"        value={`৳${Number(stats?.total_revenue || 0).toLocaleString()}`} icon={DollarSign} />
//             </>
//         }
//       </div>

//       {/* User breakdown — no emoji, no vendors */}
//       <UserSegmentGrid stats={stats} loading={statsLoading} />

//       {/* Pending Orders — inside breakdown already via WS Pending; show as single stat */}
//       {!statsLoading && (
//         <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 border-l-4 border-l-amber-400 rounded-lg px-4 py-3 flex items-center gap-3 w-fit">
//           <div>
//             <p className="text-xs text-gray-500 dark:text-gray-400">Pending Orders</p>
//             <p className="text-xl font-bold text-gray-900 dark:text-white">
//               {Number(stats?.pending_orders || 0).toLocaleString()}
//             </p>
//           </div>
//         </div>
//       )}

//       {/* Charts */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//         <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
//           <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Revenue — Last 14 Days</h3>
//           <div className="h-48">
//             <ResponsiveContainer width="100%" height="100%">
//               <AreaChart data={dailyTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
//                 <defs>
//                   <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.25} />
//                     <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
//                   </linearGradient>
//                 </defs>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
//                 <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#9ca3af" interval={3} />
//                 <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
//                 <Tooltip
//                   contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
//                   formatter={(v, n) => [n === "revenue" ? `৳${Number(v).toLocaleString()}` : v, n === "revenue" ? "Revenue" : "Orders"]}
//                 />
//                 <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fill="url(#revGrad)" strokeWidth={2} dot={false} />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
//           <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Orders by Status</h3>
//           <div className="h-48">
//             {statusCounts.length === 0
//               ? <div className="flex items-center justify-center h-full text-sm text-gray-400">No orders yet</div>
//               : <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={statusCounts} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
//                     <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
//                     <XAxis dataKey="status" tick={{ fontSize: 10 }} stroke="#9ca3af" />
//                     <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" allowDecimals={false} />
//                     <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
//                     <Bar dataKey="count" name="Orders" radius={[4, 4, 0, 0]}>
//                       {statusCounts.map((e, i) => (
//                         <Cell key={i} fill={BAR_COLORS[e.status] || "#6b7280"} />
//                       ))}
//                     </Bar>
//                   </BarChart>
//                 </ResponsiveContainer>
//             }
//           </div>
//         </div>
//       </div>

//       {/* Recent Orders table */}
//       <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg">
//         <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
//           <h2 className="text-sm font-medium text-gray-900 dark:text-white">Recent Orders</h2>
//           <span className="text-xs text-gray-400">{allOrders.length} total fetched</span>
//         </div>
//         {!ordersRaw
//           ? <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
//           : <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead>
//                   <tr className="border-b border-gray-200 dark:border-gray-800">
//                     {["Order", "Customer", "Total", "Status", "Date"].map(h => (
//                       <th key={h} className="px-4 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">{h}</th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {recentOrders.length === 0
//                     ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No orders yet</td></tr>
//                     : recentOrders.map(order => {
//                         const sc = STATUS_COLORS[order.status?.toLowerCase()] || { bg: "bg-gray-100", text: "text-gray-600" };
//                         return (
//                           <tr key={order.id || order.order_number} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0">
//                             <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">{order.order_number}</td>
//                             <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{order.customer_name}</td>
//                             <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">৳{Number(order.total_amount).toLocaleString()}</td>
//                             <td className="px-4 py-2.5">
//                               <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${sc.bg} ${sc.text}`}>
//                                 {order.status_display || order.status}
//                               </span>
//                             </td>
//                             <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">
//                               {order.ordered_at ? new Date(order.ordered_at).toLocaleDateString() : "—"}
//                             </td>
//                           </tr>
//                         );
//                       })
//                   }
//                 </tbody>
//               </table>
//             </div>
//         }
//       </div>
//     </Container>
//   );
// }




// src/app/dashboard/page.jsx
"use client";

import { DollarSign, ShoppingCart, Users, Package, Loader2, Store, MapPin, ToggleLeft, ToggleRight, Archive, Tag } from "lucide-react";
import useSWR from "swr";
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Container from "@/app/dashboard/_components/Container";
import StatCard from "@/app/dashboard/_components/StatCard";
import { fetchAdminDashboardStats } from "@/app/dashboard/_lib/auth";
import { ordersService, storesService, leftoverPacksService, offersService } from "@/app/dashboard/_lib/services";

const STATUS_COLORS = {
  pending:    { bg: "bg-amber-50 dark:bg-amber-950/30",    text: "text-amber-700 dark:text-amber-400" },
  processing: { bg: "bg-blue-50 dark:bg-blue-950/30",      text: "text-blue-700 dark:text-blue-400" },
  shipped:    { bg: "bg-violet-50 dark:bg-violet-950/30",  text: "text-violet-700 dark:text-violet-400" },
  delivered:  { bg: "bg-emerald-50 dark:bg-emerald-950/30",text: "text-emerald-700 dark:text-emerald-400" },
  cancelled:  { bg: "bg-red-50 dark:bg-red-950/30",        text: "text-red-700 dark:text-red-400" },
};

const BAR_COLORS = {
  PENDING: "#f59e0b", PROCESSING: "#3b82f6",
  SHIPPED: "#8b5cf6", DELIVERED: "#10b981", CANCELLED: "#ef4444",
};

function UserSegmentGrid({ stats, loading }) {
  if (loading) return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="h-20 rounded-lg bg-gray-100 dark:bg-gray-900 animate-pulse" />
      ))}
    </div>
  );

  const segments = [
    { label: "Customers",    value: stats?.total_customers,   color: "border-l-blue-400" },
    { label: "Sellers",      value: stats?.total_sellers,     color: "border-l-violet-400" },
    { label: "Admins",       value: stats?.total_admins,      color: "border-l-red-400" },
    { label: "Wholesale",    value: stats?.total_wholesale,   color: "border-l-emerald-400" },
    { label: "WS Approved",  value: stats?.wholesale_approved,color: "border-l-green-400" },
    { label: "WS Pending",   value: stats?.wholesale_pending, color: "border-l-amber-400" },
    { label: "Inactive",     value: stats?.inactive_users,    color: "border-l-gray-400" },
  ];

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
        User Breakdown
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {segments.map(({ label, value, color }) => (
          <div
            key={label}
            className={`bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 border-l-4 ${color} rounded-lg px-3 py-3`}
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mb-1">{label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {Number(value || 0).toLocaleString()}
            </p>
          </div>
        ))}
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

  const { data: storesRaw, mutate: reloadStores } = useSWR(
    "dash-stores",
    () => storesService.list(),
    { revalidateOnFocus: false }
  );
  const allStores = Array.isArray(storesRaw) ? storesRaw : (storesRaw?.results || []);
  const activeStores   = allStores.filter(s => s.is_active);
  const inactiveStores = allStores.filter(s => !s.is_active);
  const allOrders    = Array.isArray(ordersRaw) ? ordersRaw : (ordersRaw?.results || []);
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
      const d   = new Date(o.ordered_at || o.created_at);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (map[key]) {
        map[key].orders  += 1;
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
    <Container title="Dashboard" description="Overview of your store performance">

      {/* Top 6 stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4 h-24 animate-pulse" />
            ))
          : <>
              <StatCard label="Total Users"    value={Number(stats?.total_users    || 0).toLocaleString()} icon={Users} />
              <StatCard label="Total Products" value={Number(stats?.total_products || 0).toLocaleString()} icon={Package} />
              <StatCard label="Active Offers"  value={activeOffers.length.toLocaleString()} icon={Tag} />
              <StatCard label="Leftover Packs" value={leftoverPacks.length.toLocaleString()} icon={Archive} />
              <StatCard label="Total Orders"   value={Number(stats?.total_orders   || 0).toLocaleString()} icon={ShoppingCart} />
              <StatCard label="Revenue"        value={`৳${Number(stats?.total_revenue || 0).toLocaleString()}`} icon={DollarSign} />
            </>
        }
      </div>

      {/* User breakdown — no emoji, no vendors */}
      <UserSegmentGrid stats={stats} loading={statsLoading} />

      {/* Secondary Metrics Row */}
      <div className="flex flex-wrap gap-4">
        {/* Pending Orders */}
        {!statsLoading && (
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 border-l-4 border-l-amber-400 rounded-lg px-5 py-3 flex items-center gap-4 w-fit shadow-sm">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 font-semibold">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                {Number(stats?.pending_orders || 0).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Offers Quick Stats */}
        {!statsLoading && (
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 border-l-4 border-l-blue-500 rounded-lg px-5 py-3 flex items-center gap-6 w-fit shadow-sm">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 font-semibold">Total Offers</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 leading-none">
                {allOffers.length.toLocaleString()}
              </p>
            </div>
            <div className="w-px h-10 bg-gray-200 dark:bg-gray-800"></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 font-semibold">Active Offers</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 leading-none">
                {activeOffers.length.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Leftover Packs Quick Stats */}
        {!statsLoading && (
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 border-l-4 border-l-emerald-400 rounded-lg px-5 py-3 flex items-center gap-6 w-fit shadow-sm">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 font-semibold">Available Packs</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 leading-none">
                {availableLeftoverPacks.toLocaleString()}
              </p>
            </div>
            <div className="w-px h-10 bg-gray-200 dark:bg-gray-800"></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 font-semibold">Packs Sold</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 leading-none">
                {soldLeftoverPacks.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Revenue — Last 14 Days</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#9ca3af" interval={3} />
                <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ fontSize: "11px", borderRadius: "8px" }}
                  formatter={(v, n) => [n === "revenue" ? `৳${Number(v).toLocaleString()}` : v, n === "revenue" ? "Revenue" : "Orders"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fill="url(#revGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Orders by Status</h3>
          <div className="h-48">
            {statusCounts.length === 0
              ? <div className="flex items-center justify-center h-full text-sm text-gray-400">No orders yet</div>
              : <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusCounts} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="status" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                    <Bar dataKey="count" name="Orders" radius={[4, 4, 0, 0]}>
                      {statusCounts.map((e, i) => (
                        <Cell key={i} fill={BAR_COLORS[e.status] || "#6b7280"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>
        </div>
      </div>

      {/* Stores Overview */}
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-medium text-gray-900 dark:text-white">Store Locations</h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              {activeStores.length} active
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
              {inactiveStores.length} inactive
            </span>
          </div>
        </div>
        {!storesRaw ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
        ) : allStores.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">No stores yet</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {allStores.slice(0, 5).map(store => (
              <div key={store.id} className="px-4 py-3 flex items-center gap-3">
                {store.image ? (
                  <img src={store.image} alt={store.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <Store className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{store.name}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {store.city}
                    {store.openTime && (
                      <span className="ml-2">· {store.openTime} — {store.closeTime}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(store.features || []).slice(0, 2).map(f => (
                    <span key={f} className="px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded capitalize">{f}</span>
                  ))}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${store.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                    {store.is_active ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                    {store.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
            {allStores.length > 5 && (
              <div className="px-4 py-2 text-xs text-gray-400 text-center">
                +{allStores.length - 5} more stores · <a href="/dashboard/stores" className="text-blue-500 hover:underline">View all</a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Orders table */}
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">Recent Orders</h2>
          <span className="text-xs text-gray-400">{allOrders.length} total fetched</span>
        </div>
        {!ordersRaw
          ? <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          : <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    {["Order", "Customer", "Total", "Status", "Date"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0
                    ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No orders yet</td></tr>
                    : recentOrders.map(order => {
                        const sc = STATUS_COLORS[order.status?.toLowerCase()] || { bg: "bg-gray-100", text: "text-gray-600" };
                        return (
                          <tr key={order.id || order.order_number} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0">
                            <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">{order.order_number}</td>
                            <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{order.customer_name}</td>
                            <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">৳{Number(order.total_amount).toLocaleString()}</td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${sc.bg} ${sc.text}`}>
                                {order.status_display || order.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">
                              {order.ordered_at ? new Date(order.ordered_at).toLocaleDateString() : "—"}
                            </td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>
            </div>
        }
      </div>
    </Container>
  );
}