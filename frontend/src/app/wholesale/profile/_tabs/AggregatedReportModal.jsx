import React, { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getSiteConfig } from '@/lib/api_site_config'

export default function AggregatedReportModal({ reports, reportType, profile, onClose }) {
  const printRef = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [siteConfig, setSiteConfig] = useState(null)

  useEffect(() => {
    setMounted(true)
    getSiteConfig().then(config => setSiteConfig(config))
  }, [])

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML
    const printWindow = window.open('', '', 'width=800,height=900')
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Report</title>
          <style>
            body { font-family: sans-serif; margin: 0; padding: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-container { width: 100%; max-width: 800px; margin: 0 auto; position: relative; }
            h1, h2, h3, p { margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 8px; border: none; }
            tr { border-bottom: 1px solid #E5E7EB; }
            /* Tailwind utilities for print */
            .text-center { text-align: center !important; }
            .text-right { text-align: right !important; }
            .text-left { text-align: left !important; }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${printContent}
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  // Calculate date range
  const daysToInclude = reportType === 'weekly' ? 7 : 30
  
  const endDate = new Date()
  endDate.setHours(23, 59, 59, 999)
  
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - daysToInclude + 1)
  startDate.setHours(0, 0, 0, 0)

  // Format dates for display
  const formatDate = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const dateRangeStr = `${formatDate(startDate)} - ${formatDate(endDate)}`
  
  // Filter reports
  console.log("AggregatedReportModal Input Reports:", reports, "StartDate:", startDate, "EndDate:", endDate)
  const filteredReports = (reports || []).filter(r => {
    if (!r.date) return false
    
    let year, month, day
    const dateStr = String(r.date).trim()
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-').map(Number)
      if (parts[0] > 1000) {
        [year, month, day] = parts
      } else {
        [day, month, year] = parts
      }
    } else if (dateStr.includes('/')) {
      const parts = dateStr.split('/').map(Number)
      if (parts[0] > 1000) {
        [year, month, day] = parts
      } else {
        [day, month, year] = parts
      }
    } else {
      const parsed = new Date(dateStr)
      if (isNaN(parsed.getTime())) return false
      return parsed >= startDate && parsed <= endDate
    }
    
    if (!year || !month || !day) return false
    const reportDate = new Date(year, month - 1, day)
    return reportDate >= startDate && reportDate <= endDate
  }).sort((a, b) => {
    const parseReportDate = (dStr) => {
      const s = String(dStr).trim()
      if (s.includes('-')) {
        const parts = s.split('-').map(Number)
        return parts[0] > 1000 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(parts[2], parts[1] - 1, parts[0])
      } else if (s.includes('/')) {
        const parts = s.split('/').map(Number)
        return parts[0] > 1000 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(parts[2], parts[1] - 1, parts[0])
      }
      return new Date(s)
    }
    return parseReportDate(a.date) - parseReportDate(b.date)
  })
  console.log("AggregatedReportModal Filtered Reports:", filteredReports)

  // Calculate totals
  const totals = filteredReports.reduce((acc, curr) => {
    acc.cash += Number(curr.cash || 0)
    acc.bank += Number(curr.bank || 0)
    acc.expenses += Number(curr.expenses || 0)
    acc.store += Number(curr.store || 0)
    acc.purchase += Number(curr.purchase || 0)
    return acc
  }, { cash: 0, bank: 0, expenses: 0, store: 0, purchase: 0 })

  const totalRevenue = totals.cash + totals.bank

  const title = reportType === 'weekly' ? 'WEEKLY SUMMARY REPORT' : 'MONTHLY SUMMARY REPORT'

  const modalContent = (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <div 
          className="bg-[#f8fafc] w-full max-w-[750px] rounded shadow-xl flex flex-col my-auto relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Top action bar */}
          <div className="flex items-center justify-center gap-2 p-3 bg-white border-b border-gray-200 rounded-t">
            <button className="bg-[#fbbf24] hover:bg-[#f59e0b] text-white font-medium px-4 py-1.5 rounded text-sm flex items-center gap-2 transition-colors">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
              Download
            </button>
            <button 
              onClick={handlePrint}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-4 py-1.5 rounded text-sm flex items-center gap-2 transition-colors"
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
              Print
            </button>
            <button 
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Printable Area */}
          <div className="p-8 sm:p-12 bg-white min-h-[700px] relative font-sans text-gray-800" ref={printRef}>
            
            {/* Top Header */}
            <div className="flex justify-between items-start relative z-10" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '2px solid #f1f5f9', paddingBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', marginBottom: '4px' }}>Wholesale Operations</span>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight" style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>{title}</h1>
                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 12px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em' }}>
                    {dateRangeStr}
                  </span>
                </div>
              </div>
              <div className="text-right flex items-center gap-3 justify-end" style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
                {profile?.profile_image_url && (
                  <img src={profile.profile_image_url} alt="Logo" style={{ height: '44px', width: '44px', objectFit: 'cover', borderRadius: '50%', border: '2px solid #e2e8f0' }} />
                )}
                <div style={{ textAlign: 'right' }}>
                  <h1 className="text-xl font-bold text-slate-800 tracking-tight" style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', margin: '0', textTransform: 'uppercase' }}>
                    {profile?.business_name || 'Wholesale Shop'}
                  </h1>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', textTransform: 'capitalize', marginTop: '2px' }}>
                    {profile?.contact_name || 'Partner Account'}
                  </span>
                </div>
              </div>
            </div>

            {/* Shop Info & Summary Highlights */}
            <div className="flex justify-between items-start relative z-10 mb-12" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
              <div className="text-sm space-y-1" style={{ width: '45%' }}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4" style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Report Details</h3>
                <p className="font-medium text-gray-900" style={{ fontWeight: '500', margin: '0 0 4px 0' }}>Generated On: {formatDate(new Date())}</p>
                <p className="text-gray-600" style={{ margin: '0 0 4px 0' }}>Total Days: {daysToInclude} Days</p>
                <p className="text-gray-600" style={{ margin: '0 0 4px 0' }}>Records Found: {filteredReports.length}</p>
              </div>

              <div className="text-sm space-y-1 text-right" style={{ width: '45%', textAlign: 'right' }}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4" style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Key Metrics</h3>
                <p className="font-medium text-green-700" style={{ fontWeight: '500', margin: '0 0 4px 0', color: '#15803d' }}>Total Revenue: €{totalRevenue.toFixed(2)}</p>
                <p className="text-red-600" style={{ margin: '0 0 4px 0', color: '#dc2626' }}>Total Expenses: €{totals.expenses.toFixed(2)}</p>
              </div>
            </div>

            {/* Table */}
            <div className="mb-8 relative z-10" style={{ marginBottom: '32px' }}>
              <table className="w-full text-sm border-collapse" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead className="bg-gray-200 text-gray-800" style={{ backgroundColor: '#e5e7eb', color: '#1f2937' }}>
                  <tr>
                    <th className="p-3 text-center font-medium" style={{ padding: '12px', textAlign: 'center', fontWeight: '500', border: 'none' }}>Date</th>
                    <th className="p-3 text-center font-medium" style={{ padding: '12px', textAlign: 'center', fontWeight: '500', border: 'none' }}>Cash</th>
                    <th className="p-3 text-center font-medium" style={{ padding: '12px', textAlign: 'center', fontWeight: '500', border: 'none' }}>Bank</th>
                    <th className="p-3 text-center font-medium" style={{ padding: '12px', textAlign: 'center', fontWeight: '500', border: 'none' }}>Store</th>
                    <th className="p-3 text-center font-medium" style={{ padding: '12px', textAlign: 'center', fontWeight: '500', border: 'none' }}>Purchase</th>
                    <th className="p-3 text-center font-medium" style={{ padding: '12px', textAlign: 'center', fontWeight: '500', border: 'none' }}>Expense</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.length > 0 ? filteredReports.map((item, i) => (
                    <tr key={item.id || i} className="border-b border-gray-200 text-gray-700" style={{ borderBottom: '1px solid #e5e7eb', color: '#374151' }}>
                      <td className="p-3 text-center" style={{ padding: '12px', textAlign: 'center', border: 'none' }}>{item.date}</td>
                      <td className="p-3 text-center" style={{ padding: '12px', textAlign: 'center', border: 'none' }}>€{Number(item.cash || 0).toFixed(2)}</td>
                      <td className="p-3 text-center" style={{ padding: '12px', textAlign: 'center', border: 'none' }}>€{Number(item.bank || 0).toFixed(2)}</td>
                      <td className="p-3 text-center" style={{ padding: '12px', textAlign: 'center', border: 'none' }}>€{Number(item.store || 0).toFixed(2)}</td>
                      <td className="p-3 text-center" style={{ padding: '12px', textAlign: 'center', border: 'none' }}>€{Number(item.purchase || 0).toFixed(2)}</td>
                      <td className="p-3 text-center text-red-600" style={{ padding: '12px', textAlign: 'center', border: 'none', color: '#dc2626' }}>€{Number(item.expenses || 0).toFixed(2)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="p-6 text-center text-gray-500" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                        No records found for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals section */}
            <div className="flex justify-end relative z-10 mt-8" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
              <div className="w-full sm:w-[65%]" style={{ width: '65%' }}>
                <h3 className="text-lg font-bold mb-4" style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Summary Totals</h3>
                
                <div className="flex justify-between py-3 border-b border-gray-200 text-sm" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e5e7eb', fontSize: '14px' }}>
                  <span className="font-semibold text-gray-800" style={{ fontWeight: '600', color: '#1f2937' }}>Total Cash</span>
                  <span className="text-gray-700" style={{ color: '#374151' }}>€{totals.cash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200 text-sm" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e5e7eb', fontSize: '14px' }}>
                  <span className="font-semibold text-gray-800" style={{ fontWeight: '600', color: '#1f2937' }}>Total Bank</span>
                  <span className="text-gray-700" style={{ color: '#374151' }}>€{totals.bank.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200 text-sm bg-gray-50" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 4px', borderBottom: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: '#f9fafb' }}>
                  <span className="font-bold text-gray-900" style={{ fontWeight: 'bold', color: '#111827' }}>Total Revenue (Cash+Bank)</span>
                  <span className="font-bold text-green-700" style={{ fontWeight: 'bold', color: '#15803d' }}>€{totalRevenue.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between py-3 border-b border-gray-200 text-sm mt-4" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e5e7eb', fontSize: '14px', marginTop: '16px' }}>
                  <span className="font-semibold text-gray-800" style={{ fontWeight: '600', color: '#1f2937' }}>Total Store</span>
                  <span className="text-gray-700" style={{ color: '#374151' }}>€{totals.store.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200 text-sm" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e5e7eb', fontSize: '14px' }}>
                  <span className="font-semibold text-gray-800" style={{ fontWeight: '600', color: '#1f2937' }}>Total Purchase</span>
                  <span className="text-gray-700" style={{ color: '#374151' }}>€{totals.purchase.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200 text-sm bg-gray-50" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 4px', borderBottom: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: '#f9fafb' }}>
                  <span className="font-bold text-gray-900" style={{ fontWeight: 'bold', color: '#111827' }}>Total Expenses</span>
                  <span className="font-bold text-red-600" style={{ fontWeight: 'bold', color: '#dc2626' }}>€{totals.expenses.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-16 pt-6 border-t border-gray-200 text-center text-xs text-gray-500 relative z-10 break-inside-avoid" style={{ marginTop: '64px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '12px', color: '#6b7280', pageBreakInside: 'avoid' }}>
              <p className="font-semibold text-gray-700 mb-1" style={{ fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                Generated by {profile?.business_name || 'Wholesale User'}
              </p>
              <p>
                {profile?.business_name || 'Wholesale Shop'} &bull; {profile?.postcode ? `Postcode: ${profile.postcode}` : 'Address: N/A'}
              </p>
              <p className="mt-1" style={{ marginTop: '4px' }}>
                Contact: {profile?.contact_name || 'N/A'} &bull; Phone: {profile?.phone || 'N/A'} &bull; Email: {profile?.email || 'N/A'}
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  )

  if (!mounted) return null
  return createPortal(modalContent, document.body)
}
