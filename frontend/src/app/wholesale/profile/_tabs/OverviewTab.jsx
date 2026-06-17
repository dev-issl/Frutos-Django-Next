'use client'
// src/app/wholesale/profile/_tabs/OverviewTab.jsx
import { useMemo } from 'react'
import { ShoppingCart, Euro, Clock, CheckCircle, ArrowRight, User } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'

export default function OverviewTab({ profile, orders, setActiveTab }) {
  
  // -- Calculate Summary Stats --
  const totalOrders = orders.length;
  const totalSpent = useMemo(() => {
    return orders.reduce((sum, o) => {
      const status = (o.status || '').toLowerCase();
      const paymentStatus = (o.payment_status || '').toLowerCase();
      if ((status === 'delivered' || status === 'completed') && paymentStatus === 'paid') {
        return sum + Number(o.total_amount || 0);
      }
      return sum;
    }, 0);
  }, [orders]);
  const pendingOrders = orders.filter(o => (o.status || '').toLowerCase() === 'pending').length;
  const completedOrders = orders.filter(o => (o.status || '').toLowerCase() === 'completed' || (o.status || '').toLowerCase() === 'delivered').length;

  // -- Prepare Line Chart Data (Spending over time) --
  const lineChartData = useMemo(() => {
    const grouped = {};
    orders.forEach(o => {
      if (!o.ordered_at) return;
      const dateStr = new Date(o.ordered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!grouped[dateStr]) grouped[dateStr] = 0;
      grouped[dateStr] += Number(o.total_amount || 0);
    });
    
    let data = Object.keys(grouped).map(date => ({ date, amount: grouped[date] }));
    
    if (data.length === 0) {
      data = [
        { date: 'Mon', amount: 0 }, { date: 'Tue', amount: 0 }, { date: 'Wed', amount: 0 }
      ];
    }
    return data.slice(-14); 
  }, [orders])

  // -- Prepare Bar Chart Data (Orders by Status) --
  const barChartData = useMemo(() => {
    const statuses = { 'Pending': 0, 'Processing': 0, 'Shipped': 0, 'Delivered': 0 };
    orders.forEach(o => {
      const s = (o.status || 'Pending').toLowerCase();
      if (s.includes('pending')) statuses['Pending']++;
      else if (s.includes('process')) statuses['Processing']++;
      else if (s.includes('ship')) statuses['Shipped']++;
      else if (s.includes('deliver') || s.includes('complet')) statuses['Delivered']++;
      else statuses['Pending']++;
    });
    return [
      { name: 'PENDING', value: statuses['Pending'], color: '#f59e0b' },
      { name: 'PROCESSING', value: statuses['Processing'], color: '#3b82f6' },
      { name: 'SHIPPED', value: statuses['Shipped'], color: '#8b5cf6' },
      { name: 'DELIVERED', value: statuses['Delivered'], color: '#10b981' },
    ]
  }, [orders])

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1200px] mx-auto">
      
      {/* Header Area */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back. Here is your store performance at a glance.</p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
            <ShoppingCart size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-500 flex items-center justify-center shrink-0">
            <Euro size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Spent</p>
            <p className="text-2xl font-bold text-green-600">€{totalSpent.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pending Orders</p>
            <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-500 flex items-center justify-center shrink-0">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Successful</p>
            <p className="text-2xl font-bold text-gray-900">{completedOrders}</p>
          </div>
        </div>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Line Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900 text-[15px]">Spending — Recent</h3>
            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Analytics</span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`€${value}`, 'Spent']}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900 text-[15px]">Orders by Status</h3>
            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Distribution</span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
                <RechartsTooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Bottom Section */}
      <div className="w-full">
        {/* Recent Orders */}
        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex justify-between items-center">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                 <ShoppingCart size={16} />
               </div>
               <h3 className="font-bold text-gray-900 text-[15px]">Recent Orders</h3>
             </div>
             <button 
               onClick={() => setActiveTab && setActiveTab('orders')} 
               className="text-[#4f46e5] text-sm font-semibold hover:underline flex items-center gap-1 cursor-pointer"
             >
               View All <ArrowRight size={14} />
             </button>
          </div>
          
          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                  <tr>
                    <th className="px-5 py-4">Order ID</th>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4 text-right">Amount</th>
                    <th className="px-5 py-4 text-center">Status</th>
                    <th className="px-5 py-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.slice(0, 5).map(order => {
                    const statusLower = (order.status || 'pending').toLowerCase()
                    let badgeClass = 'bg-orange-50 text-orange-600'
                    if(statusLower.includes('complet') || statusLower.includes('deliver')) badgeClass = 'bg-green-50 text-green-600'
                    if(statusLower.includes('process')) badgeClass = 'bg-blue-50 text-blue-600'
                    if(statusLower.includes('ship')) badgeClass = 'bg-purple-50 text-purple-600'

                    return (
                    <tr key={order.id || order.order_number} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 font-bold text-[#085041]">#{order.order_number}</td>
                      <td className="px-5 py-4 text-gray-700 font-medium">{profile.contact_name || profile.business_name || 'Wholesale'}</td>
                      <td className="px-5 py-4 text-right font-bold text-gray-900">
                        €{Number(order.total_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${badgeClass}`}>
                          {order.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-gray-500 font-medium whitespace-nowrap">
                        {order.ordered_at ? new Date(order.ordered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">
               No recent orders to display.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}