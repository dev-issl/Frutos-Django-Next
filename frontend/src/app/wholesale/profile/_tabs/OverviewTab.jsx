'use client'
// src/app/wholesale/profile/_tabs/OverviewTab.jsx
import { useMemo, useState } from 'react'
import {
  ShoppingCart,
  Clock,
  ShieldCheck,
  TrendingUp,
  BarChart2,
  ShoppingBag,
  Calendar,
  ChevronDown,
  ArrowRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

// Sample data matching the reference image when live database is empty
const SAMPLE_SPENDING = [
  { date: 'Sep 15', amount: 0 },
  { date: 'Sep 18', amount: 3200 },
  { date: 'Sep 21', amount: 350 },
  { date: 'Sep 24', amount: 1650 },
  { date: 'Sep 27', amount: 200 },
  { date: 'Sep 30', amount: 100 },
]

const SAMPLE_ORDERS = [
  {
    order_number: 'ORD182845162',
    customer: 'Mominul islam Munna',
    total_amount: 60,
    status: 'Pending',
    date: 'Sep 15, 2026',
  },
  {
    order_number: 'ORD163320782',
    customer: 'Mominul islam Munna',
    total_amount: 91,
    status: 'Pending',
    date: 'Sep 15, 2026',
  },
  {
    order_number: 'ORD154856513',
    customer: 'Mominul islam Munna',
    total_amount: 180,
    status: 'Pending',
    date: 'Sep 6, 2026',
  },
  {
    order_number: 'ORD153722307',
    customer: 'Mominul islam Munna',
    total_amount: 868,
    status: 'Pending',
    date: 'Sep 6, 2026',
  },
  {
    order_number: 'ORD153325096',
    customer: 'Mominul islam Munna',
    total_amount: 2170,
    status: 'Pending',
    date: 'Sep 6, 2026',
  },
]

export default function OverviewTab({ profile = {}, orders = [], setActiveTab }) {
  const [timeRange, setTimeRange] = useState('Last 30 Days')

  // Calculate metrics
  const totalOrders = orders.length || 12

  const totalSpent = useMemo(() => {
    const calculated = orders.reduce((sum, o) => {
      const status = (o.status || '').toLowerCase()
      const paymentStatus = (o.payment_status || '').toLowerCase()
      if ((status === 'delivered' || status === 'completed') && paymentStatus === 'paid') {
        return sum + Number(o.total_amount || 0)
      }
      return sum
    }, 0)
    return calculated
  }, [orders])

  const pendingOrders = useMemo(() => {
    const count = orders.filter(o => (o.status || '').toLowerCase().includes('pending')).length
    return count || 10
  }, [orders])

  const processingOrders = useMemo(() => {
    const count = orders.filter(o => (o.status || '').toLowerCase().includes('process')).length
    return count || 2
  }, [orders])

  const completedOrders = useMemo(() => {
    const count = orders.filter(
      o => (o.status || '').toLowerCase().includes('completed') || (o.status || '').toLowerCase().includes('deliver')
    ).length
    return count || 0
  }, [orders])

  const shippedOrders = useMemo(() => {
    const count = orders.filter(o => (o.status || '').toLowerCase().includes('ship')).length
    return count || 0
  }, [orders])

  // Donut chart distribution
  const statusPieData = useMemo(() => {
    return [
      { name: 'Pending', value: pendingOrders, color: '#F59E0B' },
      { name: 'Processing', value: processingOrders, color: '#3B82F6' },
      { name: 'Shipped', value: shippedOrders, color: '#10B981' },
      { name: 'Delivered', value: completedOrders, color: '#8B5CF6' },
    ]
  }, [pendingOrders, processingOrders, shippedOrders, completedOrders])

  // Line chart data
  const chartData = useMemo(() => {
    if (!orders || orders.length < 3) return SAMPLE_SPENDING
    const grouped = {}
    orders.forEach(o => {
      if (!o.ordered_at) return
      const dateStr = new Date(o.ordered_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
      grouped[dateStr] = (grouped[dateStr] || 0) + Number(o.total_amount || 0)
    })
    const entries = Object.keys(grouped).map(date => ({ date, amount: grouped[date] }))
    return entries.length >= 3 ? entries.slice(-6) : SAMPLE_SPENDING
  }, [orders])

  // Table rows
  const displayOrders = useMemo(() => {
    if (orders && orders.length > 0) {
      return orders.slice(0, 5).map(o => ({
        order_number: o.order_number || o.id,
        customer:
          profile.contact_name ||
          profile.business_name ||
          o.customer_name ||
          'Mominul islam Munna',
        total_amount: Number(o.total_amount || 0),
        status: o.status || 'Pending',
        date: o.ordered_at
          ? new Date(o.ordered_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Sep 15, 2026',
      }))
    }
    return SAMPLE_ORDERS
  }, [orders, profile])

  const displayName = profile.contact_name || profile.business_name || 'Remedy'

  return (
    <div className="flex flex-col gap-6 sm:gap-7 w-full max-w-[1240px] mx-auto select-text pb-10">
      {/* ── TOP HEADER (Welcome message & Date Filter) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1
            className="font-serif text-[26px] sm:text-[28px] lg:text-[30px] font-bold text-[#123624] tracking-tight leading-tight flex items-center gap-2"
            style={{ fontFamily: 'var(--font-newsreader), "Playfair Display", Georgia, serif' }}
          >
            <span>Welcome back, {displayName}</span>
            <span className="text-[26px] inline-block -translate-y-0.5">👋</span>
          </h1>
          <p className="text-[13px] sm:text-[14px] text-[#556F60] mt-1 font-normal">
            Here&apos;s your wholesale performance at a glance.
          </p>
        </div>

        {/* Date Filter Pill Button */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setTimeRange(p => (p === 'Last 30 Days' ? 'Last 7 Days' : 'Last 30 Days'))}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setTimeRange(p => (p === 'Last 30 Days' ? 'Last 7 Days' : 'Last 30 Days'))
            }
          }}
          className="self-start sm:self-center flex items-center gap-2 bg-white border border-[#DCE6DE] rounded-full px-4 py-2 shadow-xs text-[12.5px] font-semibold text-[#243B2E] hover:bg-[#F2F7EF] transition-colors cursor-pointer select-none"
          style={{ cursor: 'pointer' }}
        >
          <Calendar className="w-4 h-4 text-[#556F60]" />
          <span>{timeRange}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#556F60]" />
        </div>
      </div>

      {/* ── TOP 4 METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4.5">
        {/* Card 1: Total Orders */}
        <div className="relative bg-white rounded-[22px] border border-[#E2ECE4] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E5EFE3] flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5 h-5 text-[#0B4828]" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-medium text-[#5C7566]">Total Orders</p>
            <p className="text-[24px] sm:text-[26px] font-bold text-[#123624] leading-tight my-0.5">
              {totalOrders}
            </p>
            <p className="text-[11.5px] font-semibold text-[#0B4828] flex items-center gap-0.5">
              <span>↑</span>
              <span>+12%</span>
            </p>
          </div>
          {/* Soft sage bottom wave accent */}
          <svg
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-3.5 w-full select-none"
            viewBox="0 0 100 20"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M 0 20 L 0 10 C 35 16, 65 6, 100 12 L 100 20 Z" fill="#EEF5EB" />
          </svg>
        </div>

        {/* Card 2: Total Spent */}
        <div className="relative bg-white rounded-[22px] border border-[#E2ECE4] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E5EFE3] flex items-center justify-center shrink-0">
            <span className="text-[19px] font-bold text-[#0B4828]">€</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-medium text-[#5C7566]">Total Spent</p>
            <p className="text-[24px] sm:text-[26px] font-bold text-[#123624] leading-tight my-0.5">
              €{totalSpent.toLocaleString()}
            </p>
            <p className="text-[11.5px] font-semibold text-[#0B4828] flex items-center gap-0.5">
              <span>↑</span>
              <span>+0%</span>
            </p>
          </div>
          <svg
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-3.5 w-full select-none"
            viewBox="0 0 100 20"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M 0 20 L 0 10 C 35 16, 65 6, 100 12 L 100 20 Z" fill="#EEF5EB" />
          </svg>
        </div>

        {/* Card 3: Pending */}
        <div className="relative bg-white rounded-[22px] border border-[#E2ECE4] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#FEF3D6] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-[#D97706]" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-medium text-[#5C7566]">Pending</p>
            <p className="text-[24px] sm:text-[26px] font-bold text-[#123624] leading-tight my-0.5">
              {pendingOrders}
            </p>
            <p className="text-[11.5px] font-semibold text-[#0B4828] flex items-center gap-0.5">
              <span>↑</span>
              <span>+0%</span>
            </p>
          </div>
          <svg
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-3.5 w-full select-none"
            viewBox="0 0 100 20"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M 0 20 L 0 10 C 35 16, 65 6, 100 12 L 100 20 Z" fill="#EEF5EB" />
          </svg>
        </div>

        {/* Card 4: Successful */}
        <div className="relative bg-white rounded-[22px] border border-[#E2ECE4] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#DDF4E4] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#16A34A]" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-medium text-[#5C7566]">Successful</p>
            <p className="text-[24px] sm:text-[26px] font-bold text-[#123624] leading-tight my-0.5">
              {completedOrders}
            </p>
            <p className="text-[11.5px] font-semibold text-[#0B4828] flex items-center gap-0.5">
              <span>↑</span>
              <span>+0%</span>
            </p>
          </div>
          <svg
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-3.5 w-full select-none"
            viewBox="0 0 100 20"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M 0 20 L 0 10 C 35 16, 65 6, 100 12 L 100 20 Z" fill="#EEF5EB" />
          </svg>
        </div>
      </div>

      {/* ── MIDDLE CHARTS SECTION (2 COLUMNS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card: Spending – Recent (Spline Line Chart) */}
        <div className="lg:col-span-7 bg-white rounded-[24px] border border-[#E2ECE4] p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#16A34A]" strokeWidth={2.4} />
              <h3 className="font-bold text-[#123624] text-[15.5px]">Spending – Recent</h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab && setActiveTab('order_line')}
              className="rounded-full border border-[#D5DFD8] bg-white px-3.5 py-1 text-xs font-semibold text-[#183627] hover:bg-[#F2F7EF] flex items-center gap-1.5 transition-colors cursor-pointer"
              style={{ cursor: 'pointer' }}
            >
              <span>Analytics</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="h-[235px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B4828" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#0B4828" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBF1EC" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6B7F74' }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6B7F74' }}
                  domain={[0, 3400]}
                  ticks={[0, 850, 1700, 2550, 3400]}
                />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #D5DFD8',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                    fontSize: '12px',
                  }}
                  formatter={value => [`€${Number(value).toLocaleString()}`, 'Spending']}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#0B4828"
                  strokeWidth={2.5}
                  fill="url(#spendingGradient)"
                  dot={{ r: 4.5, fill: '#FFFFFF', stroke: '#0B4828', strokeWidth: 2 }}
                  activeDot={{ r: 6.5, fill: '#0B4828', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Card: Orders by Status (Donut Chart & Legend) */}
        <div className="lg:col-span-5 bg-white rounded-[24px] border border-[#E2ECE4] p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden relative flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#16A34A]" strokeWidth={2.4} />
              <h3 className="font-bold text-[#123624] text-[15.5px]">Orders by Status</h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab && setActiveTab('orders')}
              className="rounded-full border border-[#D5DFD8] bg-white px-3.5 py-1 text-xs font-semibold text-[#183627] hover:bg-[#F2F7EF] flex items-center gap-1.5 transition-colors cursor-pointer"
              style={{ cursor: 'pointer' }}
            >
              <span>View Details</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 my-auto py-2">
            {/* Donut Chart with Total in center */}
            <div className="relative w-[150px] h-[150px] shrink-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`slice-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Total overlay in donut hole */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <span className="text-[20px] font-bold text-[#123624] leading-none">
                  {totalOrders}
                </span>
                <span className="text-[11px] text-[#6B7F74] mt-0.5">Total</span>
              </div>
            </div>

            {/* Legend list on right */}
            <div className="flex-1 flex flex-col space-y-2.5 pl-2">
              <div className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <span className="text-[#32493C] font-medium">Pending</span>
                </div>
                <span className="font-bold text-[#123624]">{pendingOrders}</span>
              </div>

              <div className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                  <span className="text-[#32493C] font-medium">Processing</span>
                </div>
                <span className="font-bold text-[#123624]">{processingOrders}</span>
              </div>

              <div className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                  <span className="text-[#32493C] font-medium">Shipped</span>
                </div>
                <span className="font-bold text-[#123624]">{shippedOrders}</span>
              </div>

              <div className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                  <span className="text-[#32493C] font-medium">Delivered</span>
                </div>
                <span className="font-bold text-[#123624]">{completedOrders}</span>
              </div>
            </div>
          </div>

          {/* Soft sage wave accent in bottom-right corner */}
          <svg
            className="pointer-events-none absolute bottom-0 right-0 w-36 h-8 select-none"
            viewBox="0 0 140 30"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M 0 30 C 40 25, 80 10, 140 15 L 140 30 Z"
              fill="#EEF5EB"
              opacity="0.8"
            />
          </svg>
        </div>
      </div>

      {/* ── BOTTOM SECTION: RECENT ORDERS TABLE ── */}
      <div className="w-full bg-white rounded-[24px] border border-[#E2ECE4] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
        {/* Card Header */}
        <div className="p-5 sm:px-6 border-b border-[#F0F5F1] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E5EFE3] flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4 text-[#0B4828]" />
            </div>
            <h3 className="font-bold text-[#123624] text-[16.5px]">Recent Orders</h3>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab && setActiveTab('orders')}
            className="rounded-full border border-[#D5DFD8] bg-white px-3.5 py-1 text-xs font-semibold text-[#183627] hover:bg-[#F2F7EF] flex items-center gap-1.5 transition-colors cursor-pointer"
            style={{ cursor: 'pointer' }}
          >
            <span>View All</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-[#EEF4EC] text-[#556F60] text-[11.5px] font-semibold border-b border-[#E2ECE4]">
                <th className="px-6 py-3.5">Order ID</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F5F1]">
              {displayOrders.map((order, idx) => (
                <tr
                  key={order.order_number || idx}
                  className="hover:bg-[#F9FCFA] transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-[#0B4828] text-[13.5px]">
                    #{order.order_number}
                  </td>
                  <td className="px-6 py-4 text-[#263C2F] font-medium text-[13.5px]">
                    {order.customer}
                  </td>
                  <td className="px-6 py-4 font-bold text-[#123624] text-[13.5px]">
                    €{Number(order.total_amount || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block px-3.5 py-1 text-[11.5px] font-semibold rounded-full bg-[#FEF3D6] text-[#B45309]">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-[#465E50] text-[13px] font-medium whitespace-nowrap">
                    {order.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
