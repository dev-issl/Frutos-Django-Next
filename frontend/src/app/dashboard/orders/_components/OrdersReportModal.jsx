"use client";
import { useState, useEffect, useRef } from "react";
import Modal from "@/app/dashboard/_components/Modal";
import {
  Euro, CalendarDays, BarChart2, User, Briefcase,
  ShoppingBag, Package, CheckCircle, FileText, Download,
  Printer, TrendingUp, Clock, X, ChevronDown
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────
function fmt(n) {
  return Number(n || 0).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(date, opts = {}) {
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", ...opts });
}

function startOfDay(d) {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
}

function calcStats(arr) {
  return {
    revenue: arr.reduce((s, o) => s + Number(o.total_amount || 0), 0),
    count: arr.length,
    items: arr.reduce((s, o) => s + (o.items || []).reduce((ss, i) => ss + Number(i.quantity || 0), 0), 0),
    avgOrder: arr.length ? arr.reduce((s, o) => s + Number(o.total_amount || 0), 0) / arr.length : 0,
  };
}

const STATUS_COLORS = {
  delivered: { bg: "#d1fae5", color: "#065f46", label: "Delivered" },
  completed: { bg: "#d1fae5", color: "#065f46", label: "Completed" },
  pending:   { bg: "#fef3c7", color: "#92400e", label: "Pending" },
  processing:{ bg: "#dbeafe", color: "#1e40af", label: "Processing" },
  shipped:   { bg: "#ede9fe", color: "#5b21b6", label: "Shipped" },
  cancelled: { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" },
};

// ── Period config ─────────────────────────────────────────────
function getPeriods(now) {
  const sod = startOfDay(now);
  const startWeek = new Date(sod); startWeek.setDate(sod.getDate() - sod.getDay());
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startYear = new Date(now.getFullYear(), 0, 1);
  return { sod, startWeek, startMonth, startYear };
}

// ── Top-level component ──────────────────────────────────────
export default function OrdersReportModal({
  open, onClose, orders = [],
  initialCustomerType = "all",
  initialTab = "monthly",
}) {
  const now = new Date();
  const { sod, startWeek, startMonth, startYear } = getPeriods(now);

  const [tab, setTab]             = useState(initialTab === "weekly" ? "weekly" : "monthly");
  const [customerType, setCustomerType] = useState(initialCustomerType);
  const [partner, setPartner]     = useState("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo]   = useState("");
  const printRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTab(initialTab === "weekly" ? "weekly" : "monthly");
      setCustomerType(initialCustomerType);
      setPartner("");
      setCustomFrom("");
      setCustomTo("");
    }
  }, [open, initialCustomerType, initialTab]);

  // ── Period filter ──────────────────────────────────────────
  const periodStart = (() => {
    if (tab === "daily")   return sod;
    if (tab === "weekly")  return startWeek;
    if (tab === "monthly") return startMonth;
    if (tab === "yearly")  return startYear;
    if (tab === "custom" && customFrom) return startOfDay(new Date(customFrom));
    return startMonth;
  })();

  const periodEnd = (() => {
    if (tab === "custom" && customTo) { const d = new Date(customTo); d.setHours(23,59,59,999); return d; }
    return now;
  })();

  const periodLabel = (() => {
    if (tab === "daily")   return `Today — ${fmtShort(now)}`;
    if (tab === "weekly")  return `${fmtShort(startWeek)} – ${fmtShort(now)}`;
    if (tab === "monthly") return `${fmtShort(startMonth)} – ${fmtShort(now)}`;
    if (tab === "yearly")  return `${fmtShort(startYear)} – ${fmtShort(now)}`;
    if (tab === "custom" && customFrom && customTo)
      return `${fmtShort(customFrom)} – ${fmtShort(customTo)}`;
    return "Custom Range";
  })();

  // ── Apply filters ──────────────────────────────────────────
  const timeFiltered = orders.filter(o => {
    if (!o.ordered_at) return false;
    const d = new Date(o.ordered_at);
    return d >= periodStart && d <= periodEnd;
  });

  const segmentFiltered = timeFiltered.filter(o => {
    if (customerType === "retail")    return !o.is_wholesale_order;
    if (customerType === "wholesale") return o.is_wholesale_order;
    return true;
  });

  const uniquePartners = [...new Set(segmentFiltered.map(o => o.customer_name).filter(Boolean))].sort();

  const activeOrders = partner
    ? segmentFiltered.filter(o => o.customer_name === partner)
    : segmentFiltered;

  const wholesaleOrders = activeOrders.filter(o => o.is_wholesale_order);
  const retailOrders    = activeOrders.filter(o => !o.is_wholesale_order);

  const totalStats = calcStats(activeOrders);
  const wsStats    = calcStats(wholesaleOrders);
  const rtStats    = calcStats(retailOrders);

  const statusCounts = activeOrders.reduce((acc, o) => {
    const s = (o.status || "pending").toLowerCase();
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  // ── Print / PDF ────────────────────────────────────────────
  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    // Open in a new window for clean PDF printing
    const content = printRef.current?.innerHTML || "";
    const win = window.open("", "_blank");
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>El Arbol — Orders Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; background: #fff; padding: 32px; }
          .report-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #00694C; padding-bottom: 20px; margin-bottom: 24px; }
          .company-name { font-size: 28px; font-weight: 900; color: #00694C; letter-spacing: -1px; }
          .report-subtitle { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-top: 4px; }
          .meta-right { text-align: right; }
          .meta-right p { font-size: 12px; color: #64748b; margin-top: 4px; }
          .meta-right strong { color: #0f172a; }
          .section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-bottom: 12px; margin-top: 28px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
          .stat-card.accent { background: #00694C; color: white; }
          .stat-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 8px; }
          .stat-card.accent .stat-label { color: rgba(255,255,255,0.7); }
          .stat-value { font-size: 22px; font-weight: 900; color: #0f172a; }
          .stat-card.accent .stat-value { color: white; }
          .segments-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
          .segment-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
          .segment-card h4 { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; color: #374151; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .row:last-child { border-bottom: none; }
          .row .label { color: #64748b; font-weight: 600; }
          .row .val { font-weight: 800; color: #0f172a; }
          .status-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px; }
          .status-card { border-radius: 8px; padding: 14px; text-align: center; border: 1px solid #e2e8f0; }
          .status-count { font-size: 26px; font-weight: 900; }
          .status-name { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; color: #64748b; }
          .orders-table { width: 100%; border-collapse: collapse; font-size: 12px; }
          .orders-table th { background: #f8fafc; padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #64748b; border-bottom: 2px solid #e2e8f0; }
          .orders-table td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; color: #374151; }
          .orders-table tr:last-child td { border-bottom: none; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; }
          .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
          @media print { @page { margin: 20mm; } }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div>
            <div class="company-name">EL ARBOL</div>
            <div class="report-subtitle">Official Sales & Orders Report</div>
          </div>
          <div class="meta-right">
            <p><strong>Period:</strong> ${periodLabel}</p>
            <p><strong>Segment:</strong> ${customerType === "all" ? "All Customers" : customerType === "wholesale" ? "Wholesale" : "Retail"}</p>
            ${partner ? `<p><strong>Partner:</strong> ${partner}</p>` : ""}
            <p><strong>Generated:</strong> ${new Date().toLocaleString("en-GB")}</p>
          </div>
        </div>

        <div class="section-title">Performance Overview</div>
        <div class="stats-grid">
          <div class="stat-card accent">
            <div class="stat-label">Total Revenue</div>
            <div class="stat-value">€${fmt(totalStats.revenue)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Orders</div>
            <div class="stat-value">${totalStats.count}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Items Sold</div>
            <div class="stat-value">${totalStats.items}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Avg. Order Value</div>
            <div class="stat-value">€${fmt(totalStats.avgOrder)}</div>
          </div>
        </div>

        <div class="section-title">Segment Breakdown</div>
        <div class="segments-grid">
          <div class="segment-card">
            <h4>🛍️ Retail</h4>
            <div class="row"><span class="label">Revenue</span><span class="val">€${fmt(rtStats.revenue)}</span></div>
            <div class="row"><span class="label">Orders</span><span class="val">${rtStats.count}</span></div>
            <div class="row"><span class="label">Items Sold</span><span class="val">${rtStats.items}</span></div>
          </div>
          <div class="segment-card">
            <h4>🏢 Wholesale</h4>
            <div class="row"><span class="label">Revenue</span><span class="val">€${fmt(wsStats.revenue)}</span></div>
            <div class="row"><span class="label">Orders</span><span class="val">${wsStats.count}</span></div>
            <div class="row"><span class="label">Items Sold</span><span class="val">${wsStats.items}</span></div>
          </div>
        </div>

        <div class="section-title">Order Status Breakdown</div>
        <div class="status-grid">
          ${Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([s, c]) => {
            const sc = STATUS_COLORS[s] || { bg: "#f1f5f9", color: "#374151" };
            return `<div class="status-card" style="background:${sc.bg}">
              <div class="status-count" style="color:${sc.color}">${c}</div>
              <div class="status-name">${s}</div>
            </div>`;
          }).join("")}
        </div>

        <div class="section-title">Order Details (${activeOrders.length} orders)</div>
        <table class="orders-table">
          <thead>
            <tr>
              <th>#</th><th>Order No.</th><th>Customer</th>
              <th>Type</th><th>Date</th><th>Status</th><th style="text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${activeOrders.slice().sort((a, b) => new Date(b.ordered_at) - new Date(a.ordered_at)).map((o, i) => {
              const sc = STATUS_COLORS[(o.status || "").toLowerCase()] || { bg: "#f1f5f9", color: "#374151" };
              return `<tr>
                <td style="color:#94a3b8">${i + 1}</td>
                <td style="font-weight:800;color:#00694C">${o.order_number}</td>
                <td>${o.customer_name || "—"}</td>
                <td><span class="badge" style="background:${o.is_wholesale_order ? "#fef3c7" : "#d1fae5"};color:${o.is_wholesale_order ? "#92400e" : "#065f46"}">${o.is_wholesale_order ? "Wholesale" : "Retail"}</span></td>
                <td>${o.ordered_at ? fmtShort(o.ordered_at) : "—"}</td>
                <td><span class="badge" style="background:${sc.bg};color:${sc.color}">${o.status || "—"}</span></td>
                <td style="text-align:right;font-weight:800">€${fmt(o.total_amount)}</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>

        <div class="footer">
          Generated by El Arbol Automated Reporting System &bull; ${new Date().toLocaleDateString("en-GB")}
        </div>
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 400);
  };

  const TABS = [
    { id: "daily",   label: "Daily",   icon: <Clock className="w-3.5 h-3.5" /> },
    { id: "weekly",  label: "Weekly",  icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { id: "monthly", label: "Monthly", icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: "yearly",  label: "Yearly",  icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: "custom",  label: "Custom",  icon: <CalendarDays className="w-3.5 h-3.5" /> },
  ];

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body > *:not(#orders-report-print-area) { display: none !important; }
          #orders-report-print-area { display: block !important; }
        }
        #orders-report-print-area { display: none; }
      `}</style>

      {/* Hidden print area */}
      <div id="orders-report-print-area" ref={printRef} />

      <Modal
        open={open}
        onClose={onClose}
        title={
          <div className="flex items-center gap-3 w-full justify-between pr-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-slate-800 text-[15px]">Sales & Orders Report</p>
                <p className="text-[11px] font-semibold text-slate-400">{periodLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                className="no-print flex items-center gap-2 bg-blue-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
              <button
                onClick={handlePrint}
                className="no-print flex items-center gap-2 bg-[#00694C] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-[#00523b] transition-colors shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
            </div>
          </div>
        }
        maxWidth="max-w-5xl"
      >
        <div className="space-y-5 pb-2">

          {/* ── Control Panel ─────────────────────────────── */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-4 no-print">

            {/* Time Period Tabs */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Time Period</label>
              <div className="flex gap-1.5 flex-wrap">
                {TABS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); setPartner(""); }}
                    className={`cursor-pointer flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                      tab === t.id
                        ? "bg-[#00694C] text-white shadow-sm"
                        : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700"
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* Custom date range */}
              {tab === "custom" && (
                <div className="flex gap-3 mt-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">From</label>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={e => setCustomFrom(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">To</label>
                    <input
                      type="date"
                      value={customTo}
                      onChange={e => setCustomTo(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 flex-col md:flex-row">
              {/* Customer Segment */}
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Customer Segment</label>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 gap-1">
                  {[
                    { id: "all",       label: "All",       color: "text-slate-700" },
                    { id: "retail",    label: "Retail",    color: "text-teal-700" },
                    { id: "wholesale", label: "Wholesale", color: "text-amber-700" },
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setCustomerType(s.id); setPartner(""); }}
                      className={`cursor-pointer flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${
                        customerType === s.id
                          ? `bg-slate-100 ${s.color} shadow-sm`
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Partner filter */}
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Partner / Customer ({uniquePartners.length})
                </label>
                <div className="relative">
                  <select
                    value={partner}
                    onChange={e => setPartner(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-400 cursor-pointer appearance-none pr-8"
                  >
                    <option value="">All Partners</option>
                    {uniquePartners.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Period Banner ─────────────────────────────── */}
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-base font-black text-slate-800">
                {tab.charAt(0).toUpperCase() + tab.slice(1)} Executive Summary
              </h3>
              {partner && (
                <p className="text-xs text-slate-500 mt-0.5">Partner: <span className="font-bold text-slate-700">{partner}</span></p>
              )}
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              {periodLabel}
            </span>
          </div>

          {/* ── KPI Cards ─────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Revenue", value: `€${fmt(totalStats.revenue)}`, accent: true, icon: <Euro className="w-4 h-4" /> },
              { label: "Total Orders",  value: totalStats.count, icon: <ShoppingBag className="w-4 h-4" /> },
              { label: "Items Sold",    value: totalStats.items, icon: <Package className="w-4 h-4" /> },
              { label: "Avg. Order",    value: `€${fmt(totalStats.avgOrder)}`, icon: <TrendingUp className="w-4 h-4" /> },
            ].map((kpi, i) => (
              <div
                key={i}
                className={`rounded-2xl p-4 flex flex-col gap-2 ${kpi.accent ? "bg-[#00694C] text-white" : "bg-white border border-slate-100 shadow-sm"}`}
              >
                <div className={`p-2 rounded-lg w-fit ${kpi.accent ? "bg-white/20" : "bg-slate-50"}`}>
                  <span className={kpi.accent ? "text-white" : "text-slate-500"}>{kpi.icon}</span>
                </div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${kpi.accent ? "text-emerald-100" : "text-slate-400"}`}>{kpi.label}</p>
                <p className={`text-xl font-black ${kpi.accent ? "text-white" : "text-slate-800"}`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* ── Segment Breakdown ─────────────────────────── */}
          <div className={`grid grid-cols-1 ${customerType === "all" ? "md:grid-cols-2" : "md:grid-cols-1"} gap-4`}>
            {customerType !== "wholesale" && (
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-teal-50 rounded-lg"><User className="w-3.5 h-3.5 text-teal-600" /></div>
                  Retail Segment
                </h4>
                {[
                  { label: "Revenue",    value: `€${fmt(rtStats.revenue)}`,  bold: true },
                  { label: "Orders",     value: rtStats.count },
                  { label: "Items Sold", value: rtStats.items },
                  { label: "Avg. Order", value: `€${fmt(rtStats.avgOrder)}` },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                    <span className="text-xs font-bold text-slate-400">{row.label}</span>
                    <span className={`text-sm font-black ${row.bold ? "text-slate-900" : "text-slate-700"}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}
            {customerType !== "retail" && (
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-amber-50 rounded-lg"><Briefcase className="w-3.5 h-3.5 text-amber-600" /></div>
                  Wholesale Segment
                </h4>
                {[
                  { label: "Revenue",    value: `€${fmt(wsStats.revenue)}`,  bold: true },
                  { label: "Orders",     value: wsStats.count },
                  { label: "Items Sold", value: wsStats.items },
                  { label: "Avg. Order", value: `€${fmt(wsStats.avgOrder)}` },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                    <span className="text-xs font-bold text-slate-400">{row.label}</span>
                    <span className={`text-sm font-black ${row.bold ? "text-slate-900" : "text-slate-700"}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Status Breakdown ──────────────────────────── */}
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-5 bg-emerald-500 rounded-full inline-block" />
                Status Breakdown
              </h4>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                <CheckCircle className="w-3.5 h-3.5" />
                {(statusCounts["delivered"] || 0) + (statusCounts["completed"] || 0)} Delivered
              </div>
            </div>
            <div className="p-4">
              {totalStats.count === 0 ? (
                <div className="text-center py-10 text-slate-400 font-bold border-2 border-dashed border-slate-100 rounded-xl">
                  No orders found for this period.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
                    const sc = STATUS_COLORS[status] || { bg: "#f8fafc", color: "#374151" };
                    return (
                      <div
                        key={status}
                        className="rounded-xl p-4 flex flex-col items-center text-center border"
                        style={{ background: sc.bg, borderColor: sc.bg }}
                      >
                        <span className="text-2xl font-black" style={{ color: sc.color }}>{count}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: sc.color }}>{STATUS_COLORS[status]?.label || status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Orders Table ──────────────────────────────── */}
          {activeOrders.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-5 bg-blue-500 rounded-full inline-block" />
                  Order Details ({activeOrders.length})
                </h4>
              </div>
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      {["#", "Order No.", "Customer", "Type", "Date", "Status", "Amount"].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-black text-slate-400 uppercase tracking-widest text-[10px] border-b border-slate-100 whitespace-nowrap last:text-right">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeOrders
                      .slice()
                      .sort((a, b) => new Date(b.ordered_at) - new Date(a.ordered_at))
                      .map((o, i) => {
                        const sc = STATUS_COLORS[(o.status || "").toLowerCase()] || { bg: "#f8fafc", color: "#374151" };
                        return (
                          <tr key={o.order_number} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-2.5 text-slate-400 font-bold">{i + 1}</td>
                            <td className="px-4 py-2.5 font-black text-[#00694C] whitespace-nowrap">{o.order_number}</td>
                            <td className="px-4 py-2.5 font-semibold text-slate-700 whitespace-nowrap">{o.customer_name || "—"}</td>
                            <td className="px-4 py-2.5">
                              <span
                                className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={o.is_wholesale_order
                                  ? { background: "#fef3c7", color: "#92400e" }
                                  : { background: "#d1fae5", color: "#065f46" }
                                }
                              >
                                {o.is_wholesale_order ? "Wholesale" : "Retail"}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 font-semibold whitespace-nowrap">
                              {o.ordered_at ? fmtShort(o.ordered_at) : "—"}
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold capitalize"
                                style={{ background: sc.bg, color: sc.color }}
                              >
                                {o.status || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right font-black text-slate-800 whitespace-nowrap">
                              €{fmt(o.total_amount)}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-[11px] text-slate-400 font-semibold pt-1">
            Generated by El Arbol Reporting System · {new Date().toLocaleDateString("en-GB")}
          </p>

        </div>
      </Modal>
    </>
  );
}
