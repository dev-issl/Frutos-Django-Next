"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Edit, Clock, FileText, CheckCircle, Package, Truck, XCircle } from "lucide-react";

export default function ShopPortalDashboard() {
  const [activeFilter, setActiveFilter] = useState("ALL");

  const filters = ["ALL", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

  const orders = [
    {
      id: 1,
      shop: "Similique quos anim",
      requisitionNumber: "ORD111008383",
      date: "Jun 20, 2026",
      approvedBy: "ACCOUNT MANAGER",
      status: "SHIPPED",
    },
    {
      id: 2,
      shop: "Arbol Styles",
      requisitionNumber: "ORD120056386",
      date: "Jun 18, 2026",
      approvedBy: "ACCOUNT MANAGER",
      status: "PENDING",
    },
    {
      id: 3,
      shop: "Arbol Styles",
      requisitionNumber: "ORD135357265",
      date: "Jun 17, 2026",
      approvedBy: "ACCOUNT MANAGER",
      status: "DELIVERED",
    },
  ];

  const filteredOrders = activeFilter === "ALL" 
    ? orders 
    : orders.filter(o => o.status === activeFilter);

  const StatusBadge = ({ status }) => {
    switch (status) {
      case "SHIPPED":
        return <span className="px-3 py-1 text-[11px] font-bold tracking-wider rounded-md text-purple-600 bg-purple-50 border border-purple-100 uppercase">SHIPPED</span>;
      case "PENDING":
        return <span className="px-3 py-1 text-[11px] font-bold tracking-wider rounded-md text-amber-600 bg-amber-50 border border-amber-100 uppercase">PENDING</span>;
      case "DELIVERED":
        return <span className="px-3 py-1 text-[11px] font-bold tracking-wider rounded-md text-emerald-600 bg-emerald-50 border border-emerald-100 uppercase">DELIVERED</span>;
      case "PROCESSING":
        return <span className="px-3 py-1 text-[11px] font-bold tracking-wider rounded-md text-blue-600 bg-blue-50 border border-blue-100 uppercase">PROCESSING</span>;
      case "CANCELLED":
        return <span className="px-3 py-1 text-[11px] font-bold tracking-wider rounded-md text-red-600 bg-red-50 border border-red-100 uppercase">CANCELLED</span>;
      default:
        return <span className="px-3 py-1 text-[11px] font-bold tracking-wider rounded-md text-slate-600 bg-slate-50 border border-slate-100 uppercase">{status}</span>;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Top Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/shop-portal/order-line" className="flex items-center justify-center gap-2 py-4 px-4 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm font-semibold text-sm tracking-wide">
          <Edit className="w-5 h-5" />
          CREATE ORDER
        </Link>
        <button className="flex items-center justify-center gap-2 py-4 px-4 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors shadow-sm font-semibold text-sm tracking-wide">
          <Truck className="w-5 h-5" />
          TRACK ORDER
        </button>
        <button className="flex items-center justify-center gap-2 py-4 px-4 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shadow-sm font-semibold text-sm tracking-wide">
          <Clock className="w-5 h-5" />
          PREVIOUS ORDER
        </button>
        <button className="flex items-center justify-center gap-2 py-4 px-4 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors shadow-sm font-semibold text-sm tracking-wide">
          <FileText className="w-5 h-5" />
          DAILY REPORTS
        </button>
      </div>

      {/* Orders Table Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table Header / Filters */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-slate-100 rounded-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800">Your all orders</h2>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeFilter === filter
                    ? "bg-[#00694C] text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 border border-slate-200 bg-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-6 text-sm font-semibold text-slate-700 w-16">S/N</th>
                <th className="py-4 px-6 text-sm font-semibold text-slate-700">Shop</th>
                <th className="py-4 px-6 text-sm font-semibold text-slate-700">Requisition Number</th>
                <th className="py-4 px-6 text-sm font-semibold text-slate-700">Date</th>
                <th className="py-4 px-6 text-sm font-semibold text-slate-700">Approved by</th>
                <th className="py-4 px-6 text-sm font-semibold text-slate-700 text-center w-32">Status</th>
                <th className="py-4 px-6 text-sm font-semibold text-slate-700 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm text-slate-500">{order.id}</td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-800">{order.shop}</td>
                    <td className="py-4 px-6 text-sm text-slate-600">{order.requisitionNumber}</td>
                    <td className="py-4 px-6 text-sm text-slate-600">{order.date}</td>
                    <td className="py-4 px-6 text-sm text-slate-600">{order.approvedBy}</td>
                    <td className="py-4 px-6 text-center">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center">
                        <button className="p-2 border border-emerald-200 text-emerald-600 rounded-full hover:bg-emerald-50 transition-colors" title="View Order">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500 text-sm">
                    No orders found matching the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
