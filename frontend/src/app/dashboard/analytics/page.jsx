// "use client";

// import {
//   BarChart, Bar, PieChart, Pie, Cell,
//   XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
//   AreaChart, Area, Legend,
// } from "recharts";
// import Container from "@/app/dashboard/_components/Container";
// import { TrendingUp, ShoppingCart, DollarSign, Users, Package, CheckCircle, Clock, XCircle, Loader2, BarChart2 } from "lucide-react";
// import useSWR from "swr";
// import { fetchAdminDashboardStats } from "@/app/dashboard/_lib/auth";
// import { ordersService, productsService } from "@/app/dashboard/_lib/services";

// // Chart color palette
// const PALETTE = ["#18181b", "#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];
// const STATUS_COLORS = {
//   PENDING: "#f59e0b", PROCESSING: "#3b82f6", SHIPPED: "#8b5cf6",
//   DELIVERED: "#10b981", CANCELLED: "#ef4444",
// };
// const PAYMENT_COLORS = { PAID: "#10b981", PENDING: "#f59e0b", FAILED: "#ef4444" };

// function KpiCard({ label, value, icon: Icon, sub, color = "gray" }) {
//   const colors = {
//     indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400",
//     emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
//     blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
//     amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
//     violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",
//     red: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
//     gray: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
//   };
//   return (
//     <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
//       <div className="flex items-start justify-between mb-3">
//         <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
//           <Icon className="w-4.5 h-4.5" size={18} />
//         </div>
//       </div>
//       <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
//       <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
//       {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-medium">{sub}</p>}
//     </div>
//   );
// }

// function ChartCard({ title, children, className = "" }) {
//   return (
//     <div className={`bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4 ${className}`}>
//       <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
//       {children}
//     </div>
//   );
// }

// const CustomTooltip = ({ active, payload, label, prefix = "" }) => {
//   if (!active || !payload?.length) return null;
//   return (
//     <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2 text-xs">
//       {label && <p className="text-gray-500 dark:text-gray-400 mb-1">{label}</p>}
//       {payload.map((p, i) => (
//         <p key={i} className="font-medium" style={{ color: p.color || p.fill }}>
//           {p.name}: {prefix}{typeof p.value === "number" ? p.value.toLocaleString() : p.value}
//         </p>
//       ))}
//     </div>
//   );
// };

// export default function AnalyticsPage() {
//   const { data: rawStats, isLoading: statsLoading } = useSWR(
//     "analytics-stats", fetchAdminDashboardStats, { revalidateOnFocus: false }
//   );
//   const { data: recentOrders } = useSWR(
//     "analytics-orders",
//     () => ordersService.list({ page_size: 500, ordering: "-ordered_at" }),
//     { revalidateOnFocus: false }
//   );
//   const { data: topProductsRaw } = useSWR(
//     "analytics-products",
//     () => productsService.list({ page_size: 10, ordering: "-created_at" }),
//     { revalidateOnFocus: false }
//   );

//   const stats = rawStats?.statistics || rawStats || {};
//   const orders = recentOrders?.results || (Array.isArray(recentOrders) ? recentOrders : []);
//   const topProducts = (topProductsRaw?.results || (Array.isArray(topProductsRaw) ? topProductsRaw : [])).slice(0, 10);

//   // ─── Computed Metrics ───────────────────────────────────────────────────────
//   const totalRevenue = Number(stats?.total_revenue || 0) || orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
//   const totalOrders = Number(stats?.total_orders || 0) || orders.length;
//   const totalUsers = Number(stats?.total_users || 0);
//   const totalProducts = Number(stats?.total_products || 0);
//   const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
//   const deliveredCount = orders.filter(o => o.status === "DELIVERED").length;
//   const deliveryRate = orders.length > 0 ? Math.round((deliveredCount / orders.length) * 100) : 0;
//   const paidCount = orders.filter(o => o.payment_status === "PAID").length;
//   const pendingCount = orders.filter(o => o.status === "PENDING").length;

//   // ─── Monthly Aggregations ────────────────────────────────────────────────────
//   const MONTH_ORDER = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
//   const monthlyMap = {};
//   orders.forEach(o => {
//     const d = new Date(o.ordered_at);
//     const key = d.toLocaleString("default", { month: "short" });
//     if (!monthlyMap[key]) monthlyMap[key] = { month: key, revenue: 0, orders: 0, monthIdx: d.getMonth() };
//     monthlyMap[key].revenue += Number(o.total_amount || 0);
//     monthlyMap[key].orders += 1;
//   });
//   const monthlyData = Object.values(monthlyMap)
//     .sort((a, b) => a.monthIdx - b.monthIdx)
//     .map(m => ({ ...m, revenue: Math.round(m.revenue) }));

//   // ─── Last 14 days daily orders ───────────────────────────────────────────────
//   const dailyMap = {};
//   const now = new Date();
//   for (let i = 13; i >= 0; i--) {
//     const d = new Date(now); d.setDate(d.getDate() - i);
//     const key = `${d.getMonth()+1}/${d.getDate()}`;
//     dailyMap[key] = { day: key, orders: 0, revenue: 0 };
//   }
//   orders.forEach(o => {
//     const d = new Date(o.ordered_at);
//     const key = `${d.getMonth()+1}/${d.getDate()}`;
//     if (dailyMap[key]) {
//       dailyMap[key].orders += 1;
//       dailyMap[key].revenue += Number(o.total_amount || 0);
//     }
//   });
//   const dailyData = Object.values(dailyMap);

//   // ─── Status & Payment Breakdown ──────────────────────────────────────────────
//   const statusMap = {};
//   const paymentMap = {};
//   orders.forEach(o => {
//     statusMap[o.status] = (statusMap[o.status] || 0) + 1;
//     paymentMap[o.payment_status] = (paymentMap[o.payment_status] || 0) + 1;
//   });
//   const statusBreakdown = Object.entries(statusMap).map(([name, value]) => ({ name, value }));
//   const paymentBreakdown = Object.entries(paymentMap).map(([name, value]) => ({ name, value }));

//   if (statsLoading) {
//     return (
//       <Container title="Analytics" description="Store performance metrics">
//         <div className="flex items-center justify-center py-20">
//           <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
//         </div>
//       </Container>
//     );
//   }

//   return (
//     <Container title="Analytics" description="Real-time store performance metrics and insights">

//       {/* KPI Row 1 */}
//       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
//         <KpiCard label="Total Revenue" value={`৳${totalRevenue.toLocaleString()}`} icon={DollarSign} color="emerald" sub="all time" />
//         <KpiCard label="Total Orders" value={totalOrders.toLocaleString()} icon={ShoppingCart} color="blue" sub={`${pendingCount} pending`} />
//         <KpiCard label="Avg Order Value" value={`৳${avgOrderValue.toLocaleString()}`} icon={TrendingUp} color="indigo" sub="per order" />
//         <KpiCard label="Delivery Rate" value={`${deliveryRate}%`} icon={CheckCircle} color="emerald" sub={`${deliveredCount} delivered`} />
//         <KpiCard label="Total Users" value={totalUsers.toLocaleString()} icon={Users} color="violet" sub={`${stats?.total_customers || 0} customers`} />
//         <KpiCard label="Products" value={totalProducts.toLocaleString()} icon={Package} color="amber" sub="listed" />
//       </div>

//       {/* Charts Row 1: Revenue + Daily Orders */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//         <ChartCard title="Monthly Revenue (৳)">
//           <div className="h-56">
//             {monthlyData.length > 0 ? (
//               <ResponsiveContainer width="100%" height="100%">
//                 <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
//                   <defs>
//                     <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
//                       <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
//                       <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
//                     </linearGradient>
//                   </defs>
//                   <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
//                   <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
//                   <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
//                   <Tooltip content={<CustomTooltip prefix="৳" />} />
//                   <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#4f46e5" fill="url(#revGrad)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
//                 </AreaChart>
//               </ResponsiveContainer>
//             ) : (
//               <div className="flex items-center justify-center h-full text-sm text-gray-400">No revenue data yet</div>
//             )}
//           </div>
//         </ChartCard>

//         <ChartCard title="Monthly Order Volume">
//           <div className="h-56">
//             {monthlyData.length > 0 ? (
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
//                   <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
//                   <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
//                   <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
//                   <Tooltip content={<CustomTooltip />} />
//                   <Bar dataKey="orders" name="Orders" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
//                 </BarChart>
//               </ResponsiveContainer>
//             ) : (
//               <div className="flex items-center justify-center h-full text-sm text-gray-400">No order data yet</div>
//             )}
//           </div>
//         </ChartCard>
//       </div>

//       {/* Charts Row 2: Daily trend + Status + Payment */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//         <ChartCard title="Last 14 Days — Daily Orders" className="lg:col-span-1">
//           <div className="h-48">
//             <ResponsiveContainer width="100%" height="100%">
//               <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
//                 <defs>
//                   <linearGradient id="dayGrad" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
//                     <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
//                   </linearGradient>
//                 </defs>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
//                 <XAxis dataKey="day" tick={{ fontSize: 9 }} stroke="#9ca3af" interval={3} />
//                 <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" allowDecimals={false} />
//                 <Tooltip content={<CustomTooltip />} />
//                 <Area type="monotone" dataKey="orders" name="Orders" stroke="#10b981" fill="url(#dayGrad)" strokeWidth={2} dot={false} />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </ChartCard>

//         <ChartCard title="Orders by Status">
//           <div className="h-36">
//             {statusBreakdown.length > 0 ? (
//               <ResponsiveContainer width="100%" height="100%">
//                 <PieChart>
//                   <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={35} outerRadius={58} dataKey="value" stroke="none">
//                     {statusBreakdown.map((entry, i) => (
//                       <Cell key={i} fill={STATUS_COLORS[entry.name] || PALETTE[i % PALETTE.length]} />
//                     ))}
//                   </Pie>
//                   <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
//                 </PieChart>
//               </ResponsiveContainer>
//             ) : (
//               <div className="flex items-center justify-center h-full text-xs text-gray-400">No data</div>
//             )}
//           </div>
//           <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
//             {statusBreakdown.map(item => (
//               <span key={item.name} className="flex items-center gap-1 text-[10px] text-gray-500">
//                 <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: STATUS_COLORS[item.name] || "#999" }} />
//                 {item.name} ({item.value})
//               </span>
//             ))}
//           </div>
//         </ChartCard>

//         <ChartCard title="Payment Status">
//           <div className="h-36">
//             {paymentBreakdown.length > 0 ? (
//               <ResponsiveContainer width="100%" height="100%">
//                 <PieChart>
//                   <Pie data={paymentBreakdown} cx="50%" cy="50%" innerRadius={35} outerRadius={58} dataKey="value" stroke="none">
//                     {paymentBreakdown.map((entry, i) => (
//                       <Cell key={i} fill={PAYMENT_COLORS[entry.name] || PALETTE[i % PALETTE.length]} />
//                     ))}
//                   </Pie>
//                   <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
//                 </PieChart>
//               </ResponsiveContainer>
//             ) : (
//               <div className="flex items-center justify-center h-full text-xs text-gray-400">No data</div>
//             )}
//           </div>
//           <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
//             {paymentBreakdown.map(item => (
//               <span key={item.name} className="flex items-center gap-1 text-[10px] text-gray-500">
//                 <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: PAYMENT_COLORS[item.name] || "#999" }} />
//                 {item.name} ({item.value})
//               </span>
//             ))}
//           </div>
//         </ChartCard>
//       </div>

//       {/* Summary Metric Boxes */}
//       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
//         {[
//           ["Customers", stats?.total_customers || 0, "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"],
//           ["Sellers", stats?.total_sellers || 0, "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"],
//           ["Vendors", stats?.total_vendors || 0, "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400"],
//           ["Admins", stats?.total_admins || 0, "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"],
//           ["Paid Orders", paidCount, "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"],
//           ["Cancelled", statusMap.CANCELLED || 0, "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"],
//         ].map(([label, val, cls]) => (
//           <div key={label} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
//             <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
//             <p className={`text-xl font-bold mt-0.5 ${cls}`}>{Number(val).toLocaleString()}</p>
//           </div>
//         ))}
//       </div>

//       {/* Top Products */}
//       <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg">
//         <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
//           <BarChart2 className="w-4 h-4 text-gray-400" />
//           <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Product Inventory Overview</h3>
//         </div>
//         {topProducts.length > 0 ? (
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead>
//                 <tr className="border-b border-gray-100 dark:border-gray-800">
//                   {["#", "Product Name", "Price", "Stock", "Status", "Stock Level"].map(h => (
//                     <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{h}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {topProducts.map((product, i) => {
//                   const maxStock = Math.max(...topProducts.map(p => Number(p.stock || 0)), 1);
//                   const stockPct = Math.min(100, (Number(product.stock || 0) / maxStock) * 100);
//                   const stockColor = stockPct > 60 ? "#10b981" : stockPct > 25 ? "#f59e0b" : "#ef4444";
//                   return (
//                     <tr key={product.id || i} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
//                       <td className="px-4 py-2.5 text-xs text-gray-400">{i + 1}</td>
//                       <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">{product.name}</td>
//                       <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">৳{Number(product.price || 0).toLocaleString()}</td>
//                       <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 font-medium">{product.stock ?? "—"}</td>
//                       <td className="px-4 py-2.5">
//                         <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${product.is_active !== false ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800"}`}>
//                           {product.is_active !== false ? "Active" : "Inactive"}
//                         </span>
//                       </td>
//                       <td className="px-4 py-2.5 w-32">
//                         <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full">
//                           <div className="h-1.5 rounded-full transition-all" style={{ width: `${stockPct}%`, backgroundColor: stockColor }} />
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         ) : (
//           <div className="px-4 py-8 text-center text-sm text-gray-400">No products data available</div>
//         )}
//       </div>

//     </Container>
//   );
// }

"use client";

import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend,
} from "recharts";
import Container from "@/app/dashboard/_components/Container";
import { TrendingUp, ShoppingCart, DollarSign, Users, Package, CheckCircle, Clock, XCircle, Loader2, BarChart2, Store, MapPin } from "lucide-react";
import useSWR from "swr";
import { fetchAdminDashboardStats } from "@/app/dashboard/_lib/auth";
import { ordersService, productsService, storesService } from "@/app/dashboard/_lib/services";

// Chart color palette
const PALETTE = ["#18181b", "#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];
const STATUS_COLORS = {
  PENDING: "#f59e0b", PROCESSING: "#3b82f6", SHIPPED: "#8b5cf6",
  DELIVERED: "#10b981", CANCELLED: "#ef4444",
};
const PAYMENT_COLORS = { PAID: "#10b981", PENDING: "#f59e0b", FAILED: "#ef4444" };

function KpiCard({ label, value, icon: Icon, sub, color = "gray" }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",
    red: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
    gray: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  };
  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-4.5 h-4.5" size={18} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-medium">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children, className = "" }) {
  return (
    <div className={`bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, prefix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2 text-xs">
      {label && <p className="text-gray-500 dark:text-gray-400 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="font-medium" style={{ color: p.color || p.fill }}>
          {p.name}: {prefix}{typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { data: rawStats, isLoading: statsLoading } = useSWR(
    "analytics-stats", fetchAdminDashboardStats, { revalidateOnFocus: false }
  );
  const { data: recentOrders } = useSWR(
    "analytics-orders",
    () => ordersService.list({ page_size: 500, ordering: "-ordered_at" }),
    { revalidateOnFocus: false }
  );
  const { data: topProductsRaw } = useSWR(
    "analytics-products",
    () => productsService.list({ page_size: 10, ordering: "-created_at" }),
    { revalidateOnFocus: false }
  );

  const { data: storesRaw } = useSWR(
    "analytics-stores",
    () => storesService.list(),
    { revalidateOnFocus: false }
  );
  const allStores      = Array.isArray(storesRaw) ? storesRaw : (storesRaw?.results || []);
  const activeStores   = allStores.filter(s => s.is_active);
  const inactiveStores = allStores.filter(s => !s.is_active);

  // Feature breakdown across all stores
  const featureMap = {};
  allStores.forEach(s => (s.features || []).forEach(f => {
    featureMap[f] = (featureMap[f] || 0) + 1;
  }));
  const featureBreakdown = Object.entries(featureMap).map(([name, value]) => ({ name, value }));

  const stats = rawStats?.statistics || rawStats || {};
  const orders = recentOrders?.results || (Array.isArray(recentOrders) ? recentOrders : []);
  const topProducts = (topProductsRaw?.results || (Array.isArray(topProductsRaw) ? topProductsRaw : [])).slice(0, 10);

  // ─── Computed Metrics ───────────────────────────────────────────────────────
  const totalRevenue = Number(stats?.total_revenue || 0) || orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const totalOrders = Number(stats?.total_orders || 0) || orders.length;
  const totalUsers = Number(stats?.total_users || 0);
  const totalProducts = Number(stats?.total_products || 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const deliveredCount = orders.filter(o => o.status === "DELIVERED").length;
  const deliveryRate = orders.length > 0 ? Math.round((deliveredCount / orders.length) * 100) : 0;
  const paidCount = orders.filter(o => o.payment_status === "PAID").length;
  const pendingCount = orders.filter(o => o.status === "PENDING").length;

  // ─── Monthly Aggregations ────────────────────────────────────────────────────
  const MONTH_ORDER = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthlyMap = {};
  orders.forEach(o => {
    const d = new Date(o.ordered_at);
    const key = d.toLocaleString("default", { month: "short" });
    if (!monthlyMap[key]) monthlyMap[key] = { month: key, revenue: 0, orders: 0, monthIdx: d.getMonth() };
    monthlyMap[key].revenue += Number(o.total_amount || 0);
    monthlyMap[key].orders += 1;
  });
  const monthlyData = Object.values(monthlyMap)
    .sort((a, b) => a.monthIdx - b.monthIdx)
    .map(m => ({ ...m, revenue: Math.round(m.revenue) }));

  // ─── Last 14 days daily orders ───────────────────────────────────────────────
  const dailyMap = {};
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const key = `${d.getMonth()+1}/${d.getDate()}`;
    dailyMap[key] = { day: key, orders: 0, revenue: 0 };
  }
  orders.forEach(o => {
    const d = new Date(o.ordered_at);
    const key = `${d.getMonth()+1}/${d.getDate()}`;
    if (dailyMap[key]) {
      dailyMap[key].orders += 1;
      dailyMap[key].revenue += Number(o.total_amount || 0);
    }
  });
  const dailyData = Object.values(dailyMap);

  // ─── Status & Payment Breakdown ──────────────────────────────────────────────
  const statusMap = {};
  const paymentMap = {};
  orders.forEach(o => {
    statusMap[o.status] = (statusMap[o.status] || 0) + 1;
    paymentMap[o.payment_status] = (paymentMap[o.payment_status] || 0) + 1;
  });
  const statusBreakdown = Object.entries(statusMap).map(([name, value]) => ({ name, value }));
  const paymentBreakdown = Object.entries(paymentMap).map(([name, value]) => ({ name, value }));

  if (statsLoading) {
    return (
      <Container title="Analytics" description="Store performance metrics">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </Container>
    );
  }

  return (
    <Container title="Analytics" description="Real-time store performance metrics and insights">

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Total Revenue" value={`৳${totalRevenue.toLocaleString()}`} icon={DollarSign} color="emerald" sub="all time" />
        <KpiCard label="Total Orders" value={totalOrders.toLocaleString()} icon={ShoppingCart} color="blue" sub={`${pendingCount} pending`} />
        <KpiCard label="Avg Order Value" value={`৳${avgOrderValue.toLocaleString()}`} icon={TrendingUp} color="indigo" sub="per order" />
        <KpiCard label="Delivery Rate" value={`${deliveryRate}%`} icon={CheckCircle} color="emerald" sub={`${deliveredCount} delivered`} />
        <KpiCard label="Total Users" value={totalUsers.toLocaleString()} icon={Users} color="violet" sub={`${stats?.total_customers || 0} customers`} />
        <KpiCard label="Products" value={totalProducts.toLocaleString()} icon={Package} color="amber" sub="listed" />
      </div>

      {/* Charts Row 1: Revenue + Daily Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Monthly Revenue (৳)">
          <div className="h-56">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip content={<CustomTooltip prefix="৳" />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#4f46e5" fill="url(#revGrad)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">No revenue data yet</div>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Monthly Order Volume">
          <div className="h-56">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="orders" name="Orders" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">No order data yet</div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 2: Daily trend + Status + Payment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Last 14 Days — Daily Orders" className="lg:col-span-1">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="dayGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} stroke="#9ca3af" interval={3} />
                <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="orders" name="Orders" stroke="#10b981" fill="url(#dayGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Orders by Status">
          <div className="h-36">
            {statusBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={35} outerRadius={58} dataKey="value" stroke="none">
                    {statusBreakdown.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name] || PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">No data</div>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
            {statusBreakdown.map(item => (
              <span key={item.name} className="flex items-center gap-1 text-[10px] text-gray-500">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: STATUS_COLORS[item.name] || "#999" }} />
                {item.name} ({item.value})
              </span>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Payment Status">
          <div className="h-36">
            {paymentBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentBreakdown} cx="50%" cy="50%" innerRadius={35} outerRadius={58} dataKey="value" stroke="none">
                    {paymentBreakdown.map((entry, i) => (
                      <Cell key={i} fill={PAYMENT_COLORS[entry.name] || PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">No data</div>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
            {paymentBreakdown.map(item => (
              <span key={item.name} className="flex items-center gap-1 text-[10px] text-gray-500">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: PAYMENT_COLORS[item.name] || "#999" }} />
                {item.name} ({item.value})
              </span>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Summary Metric Boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          ["Customers", stats?.total_customers || 0, "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"],
          ["Sellers", stats?.total_sellers || 0, "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"],
          ["Vendors", stats?.total_vendors || 0, "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400"],
          ["Admins", stats?.total_admins || 0, "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"],
          ["Paid Orders", paidCount, "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"],
          ["Cancelled", statusMap.CANCELLED || 0, "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"],
        ].map(([label, val, cls]) => (
          <div key={label} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className={`text-xl font-bold mt-0.5 ${cls}`}>{Number(val).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Stores Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Store stats */}
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Store Summary</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Total Stores',    value: allStores.length,   color: 'text-gray-900 dark:text-white' },
              { label: 'Active',          value: activeStores.length, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Inactive',        value: inactiveStores.length, color: 'text-gray-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <span className="text-xs text-gray-500">{label}</span>
                <span className={`text-sm font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Feature distribution bar chart */}
        <ChartCard title="Store Features Distribution">
          <div className="h-36">
            {featureBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureBreakdown} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Stores" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">No stores data</div>
            )}
          </div>
        </ChartCard>

        {/* Store list */}
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Store Locations</h3>
          </div>
          <div className="space-y-2 max-h-36 overflow-y-auto">
            {allStores.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No stores yet</p>
            ) : allStores.map(store => (
              <div key={store.id} className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${store.is_active ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{store.name}</p>
                  <p className="text-[10px] text-gray-400">{store.city}</p>
                </div>
                {(store.features || []).slice(0, 1).map(f => (
                  <span key={f} className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 rounded capitalize">{f}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Product Inventory Overview</h3>
        </div>
        {topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {["#", "Product Name", "Price", "Stock", "Status", "Stock Level"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, i) => {
                  const maxStock = Math.max(...topProducts.map(p => Number(p.stock || 0)), 1);
                  const stockPct = Math.min(100, (Number(product.stock || 0) / maxStock) * 100);
                  const stockColor = stockPct > 60 ? "#10b981" : stockPct > 25 ? "#f59e0b" : "#ef4444";
                  return (
                    <tr key={product.id || i} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-gray-400">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">{product.name}</td>
                      <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">৳{Number(product.price || 0).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 font-medium">{product.stock ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${product.is_active !== false ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800"}`}>
                          {product.is_active !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 w-32">
                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full">
                          <div className="h-1.5 rounded-full transition-all" style={{ width: `${stockPct}%`, backgroundColor: stockColor }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-gray-400">No products data available</div>
        )}
      </div>

    </Container>
  );
}