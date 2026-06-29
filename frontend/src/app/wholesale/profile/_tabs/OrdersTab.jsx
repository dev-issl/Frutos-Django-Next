// src/app/wholesale/profile/_tabs/OrdersTab.jsx
import { useState, useMemo, useEffect } from 'react'
import { getWholesaleDailyReports } from '@/lib/api'
import InvoiceModal from './InvoiceModal'
import DailyReportModal from './DailyReportModal'

export default function OrdersTab({ orders, onDeleteOrder, setProfileActiveTab, accessToken }) {
  const [mainTab, setMainTab] = useState('PREVIOUS ORDER') // 'TRACK YOUR ORDER', 'PREVIOUS ORDER', 'DAILY REPORTS'
  const [activeTab, setActiveTab] = useState('ALL') // 'ALL', 'PENDING', 'PROCESSING', 'DELIVERED', 'CANCELLED'
  const [currentPage, setCurrentPage] = useState(1)
  const [viewOrder, setViewOrder] = useState(null)
  
  const [dailyReports, setDailyReports] = useState([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [hiddenOrderIds, setHiddenOrderIds] = useState(new Set())
  const [permanentlyDeletedOrderIds, setPermanentlyDeletedOrderIds] = useState(new Set())
  const [orderToDelete, setOrderToDelete] = useState(null)
  const [orderToPermanentDelete, setOrderToPermanentDelete] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  
  const ITEMS_PER_PAGE = 10

  // Load hidden orders from localStorage on mount
  useEffect(() => {
    try {
      const storedHidden = localStorage.getItem('wholesale_hidden_orders')
      if (storedHidden) {
        setHiddenOrderIds(new Set(JSON.parse(storedHidden)))
      }
      const storedPerm = localStorage.getItem('wholesale_perm_deleted_orders')
      if (storedPerm) {
        setPermanentlyDeletedOrderIds(new Set(JSON.parse(storedPerm)))
      }
    } catch (e) {
      console.error('Failed to load hidden orders', e)
    }
    setIsLoaded(true)
  }, [])

  // Save hidden orders to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('wholesale_hidden_orders', JSON.stringify(Array.from(hiddenOrderIds)))
      localStorage.setItem('wholesale_perm_deleted_orders', JSON.stringify(Array.from(permanentlyDeletedOrderIds)))
    }
  }, [hiddenOrderIds, permanentlyDeletedOrderIds, isLoaded])

  // Filter orders based on active tab
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderId = order.id || order.order_number
      
      if (permanentlyDeletedOrderIds.has(orderId)) return false
      
      if (activeTab === 'RECYCLE BIN') {
        return hiddenOrderIds.has(orderId)
      }
      
      if (hiddenOrderIds.has(orderId)) return false
      
      if (activeTab === 'ALL') return true
      const status = (order.status || '').toUpperCase()
      if (activeTab === 'PENDING') return status === 'PENDING'
      if (activeTab === 'PROCESSING') return status === 'PROCESSING' || status === 'CONFIRMED'
      if (activeTab === 'SHIPPED') return status === 'SHIPPED' || status === 'OUT_FOR_DELIVERY'
      if (activeTab === 'DELIVERED') return status === 'DELIVERED' || status === 'COMPLETED'
      if (activeTab === 'CANCELLED') return status === 'CANCELLED'
      return true
    })
  }, [orders, activeTab, hiddenOrderIds, permanentlyDeletedOrderIds])

  const displayOrders = mainTab === 'TRACK YOUR ORDER' 
    ? (filteredOrders.length > 0 ? [filteredOrders[0]] : []) 
    : filteredOrders

  // Pagination logic
  const totalPages = Math.ceil(displayOrders.length / ITEMS_PER_PAGE)
  const paginatedOrders = displayOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // Fetch daily reports
  useEffect(() => {
    if (mainTab === 'DAILY REPORTS' && accessToken) {
      setLoadingReports(true)
      getWholesaleDailyReports(accessToken)
        .then(data => setDailyReports(Array.isArray(data) ? data : (data?.results || [])))
        .catch(err => console.error(err))
        .finally(() => setLoadingReports(false))
    }
  }, [mainTab, accessToken])

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase()
    if (s === 'pending') return <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">Pending</span>
    if (s.includes('process') || s.includes('confirm')) return <span className="bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">Processing</span>
    if (s === 'shipped' || s.includes('out_for_delivery')) return <span className="bg-indigo-50 text-indigo-600 border border-indigo-200 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">Shipped</span>
    if (s === 'delivered' || s === 'completed') return <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">Delivered</span>
    if (s === 'cancelled') return <span className="bg-rose-50 text-rose-600 border border-rose-200 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">Cancelled</span>
    return <span className="bg-gray-50 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">{status}</span>
  }

  return (
    <div className="w-full">
      {/* Top action tabs matching the screenshot style (Placeholder functionality for some) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <button 
          onClick={() => setProfileActiveTab('order_line')}
          className="bg-emerald-50 border border-emerald-200 text-emerald-700 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-3 sm:py-4 rounded-xl shadow-sm font-semibold text-[11px] sm:text-sm transition-colors hover:bg-emerald-100 cursor-pointer"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          <span className="text-center">CREATE ORDER</span>
        </button>
        <button 
          onClick={() => { setMainTab('TRACK YOUR ORDER'); setCurrentPage(1); }}
          className={`${mainTab === 'TRACK YOUR ORDER' ? 'bg-indigo-100 border-indigo-300' : 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100'} text-indigo-700 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-3 sm:py-4 rounded-xl shadow-sm font-semibold text-[11px] sm:text-sm transition-colors cursor-pointer`}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          <span className="text-center">TRACK ORDER</span>
        </button>
        <button 
          onClick={() => { setMainTab('PREVIOUS ORDER'); setCurrentPage(1); }}
          className={`${mainTab === 'PREVIOUS ORDER' ? 'bg-blue-100 border-blue-300' : 'bg-blue-50 border-blue-100 hover:bg-blue-100'} text-blue-700 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-3 sm:py-4 rounded-xl shadow-sm font-semibold text-[11px] sm:text-sm transition-colors cursor-pointer`}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span className="text-center">PREVIOUS ORDER</span>
        </button>
        <button 
          onClick={() => { setMainTab('DAILY REPORTS'); setCurrentPage(1); }}
          className={`${mainTab === 'DAILY REPORTS' ? 'bg-rose-100 border-rose-300' : 'bg-rose-50 border-rose-100 hover:bg-rose-100'} text-rose-700 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-3 sm:py-4 rounded-xl shadow-sm font-semibold text-[11px] sm:text-sm transition-colors cursor-pointer`}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <span className="text-center">DAILY REPORTS</span>
        </button>
      </div>

      {mainTab === 'DAILY REPORTS' ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Table Header / Filters */}
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
              Your last order [Submitted reports]
            </h2>
            <button 
              onClick={() => setShowReportModal(true)}
              className="bg-[#085041] text-white px-4 py-2 rounded text-sm font-semibold hover:bg-[#064032] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              Add New
            </button>
          </div>

          <div className="overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-gray-800 border-b border-gray-200 font-bold">
                <tr>
                  <th className="px-4 py-3 border-r border-gray-100">S/N</th>
                  <th className="px-4 py-3 border-r border-gray-100">Shop</th>
                  <th className="px-4 py-3 border-r border-gray-100">Cash</th>
                  <th className="px-4 py-3 border-r border-gray-100">Bank</th>
                  <th className="px-4 py-3 border-r border-gray-100">Expense</th>
                  <th className="px-4 py-3 border-r border-gray-100">Store</th>
                  <th className="px-4 py-3 border-r border-gray-100">Buy</th>
                  <th className="px-4 py-3 border-r border-gray-100">Buy note</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {loadingReports ? (
                  <tr><td colSpan="9" className="px-4 py-8 text-center text-gray-500">Loading reports...</td></tr>
                ) : dailyReports.length > 0 ? (
                  dailyReports.map((report, index) => (
                    <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 border-r border-gray-100 text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3 border-r border-gray-100">{report.shop || 'Shop'}</td>
                      <td className="px-4 py-3 border-r border-gray-100">{report.cash}</td>
                      <td className="px-4 py-3 border-r border-gray-100">{report.bank}</td>
                      <td className="px-4 py-3 border-r border-gray-100">{report.expenses}</td>
                      <td className="px-4 py-3 border-r border-gray-100">{report.store}</td>
                      <td className="px-4 py-3 border-r border-gray-100">{report.purchase}</td>
                      <td className="px-4 py-3 border-r border-gray-100">{report.purchase_note}</td>
                      <td className="px-4 py-3">{report.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="9" className="px-4 py-8 text-center text-gray-500">No reports found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        
        {/* Table Header / Filters */}
        <div className="p-4 border-b border-gray-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
            {mainTab === 'TRACK YOUR ORDER' ? 'Your latest order' : 'Your all orders'}
          </h2>
          <div className="flex gap-2 overflow-x-auto w-full lg:w-auto py-1 [&::-webkit-scrollbar]:hidden">
            {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RECYCLE BIN'].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap text-center text-xs font-bold border ${activeTab === tab ? 'bg-[#085041] border-[#085041] text-white' : 'bg-white text-gray-600 border-gray-200'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full pb-2">
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="bg-white text-gray-800 border-b border-gray-200 font-bold">
              <tr>
                <th className="px-4 py-3 text-center border-r border-gray-100 w-12">S/N</th>
                <th className="px-4 py-3 border-r border-gray-100">Shop</th>
                <th className="px-4 py-3 border-r border-gray-100">Requisition Number</th>
                <th className="px-4 py-3 border-r border-gray-100">Date</th>
                <th className="px-4 py-3 border-r border-gray-100">Approved by</th>
                <th className="px-4 py-3 border-r border-gray-100 text-center">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order, index) => (
                  <tr key={order.id || order.order_number} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-center border-r border-gray-100 text-gray-500">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-4 py-3 border-r border-gray-100 text-gray-700">
                      {order.customer_name || 'Wholesale Shop'}
                    </td>
                    <td className="px-4 py-3 border-r border-gray-100 text-gray-700">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3 border-r border-gray-100 text-gray-600">
                      {order.ordered_at ? new Date(order.ordered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="px-4 py-3 border-r border-gray-100 text-gray-600 uppercase">
                      ACCOUNT MANAGER
                    </td>
                    <td className="px-4 py-3 border-r border-gray-100 text-center">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setViewOrder(order)}
                          className="bg-white border border-[#085041] text-[#085041] p-1.5 rounded-lg hover:bg-[#085041] hover:text-white transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center group"
                          title="View Invoice"
                        >
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        </button>
                        {activeTab === 'RECYCLE BIN' ? (
                          <>
                            <button 
                              onClick={() => {
                                setHiddenOrderIds(prev => {
                                  const newSet = new Set(prev)
                                  newSet.delete(order.id || order.order_number)
                                  return newSet
                                })
                              }}
                              className="bg-white border border-indigo-500 text-indigo-500 p-1.5 rounded-lg hover:bg-indigo-500 hover:text-white transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center group"
                              title="Restore Order"
                            >
                              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                            </button>
                            <button 
                              onClick={() => setOrderToPermanentDelete(order)}
                              className="bg-white border border-gray-500 text-gray-500 p-1.5 rounded-lg hover:bg-gray-500 hover:text-white transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center group"
                              title="Permanently Delete"
                            >
                              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => setOrderToDelete(order)}
                            className="bg-white border border-red-500 text-red-500 p-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center group"
                            title="Remove Order"
                          >
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Cards) */}
        <div className="md:hidden flex flex-col">
          {paginatedOrders.length > 0 ? (
            paginatedOrders.map((order, index) => (
              <div key={order.id || order.order_number} className="border-b border-gray-200 p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs text-gray-500 block">Requisition Number</span>
                    <span className="font-bold text-gray-800">{order.order_number}</span>
                  </div>
                  <div>{getStatusBadge(order.status)}</div>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="text-xs text-gray-500 block">Date</span>
                    <span className="text-sm text-gray-700">
                      {order.ordered_at ? new Date(order.ordered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Shop</span>
                    <span className="text-sm text-gray-700">{order.customer_name || 'Wholesale Shop'}</span>
                  </div>
                </div>
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={() => setViewOrder(order)}
                    className="flex-1 bg-white border border-[#085041] text-[#085041] py-2.5 rounded-lg font-bold hover:bg-[#085041] hover:text-white hover:shadow-md transition-all duration-200 cursor-pointer flex justify-center items-center gap-2 text-sm"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    View Order
                  </button>
                  {activeTab === 'RECYCLE BIN' ? (
                    <>
                      <button 
                        onClick={() => {
                          setHiddenOrderIds(prev => {
                            const newSet = new Set(prev)
                            newSet.delete(order.id || order.order_number)
                            return newSet
                          })
                        }}
                        className="flex-1 bg-white border border-indigo-500 text-indigo-500 py-2.5 rounded-lg font-bold hover:bg-indigo-500 hover:text-white hover:shadow-md transition-all duration-200 cursor-pointer flex justify-center items-center gap-2 text-sm"
                      >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                        Restore
                      </button>
                      <button 
                        onClick={() => setOrderToPermanentDelete(order)}
                        className="flex-1 bg-white border border-gray-500 text-gray-500 py-2.5 rounded-lg font-bold hover:bg-gray-500 hover:text-white hover:shadow-md transition-all duration-200 cursor-pointer flex justify-center items-center gap-2 text-sm"
                      >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        Perm. Delete
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setOrderToDelete(order)}
                      className="flex-1 bg-white border border-red-500 text-red-500 py-2.5 rounded-lg font-bold hover:bg-red-500 hover:text-white hover:shadow-md transition-all duration-200 cursor-pointer flex justify-center items-center gap-2 text-sm"
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      Remove Order
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
             <div className="px-4 py-8 text-center text-gray-500">
              No orders found.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex justify-end items-center gap-1">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2 py-1 border border-gray-300 rounded text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 bg-white transition-colors cursor-pointer"
            >
              &lsaquo;
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 border rounded text-sm transition-all duration-200 cursor-pointer ${currentPage === page ? 'bg-[#16a34a] text-white border-[#16a34a] scale-105 shadow-sm' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
              >
                {page}
              </button>
            ))}
            
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 border border-gray-300 rounded text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 bg-white transition-colors cursor-pointer"
            >
              &rsaquo;
            </button>
          </div>
        )}
      </div>
      )}

      {/* Invoice Modal */}
      {viewOrder && (
        <InvoiceModal order={viewOrder} onClose={() => setViewOrder(null)} />
      )}

      {/* Daily Report Modal */}
      {showReportModal && (
        <DailyReportModal 
          accessToken={accessToken} 
          onClose={() => setShowReportModal(false)}
          onReportCreated={(newReport) => setDailyReports(prev => [newReport, ...(Array.isArray(prev) ? prev : [])])}
        />
      )}

      {/* Permanent Delete Confirmation Modal */}
      {orderToPermanentDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-red-600">Permanently Remove</h3>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                Are you sure you want to permanently remove order <span className="font-semibold">{orderToPermanentDelete.order_number}</span> from your view? This action cannot be undone, though it will not delete it from the main database.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setOrderToPermanentDelete(null)}
                  className="px-4 py-2 rounded-lg font-semibold text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setPermanentlyDeletedOrderIds(prev => {
                      const newSet = new Set(prev)
                      newSet.add(orderToPermanentDelete.id || orderToPermanentDelete.order_number)
                      return newSet
                    })
                    // Also remove it from hiddenOrderIds just to keep things clean
                    setHiddenOrderIds(prev => {
                      const newSet = new Set(prev)
                      newSet.delete(orderToPermanentDelete.id || orderToPermanentDelete.order_number)
                      return newSet
                    })
                    setOrderToPermanentDelete(null)
                  }}
                  className="px-4 py-2 rounded-lg font-semibold bg-gray-600 text-white hover:bg-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer text-sm"
                >
                  Permanently Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Order</h3>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                Are you sure you want to remove order <span className="font-semibold">{orderToDelete.order_number}</span> from this list? This will only hide it from your view.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setOrderToDelete(null)}
                  className="px-4 py-2 rounded-lg font-semibold text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setHiddenOrderIds(prev => {
                      const newSet = new Set(prev)
                      newSet.add(orderToDelete.id || orderToDelete.order_number)
                      return newSet
                    })
                    setOrderToDelete(null)
                  }}
                  className="px-4 py-2 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md transition-all cursor-pointer text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}