import React, { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getSiteConfig } from '@/lib/api_site_config'


export default function InvoiceModal({ order, onClose }) {
  const printRef = useRef(null)

  const handlePrint = () => {
    // Basic print logic: open a new window, write the HTML, and call print()
    const printContent = printRef.current.innerHTML
    const printWindow = window.open('', '', 'width=800,height=900')
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Requisition</title>
          <style>
            body { font-family: sans-serif; margin: 0; padding: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-container { width: 100%; max-width: 800px; margin: 0 auto; position: relative; }
            .header-flex { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
            h1, h2, p { margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 8px; border: none; }
            tr { border-bottom: 1px solid #E5E7EB; }
            .totals-table { width: 300px; float: right; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            .totals-table td { padding: 6px; border: none; text-align: right; }
            .totals-table .label { font-weight: bold; }
            .watermark { position: absolute; top: 10%; left: 50%; transform: translate(-50%, -50%); opacity: 0.1; font-size: 48px; font-weight: bold; z-index: -1; }
            
            /* Print overrides for Tailwind utilities */
            .text-center { text-align: center !important; }
            .text-right { text-align: right !important; }
            .text-left { text-align: left !important; }
            .bg-\\[\\#e5e7eb\\] { background-color: #e5e7eb !important; }
            .bg-\\[\\#f3f4f6\\] { background-color: #f3f4f6 !important; }
            .bg-\\[\\#f8fafc\\] { background-color: #f8fafc !important; }
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

  // Fallbacks for data
  const dateStr = order.ordered_at 
    ? new Date(order.ordered_at).toLocaleDateString('en-GB') 
    : 'N/A'
  const shopName = order.customer_name || 'TEST 2'
  const contact = order.customer_phone || ''
  const address = order.street_address || ''
  const [mounted, setMounted] = useState(false)
  const [siteConfig, setSiteConfig] = useState(null)
  
  useEffect(() => {
    setMounted(true)
    getSiteConfig().then(config => setSiteConfig(config))
  }, [])

  const statusLabel = order.status ? order.status.toUpperCase() : 'ORDER'

  const calculatedSubtotal = (order.items || []).reduce((sum, item) => sum + (Number(item.line_total) || (Number(item.unit_price) * Number(item.quantity))), 0)
  
  const calculatedTax = (order.items || []).reduce((sum, item) => {
    const itemTaxRate = item.tax_rate ? parseFloat(item.tax_rate) / 100 : 0.05
    const itemLineTotal = Number(item.line_total) || (Number(item.unit_price) * Number(item.quantity))
    return sum + (itemLineTotal * itemTaxRate)
  }, 0)

  const displaySubtotal = Number(order.cart_subtotal || calculatedSubtotal)
  const displayTax = Number(order.total_tax || calculatedTax)
  const displayTotal = displaySubtotal + displayTax
  const modalContent = (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <div 
          className="bg-[#f8fafc] w-full max-w-[900px] rounded shadow-xl flex flex-col my-auto relative"
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
            <div className="flex justify-between items-start relative z-10" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
              <div>
                <h1 className="text-4xl font-light tracking-wide text-gray-800" style={{ fontSize: '36px', fontWeight: '300', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>Invoice</h1>
                <h2 className="text-3xl font-bold text-gray-900 tracking-wider" style={{ fontSize: '30px', fontWeight: 'bold', margin: '0 0 12px 0' }}>#{order.order_number || 'R-033459'}</h2>
                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 16px', borderRadius: '9999px', backgroundColor: statusLabel === 'DELIVERED' ? '#dcfce7' : '#fef08a', color: statusLabel === 'DELIVERED' ? '#166534' : '#854d0e', border: statusLabel === 'DELIVERED' ? '1px solid #bbf7d0' : '1px solid #fde047' }}>
                  <span style={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {statusLabel}
                  </span>
                </div>
              </div>
              <div className="text-right flex items-center gap-2 justify-end" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                <img src={siteConfig?.logo || '/el-erbol-logo.png'} alt="Logo" style={{ height: '48px', objectFit: 'contain' }} />
                <h1 className="text-3xl font-bold text-gray-600 tracking-widest" style={{ fontSize: '28px', fontWeight: 'bold', color: '#4b5563', margin: '0' }}>
                  {siteConfig?.brand_name?.toUpperCase() || 'EL ÁRBOL'}
                </h1>
              </div>
            </div>

            {/* Address Blocks */}
            <div className="flex justify-between items-start relative z-10 mb-12" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
              {/* Customer Info */}
              <div className="text-sm space-y-1" style={{ width: '45%' }}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4" style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Customer Info</h3>
                <p className="font-medium text-gray-900" style={{ fontWeight: '500', margin: '0 0 4px 0' }}>{shopName}</p>
                <p className="text-gray-600" style={{ margin: '0 0 4px 0' }}>{address || 'No address provided'}</p>
                <p className="text-gray-600" style={{ margin: '0 0 4px 0' }}>Contact: {contact || 'N/A'}</p>
                <p className="text-gray-600" style={{ margin: '0 0 4px 0' }}>Date: {dateStr}</p>
              </div>

              {/* Company Info */}
              <div className="text-sm space-y-1" style={{ width: '45%' }}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4" style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Company Info</h3>
                <p className="font-medium text-gray-900" style={{ fontWeight: '500', margin: '0 0 4px 0' }}>{siteConfig?.brand_name ? `${siteConfig.brand_name} LLC` : 'EL ÁRBOL LLC'}</p>
                <p className="text-gray-600" style={{ margin: '0 0 4px 0' }}>{siteConfig?.contact_address || 'House 12, Road 7, Dhanmondi, Dhaka, Bangladesh'}</p>
                <p className="text-gray-600" style={{ margin: '0 0 4px 0' }}>{siteConfig?.contact_email || 'elarbol@gmail.com'}</p>
                <p className="text-gray-600" style={{ margin: '0 0 4px 0' }}>{siteConfig?.contact_phone || '+15119219836'}</p>
              </div>
            </div>

            {/* Table */}
            <div className="mb-8 relative z-10" style={{ marginBottom: '32px' }}>
              <table className="w-full text-sm border-collapse" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead className="bg-gray-200 text-gray-800" style={{ backgroundColor: '#e5e7eb', color: '#1f2937' }}>
                  <tr>
                    <th className="p-3 text-center font-medium" style={{ padding: '12px', textAlign: 'center', fontWeight: '500', border: 'none' }}>S/N</th>
                    <th className="p-3 text-left font-medium" style={{ padding: '12px', textAlign: 'left', fontWeight: '500', border: 'none' }}>Product Description</th>
                    <th className="p-3 text-center font-medium" style={{ padding: '12px', textAlign: 'center', fontWeight: '500', border: 'none' }}>Quantity</th>
                    <th className="p-3 text-center font-medium" style={{ padding: '12px', textAlign: 'center', fontWeight: '500', border: 'none' }}>Unit Price</th>
                    <th className="p-3 text-center font-medium" style={{ padding: '12px', textAlign: 'center', fontWeight: '500', border: 'none' }}>Total Price</th>
                    <th className="p-3 text-center font-medium" style={{ padding: '12px', textAlign: 'center', fontWeight: '500', border: 'none' }}>Tax</th>
                    <th className="p-3 text-center font-medium" style={{ padding: '12px', textAlign: 'center', fontWeight: '500', border: 'none' }}>Total (Inc. Tax)</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item, i) => {
                    const itemTaxRate = item.tax_rate ? parseFloat(item.tax_rate) / 100 : 0.05
                    const itemLineTotal = Number(item.line_total) || (Number(item.unit_price) * Number(item.quantity))
                    const itemTaxAmount = itemLineTotal * itemTaxRate
                    const itemTotalWithTax = itemLineTotal + itemTaxAmount
                    return (
                      <tr key={item.id || i} className="border-b border-gray-200 text-gray-700" style={{ borderBottom: '1px solid #e5e7eb', color: '#374151' }}>
                        <td className="p-3 text-center" style={{ padding: '12px', textAlign: 'center', border: 'none' }}>{i + 1}</td>
                        <td className="p-3 text-left" style={{ padding: '12px', textAlign: 'left', border: 'none' }}>{item.product_name}</td>
                        <td className="p-3 text-center" style={{ padding: '12px', textAlign: 'center', border: 'none' }}>{item.quantity} {item.unit}</td>
                        <td className="p-3 text-center" style={{ padding: '12px', textAlign: 'center', border: 'none' }}>€{Number(item.unit_price).toFixed(2)}</td>
                        <td className="p-3 text-center" style={{ padding: '12px', textAlign: 'center', border: 'none' }}>€{itemLineTotal.toFixed(2)}</td>
                        <td className="p-3 text-center" style={{ padding: '12px', textAlign: 'center', border: 'none' }}>€{itemTaxAmount.toFixed(2)}</td>
                        <td className="p-3 text-center font-medium" style={{ padding: '12px', textAlign: 'center', fontWeight: '500', border: 'none' }}>€{itemTotalWithTax.toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals section */}
            <div className="flex justify-end relative z-10" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div className="w-1/2 sm:w-1/3" style={{ width: '40%' }}>
                <div className="flex justify-between py-3 border-b border-gray-200 text-sm" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e5e7eb', fontSize: '14px' }}>
                  <span className="font-bold text-gray-800" style={{ fontWeight: 'bold', color: '#1f2937' }}>Subtotal</span>
                  <span className="text-gray-700" style={{ color: '#374151' }}>€{displaySubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200 text-sm" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e5e7eb', fontSize: '14px' }}>
                  <span className="font-bold text-gray-800" style={{ fontWeight: 'bold', color: '#1f2937' }}>Tax Amount</span>
                  <span className="text-gray-700" style={{ color: '#374151' }}>€{displayTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200 text-sm" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e5e7eb', fontSize: '14px' }}>
                  <span className="font-bold text-gray-800" style={{ fontWeight: 'bold', color: '#1f2937' }}>Total Amount</span>
                  <span className="text-gray-700" style={{ color: '#374151' }}>€{displayTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-16 pt-6 border-t border-gray-200 text-center text-xs text-gray-500 relative z-10 break-inside-avoid" style={{ marginTop: '64px', paddingTop: '24px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '12px', color: '#6b7280', pageBreakInside: 'avoid' }}>
              <p className="font-semibold text-gray-700 mb-1" style={{ fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                Thank you for your business!
              </p>
              <p>
                {siteConfig?.brand_name ? `${siteConfig.brand_name} LLC` : 'EL ÁRBOL LLC'} &bull; {siteConfig?.contact_address || 'House 12, Road 7, Dhanmondi, Dhaka, Bangladesh'}
              </p>
              <p className="mt-1" style={{ marginTop: '4px' }}>
                Phone: {siteConfig?.contact_phone || '+15119219836'} &bull; Email: {siteConfig?.contact_email || 'elarbol@gmail.com'}
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
