"use client";
import { useState, useEffect } from "react";
import Modal from "@/app/dashboard/_components/Modal";
import { Euro, CalendarDays, BarChart2, User, Briefcase, ShoppingBag, Package, CheckCircle, FileText } from "lucide-react";

export default function OrdersReportModal({ open, onClose, orders = [], initialCustomerType = "all", initialTab = "monthly" }) {
  const [customerType, setCustomerType] = useState(initialCustomerType);
  const [tab, setTab] = useState(initialTab);
  const [selectedPartner, setSelectedPartner] = useState("");

  useEffect(() => {
    if (open) {
      setCustomerType(initialCustomerType);
      setTab(initialTab);
      setSelectedPartner("");
    }
  }, [open, initialCustomerType, initialTab]);

  const now = new Date();

  // Start of Week (Sunday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  // Start of Month (1st day)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const filterOrders = (startPeriod) => {
    return orders.filter(o => {
      if (!o.ordered_at) return false;
      const date = new Date(o.ordered_at);
      return date >= startPeriod;
    });
  };

  const weeklyOrders = filterOrders(startOfWeek);
  const monthlyOrders = filterOrders(startOfMonth);

  // First filter by time period
  const activeTimeOrders = tab === "weekly" ? weeklyOrders : monthlyOrders;

  // Then filter by customer segment
  const segmentOrders = activeTimeOrders.filter(o => {
    if (customerType === "retail") return !o.is_wholesale_order;
    if (customerType === "wholesale") return o.is_wholesale_order;
    return true; // "all"
  });

  // Extract unique partners from the current segment
  const uniquePartners = [...new Set(segmentOrders.map(o => o.customer_name).filter(Boolean))].sort();

  // Finally filter by specific partner if selected
  const activeOrders = selectedPartner 
    ? segmentOrders.filter(o => o.customer_name === selectedPartner)
    : segmentOrders;

  const wholesaleOrders = activeOrders.filter(o => o.is_wholesale_order);
  const retailOrders = activeOrders.filter(o => !o.is_wholesale_order);

  const calculateStats = (ordersArray) => {
    return {
      revenue: ordersArray.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
      count: ordersArray.length,
      itemsSold: ordersArray.reduce((sum, o) => sum + (o.items || []).reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0), 0)
    };
  };

  const wsStats = calculateStats(wholesaleOrders);
  const rtStats = calculateStats(retailOrders);
  const totalStats = calculateStats(activeOrders);

  const statusCounts = activeOrders.reduce((acc, o) => {
    const s = o.status?.toLowerCase() || 'pending';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const deliveredCount = (statusCounts['delivered'] || 0) + (statusCounts['completed'] || 0);

  // Helper to format date ranges
  const formatDateRange = (start) => {
    const end = new Date();
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${start.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(undefined, options)}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-break {
            page-break-before: always;
          }
        }
      `}</style>
      <Modal open={open} onClose={onClose} title={
        <div className="flex items-center gap-3 w-full justify-between pr-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg no-print">
              <BarChart2 className="w-5 h-5" />
            </div>
            <span>Sales & Orders Report</span>
          </div>
          <button
            onClick={handlePrint}
            className="no-print flex items-center gap-2 bg-[#00694C] text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-[#00523b] transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
        </div>
      } maxWidth="max-w-4xl">
        <div id="printable-report" className="space-y-6 pb-2 print:bg-white print:p-8">
          
          {/* Print Header (Visible only in print) */}
          <div className="hidden print:flex items-center justify-between mb-8 border-b-2 border-slate-800 pb-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">EL ARBOL</h1>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Official Sales Report</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">Date Generated</p>
              <p className="text-xs text-slate-500">{new Date().toLocaleString()}</p>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col md:flex-row gap-4 no-print mb-6">
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Customer Segment</label>
              <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60">
                <button
                  onClick={() => { setCustomerType("all"); setSelectedPartner(""); }}
                  className={`cursor-pointer flex-1 py-2 text-sm font-black rounded-lg transition-all ${customerType === "all" ? "bg-white text-[#00694C] shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
                >All</button>
                <button
                  onClick={() => { setCustomerType("retail"); setSelectedPartner(""); }}
                  className={`cursor-pointer flex-1 py-2 text-sm font-black rounded-lg transition-all ${customerType === "retail" ? "bg-white text-teal-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
                >Retail</button>
                <button
                  onClick={() => { setCustomerType("wholesale"); setSelectedPartner(""); }}
                  className={`cursor-pointer flex-1 py-2 text-sm font-black rounded-lg transition-all ${customerType === "wholesale" ? "bg-white text-amber-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
                >Wholesale</button>
              </div>
            </div>

            <div className="flex-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Time Period</label>
              <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60">
                <button
                  onClick={() => { setTab("weekly"); setSelectedPartner(""); }}
                  className={`cursor-pointer flex-1 py-2 text-sm font-black rounded-lg transition-all flex justify-center items-center gap-2 ${tab === "weekly" ? "bg-white text-emerald-700 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
                >
                  <CalendarDays className="w-4 h-4" /> This Week
                </button>
                <button
                  onClick={() => { setTab("monthly"); setSelectedPartner(""); }}
                  className={`cursor-pointer flex-1 py-2 text-sm font-black rounded-lg transition-all flex justify-center items-center gap-2 ${tab === "monthly" ? "bg-white text-emerald-700 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
                >
                  <CalendarDays className="w-4 h-4" /> This Month
                </button>
              </div>
            </div>

            <div className="flex-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Specific Partner / User</label>
              <select
                value={selectedPartner}
                onChange={(e) => setSelectedPartner(e.target.value)}
                className="w-full bg-slate-100/80 p-2.5 rounded-xl border border-slate-200/60 text-sm font-black text-slate-700 outline-none focus:border-emerald-500/50 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">All Partners ({uniquePartners.length})</option>
                {uniquePartners.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center px-1 border-b border-slate-100 pb-3 print:border-slate-300 print:mb-8">
            <h3 className="text-lg font-black text-slate-800 print:text-2xl print:uppercase print:tracking-wide">
              {tab === "weekly" ? "Weekly Executive Summary" : "Monthly Executive Summary"}
              {selectedPartner && <span className="block text-sm text-slate-500 mt-1 normal-case tracking-normal">For Partner: {selectedPartner}</span>}
            </h3>
            <span className="text-sm font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 print:bg-transparent print:border-none print:text-slate-800 print:text-lg">
              {tab === "weekly" ? formatDateRange(startOfWeek) : formatDateRange(startOfMonth)}
            </span>
          </div>

          {/* Compact Revenue Grid */}
          <div className={`grid grid-cols-1 ${customerType === 'all' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-5`}>
            {/* Retail Box */}
            {customerType !== 'wholesale' && (
              <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-sm print:border-slate-300 print:shadow-none">
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-5 flex items-center gap-2.5 print:text-slate-800">
                  <div className="p-2 bg-teal-50 text-teal-600 rounded-lg print:bg-transparent print:p-0"><User className="w-4 h-4" /></div> Retail Segment
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><Euro className="w-4 h-4 text-slate-400" /> Revenue</span>
                    <span className="font-black text-slate-900 text-xl print:text-2xl">€{rtStats.revenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-slate-400" /> Orders</span>
                    <span className="font-bold text-slate-700 text-lg">{rtStats.count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><Package className="w-4 h-4 text-slate-400" /> Items Sold</span>
                    <span className="font-bold text-slate-700 text-lg">{rtStats.itemsSold.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Wholesale Box */}
            {customerType !== 'retail' && (
              <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-sm print:border-slate-300 print:shadow-none">
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-5 flex items-center gap-2.5 print:text-slate-800">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg print:bg-transparent print:p-0"><Briefcase className="w-4 h-4" /></div> Wholesale Segment
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><Euro className="w-4 h-4 text-slate-400" /> Revenue</span>
                    <span className="font-black text-slate-900 text-xl print:text-2xl">€{wsStats.revenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-slate-400" /> Orders</span>
                    <span className="font-bold text-slate-700 text-lg">{wsStats.count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><Package className="w-4 h-4 text-slate-400" /> Items Sold</span>
                    <span className="font-bold text-slate-700 text-lg">{wsStats.itemsSold.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Total Box */}
            <div className="bg-[#00694C] rounded-2xl p-6 shadow-lg text-white print:bg-white print:text-black print:border-4 print:border-slate-800 print:shadow-none">
              <h4 className="text-sm font-black text-emerald-100 uppercase tracking-widest mb-5 flex items-center gap-2.5 print:text-slate-800">
                <div className="p-2 bg-white/20 text-white rounded-lg print:bg-transparent print:p-0 print:text-black"><BarChart2 className="w-4 h-4" /></div> {customerType === 'all' ? 'Total Performance' : `${customerType} Performance`}
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-2 print:border-slate-300">
                  <span className="text-sm font-bold text-emerald-50 print:text-slate-600">Total Revenue</span>
                  <span className="font-black text-3xl text-white print:text-slate-900">€{totalStats.revenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2 print:border-slate-300">
                  <span className="text-sm font-bold text-emerald-50 print:text-slate-600">Total Orders</span>
                  <span className="font-bold text-emerald-100 text-xl print:text-slate-800">{totalStats.count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2 print:border-slate-300">
                  <span className="text-sm font-bold text-emerald-50 print:text-slate-600">Items Sold</span>
                  <span className="font-bold text-emerald-100 text-xl print:text-slate-800">{totalStats.itemsSold.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-6 print:border-slate-300 print:mt-10">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center print:bg-white print:border-b-2 print:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="w-2 h-6 bg-emerald-500 rounded-full print:bg-slate-800"></span>
                <h4 className="text-base font-black text-slate-800 uppercase tracking-wide">Status Breakdown</h4>
              </div>
              <div className="flex items-center gap-2 text-sm font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 print:text-slate-800 print:bg-transparent print:border-slate-300">
                <CheckCircle className="w-4 h-4" />
                {deliveredCount} Delivered
              </div>
            </div>
            <div className="p-5">
              {totalStats.count === 0 ? (
                <div className="text-center py-10 text-slate-400 font-bold border-2 border-slate-100 border-dashed rounded-xl">
                  No orders found for this period.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
                    let badgeColors = "bg-slate-50 text-slate-700 border-slate-200";
                    if (status === 'delivered') badgeColors = "bg-emerald-50 text-emerald-700 border-emerald-200";
                    if (status === 'pending') badgeColors = "bg-amber-50 text-amber-700 border-amber-200";
                    if (status === 'processing') badgeColors = "bg-blue-50 text-blue-700 border-blue-200";
                    if (status === 'cancelled') badgeColors = "bg-red-50 text-red-700 border-red-200";
                    if (status === 'shipped') badgeColors = "bg-indigo-50 text-indigo-700 border-indigo-200";

                    return (
                      <div key={status} className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center print:border-slate-300 print:bg-white print:text-black ${badgeColors}`}>
                        <span className="text-3xl font-black mb-1 opacity-90 print:text-black">{count}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80 print:text-slate-600">{status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="hidden print:block mt-20 pt-8 border-t border-slate-300 text-center text-slate-500 text-xs font-semibold">
            Generated by El Arbol Automated Reporting System • {new Date().toLocaleDateString()}
          </div>
        </div>
      </Modal>
    </>
  );
}
