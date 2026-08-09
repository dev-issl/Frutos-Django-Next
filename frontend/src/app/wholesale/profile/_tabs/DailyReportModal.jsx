import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'react-hot-toast'
import { createWholesaleDailyReport } from '@/lib/api'
import { X, Calendar, DollarSign, CreditCard, Receipt, Store, ShoppingBag, FileText } from 'lucide-react'

export default function DailyReportModal({ onClose, accessToken, onReportCreated }) {
  const [mounted, setMounted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const dateInputRef = useRef(null)

  const [formData, setFormData] = useState({
    cash: '',
    bank: '',
    expenses: '',
    store: '',
    purchase: '',
    date: new Date().toISOString().split('T')[0],
    purchase_note: ''
  })

  useEffect(() => setMounted(true), [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.cash || !formData.bank || !formData.date) {
      toast.error('Cash, Bank, and Date are required.')
      return
    }

    setSubmitting(true)
    
    // Clean up empty inputs to be null instead of empty strings so the API validator accepts them
    const payload = {
      cash: formData.cash,
      bank: formData.bank,
      date: formData.date,
      expenses: formData.expenses === '' ? null : formData.expenses,
      store: formData.store === '' ? null : formData.store,
      purchase: formData.purchase === '' ? null : formData.purchase,
      purchase_note: formData.purchase_note || null
    }

    try {
      const newReport = await createWholesaleDailyReport(accessToken, payload)
      toast.success('Daily report submitted successfully!')
      onReportCreated(newReport)
      onClose()
    } catch (err) {
      toast.error(err.detail || err.error || 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDateClick = () => {
    if (dateInputRef.current && dateInputRef.current.showPicker) {
      dateInputRef.current.showPicker();
    }
  }

  const modalContent = (
    <div className="fixed inset-0 bg-slate-950/60 z-[999] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-950/25 w-full max-w-[550px] overflow-hidden transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-8">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Submit Daily Report</h2>
            <p className="text-[12px] text-slate-500 mt-1">Record today's wholesale financial status accurately.</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-all cursor-pointer border border-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 bg-slate-50/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
            
            {/* Cash */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Money (Cash) <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                </div>
                <input 
                  type="number" step="0.01" name="cash" value={formData.cash} onChange={handleChange} required
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/80 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm placeholder:text-slate-300 text-slate-800 font-medium"
                  placeholder="0.00"
                />
              </div>
              <p className="text-[10px] text-slate-400">Total cash received in hand today</p>
            </div>

            {/* Bank */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Bank <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                </div>
                <input 
                  type="number" step="0.01" name="bank" value={formData.bank} onChange={handleChange} required
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/80 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm placeholder:text-slate-300 text-slate-800 font-medium"
                  placeholder="0.00"
                />
              </div>
              <p className="text-[10px] text-slate-400">Total amount received in bank/card</p>
            </div>

            {/* Expenses */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Expenses</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Receipt className="h-4 w-4 text-rose-500" />
                </div>
                <input 
                  type="number" step="0.01" name="expenses" value={formData.expenses} onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/80 rounded-xl text-sm focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all shadow-sm placeholder:text-slate-300 text-slate-800 font-medium"
                  placeholder="0.00"
                />
              </div>
              <p className="text-[10px] text-slate-400">Any daily shop expenses</p>
            </div>

            {/* Warehouse */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Warehouse (Store)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Store className="h-4 w-4 text-indigo-500" />
                </div>
                <input 
                  type="number" step="0.01" name="store" value={formData.store} onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/80 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm placeholder:text-slate-300 text-slate-800 font-medium"
                  placeholder="0.00"
                />
              </div>
              <p className="text-[10px] text-slate-400">Stock/goods taken from warehouse</p>
            </div>

            {/* Purchase */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Purchase</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ShoppingBag className="h-4 w-4 text-amber-500" />
                </div>
                <input 
                  type="number" step="0.01" name="purchase" value={formData.purchase} onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/80 rounded-xl text-sm focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all shadow-sm placeholder:text-slate-300 text-slate-800 font-medium"
                  placeholder="0.00"
                />
              </div>
              <p className="text-[10px] text-slate-400">Outside purchases made today</p>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Date <span className="text-red-500">*</span></label>
              <div 
                className="relative cursor-pointer group"
                onClick={handleDateClick}
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-[#00a884] group-hover:scale-110 transition-transform" />
                </div>
                <input 
                  ref={dateInputRef}
                  type="date" name="date" value={formData.date} onChange={handleChange} required
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/80 rounded-xl text-sm focus:ring-4 focus:ring-[#00a884]/10 focus:border-[#00a884] outline-none transition-all shadow-sm cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer text-slate-800 font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-400">Click to select report date</p>
            </div>

            {/* Purchase Note */}
            <div className="sm:col-span-2 space-y-1.5 mt-1">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Purchase Note</label>
              <div className="relative">
                <div className="absolute top-2.5 left-3 pointer-events-none">
                  <FileText className="h-4 w-4 text-slate-400" />
                </div>
                <textarea 
                  name="purchase_note" rows="2" value={formData.purchase_note} onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/80 rounded-xl text-sm focus:ring-4 focus:ring-[#00a884]/10 focus:border-[#00a884] outline-none transition-all shadow-sm resize-none placeholder:text-slate-300 text-slate-800"
                  placeholder="Details of what was purchased (optional)..."
                ></textarea>
              </div>
            </div>

          </div>
          
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 bg-white">
            <button 
              type="button" onClick={onClose}
              className="px-5 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              Cancel
            </button>
            <button 
              type="submit" disabled={submitting}
              className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#00a884] to-[#059669] rounded-xl hover:from-[#009070] hover:to-[#047857] hover:shadow-lg disabled:opacity-60 disabled:hover:shadow-none flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Submitting...
                </>
              ) : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(modalContent, document.body)
}
