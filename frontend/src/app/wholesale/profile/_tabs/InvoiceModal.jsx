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
            body { font-family: sans-serif; margin: 0; padding: 20px; }
            .print-container { width: 100%; max-width: 800px; margin: 0 auto; position: relative; }
            .header-flex { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
            h1, h2, p { margin: 0; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 20px; }
            th { background: #E5E7EB; text-align: left; padding: 6px; font-weight: bold; border: 1px solid #E5E7EB; }
            td { padding: 6px; border: 1px solid #E5E7EB; }
            .totals-table { width: 300px; float: right; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            .totals-table td { padding: 6px; border: 1px solid #E5E7EB; text-align: right; }
            .totals-table .label { font-weight: bold; }
            .watermark { position: absolute; top: 10%; left: 50%; transform: translate(-50%, -50%); opacity: 0.1; font-size: 48px; font-weight: bold; z-index: -1; }
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
  const displayTotal = Number(order.total_amount || (displaySubtotal + displayTax))
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
          <div className="p-4 sm:p-8 bg-white min-h-[500px] relative" ref={printRef}>
            
            {/* Watermark */}
            <div className="absolute top-[80px] left-1/2 transform -translate-x-1/2 text-gray-200 text-6xl font-bold uppercase tracking-widest pointer-events-none select-none z-0">
              {statusLabel}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-4 relative z-10">
              {/* Left Header */}
              <div className="text-sm text-gray-700 space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{siteConfig?.brand_name?.toUpperCase() || 'EL ÁRBOL'}</h1>
                <h2 className="text-xs sm:text-sm font-semibold text-gray-600 tracking-tight mb-1">{siteConfig?.brand_name ? `${siteConfig.brand_name} LLC` : 'EL ÁRBOL LLC'}</h2>
                <p>{siteConfig?.contact_address || 'House 12, Road 7, Dhanmondi, Dhaka, Bangladesh'}</p>
                <p>TEL: {siteConfig?.contact_phone || '+15119219836'}</p>
                <p className="flex items-center gap-1 font-medium mt-1">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                  {siteConfig?.contact_email || 'elarbol@gmail.com'}
                </p>
              </div>

              {/* Right Header */}
              <div className="text-sm text-gray-700 space-y-1 text-left min-w-[200px]">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">REQUISITION</h1>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">#{order.order_number || 'R-033459'}</h2>
                <div className="grid grid-cols-[80px_1fr] gap-1 mt-2">
                  <span className="font-semibold">Date:</span> <span>{dateStr}</span>
                  <span className="font-semibold">Store:</span> <span>{shopName}</span>
                  <span className="font-semibold">Contact:</span> <span>{contact}</span>
                  <span className="font-semibold">Address:</span> <span>{address}</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="mt-8 overflow-x-auto relative z-10 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full pb-2">
              <table className="w-full text-[11px] border-collapse min-w-[700px]">
                <thead className="bg-[#e5e7eb] text-gray-700">
                  <tr>
                    <th className="border border-gray-200 p-2 text-center font-bold">S/N</th>
                    <th className="border border-gray-200 p-2 text-center font-bold">QUANTITY</th>
                    <th className="border border-gray-200 p-2 text-left font-bold">PRODUCT</th>
                    <th className="border border-gray-200 p-2 text-left font-bold">DETAILS</th>
                    <th className="border border-gray-200 p-2 text-center font-bold">KILO</th>
                    <th className="border border-gray-200 p-2 text-center font-bold">T.KILO</th>
                    <th className="border border-gray-200 p-2 text-center font-bold">TARE</th>
                    <th className="border border-gray-200 p-2 text-center font-bold">NET</th>
                    <th className="border border-gray-200 p-2 text-center font-bold">PRICE</th>
                    <th className="border border-gray-200 p-2 text-center font-bold">TOTAL PRICE</th>
                    <th className="border border-gray-200 p-2 text-left font-bold">REMARK</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item, i) => (
                    <tr key={item.id || i} className="text-gray-800">
                      <td className="border border-gray-200 p-2 text-center bg-[#f3f4f6]">{i + 1}</td>
                      <td className="border border-gray-200 p-2 text-center font-semibold">{item.quantity} {item.unit}</td>
                      <td className="border border-gray-200 p-2">{item.product_name}</td>
                      <td className="border border-gray-200 p-2"></td>
                      <td className="border border-gray-200 p-2 text-center">
                        {(!item.unit || item.unit?.toLowerCase() === 'kg') ? (
                          <svg className="w-4 h-4 text-gray-800 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                        ) : ''}
                      </td>
                      <td className="border border-gray-200 p-2"></td>
                      <td className="border border-gray-200 p-2"></td>
                      <td className="border border-gray-200 p-2"></td>
                      <td className="border border-gray-200 p-2 text-center">€{Number(item.unit_price).toFixed(2)}</td>
                      <td className="border border-gray-200 p-2 text-center">€{Number(item.line_total).toFixed(2)}</td>
                      <td className="border border-gray-200 p-2"></td>
                    </tr>
                  ))}
                  
                  {/* Summary Rows */}
                  <tr>
                    <td colSpan="8" className="border-0"></td>
                    <td className="border border-gray-200 p-2 text-right font-bold text-gray-900 bg-white">Subtotal (Excl. Tax)</td>
                    <td className="border border-gray-200 p-2 text-center font-bold text-gray-900 bg-white">
                      €{displaySubtotal.toFixed(2)}
                    </td>
                    <td className="border-0"></td>
                  </tr>
                  <tr>
                    <td colSpan="8" className="border-0"></td>
                    <td className="border border-gray-200 p-2 text-right font-bold text-gray-900 bg-white">Tax Amount</td>
                    <td className="border border-gray-200 p-2 text-center font-bold text-gray-900 bg-white">
                      €{displayTax.toFixed(2)}
                    </td>
                    <td className="border-0"></td>
                  </tr>
                  <tr>
                    <td colSpan="8" className="border-0"></td>
                    <td className="border border-gray-200 p-2 text-right font-bold text-gray-900 bg-white">Total (Incl. Tax)</td>
                    <td className="border border-gray-200 p-2 text-center font-bold text-gray-900 bg-white">
                      €{displayTotal.toFixed(2)}
                    </td>
                    <td className="border-0"></td>
                  </tr>
                  <tr>
                    <td colSpan="8" className="border-0"></td>
                    <td className="border border-gray-200 p-2 text-right font-bold text-gray-900 bg-white">Paid Amount</td>
                    <td className="border border-gray-200 p-2 text-center font-bold text-gray-900 bg-white">
                      €{(order.payment_status === 'PAID' ? Number(order.total_amount) : 0).toFixed(2)}
                    </td>
                    <td className="border-0"></td>
                  </tr>
                  <tr>
                    <td colSpan="8" className="border-0"></td>
                    <td className="border border-gray-200 p-2 text-right font-bold text-gray-900 bg-white">Due Amount</td>
                    <td className="border border-gray-200 p-2 text-center font-bold text-gray-900 bg-white">
                      €{(order.payment_status === 'PAID' ? 0 : Number(order.total_amount)).toFixed(2)}
                    </td>
                    <td className="border-0"></td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </>
  )

  if (!mounted) return null
  return createPortal(modalContent, document.body)
}
