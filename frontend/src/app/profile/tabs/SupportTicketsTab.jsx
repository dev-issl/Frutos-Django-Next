'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, X, Upload, MessageSquare, Clock, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Send, MoreVertical } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

const CATEGORY_CHOICES = [
  { value: 'GENERAL', label: 'General Inquiry' },
  { value: 'TECHNICAL', label: 'Technical Issue' },
  { value: 'PAYMENT', label: 'Payment Problem' },
  { value: 'ACCOUNT', label: 'Account Issue' },
  { value: 'ORDER', label: 'Order Inquiry' },
  { value: 'PRODUCT', label: 'Product Question' },
]

const PRIORITY_CHOICES = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
]

const formatMessageTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `Today at ${timeStr}`;
  } else if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  } else {
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays <= 7) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `${days[date.getDay()]} at ${timeStr}`;
    }
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })} at ${timeStr}`;
  }
};

export default function SupportTicketsTab({ authFetch }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Selected ticket for chat
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  
  // Form state
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('GENERAL')
  const [priority, setPriority] = useState('MEDIUM')
  const [description, setDescription] = useState('')
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  
  const fileInputRef = useRef(null)

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true)
      const res = await authFetch(`${API_BASE}/auth/tickets/`)
      if (!res.ok) throw new Error('Failed to fetch tickets')
      const data = await res.json()
      setTickets(Array.isArray(data) ? data : (data.results || []))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  // Polling for updates if a ticket is selected
  useEffect(() => {
    fetchTickets()
    
    // Poll every 5 seconds if a ticket is selected to get new messages instantly
    let interval;
    if (selectedTicketId) {
      interval = setInterval(() => {
        authFetch(`${API_BASE}/auth/tickets/`).then(res => res.json()).then(data => {
          setTickets(Array.isArray(data) ? data : (data.results || []))
        }).catch(() => {})
      }, 5000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [fetchTickets, selectedTicketId, authFetch])

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length) {
      const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024)
      if (validFiles.length < files.length) {
        alert("Some images were discarded because they exceed the 5MB limit.")
      }
      
      const newPreviews = validFiles.map(f => URL.createObjectURL(f))
      setImageFiles(prev => [...prev, ...validFiles])
      setImagePreviews(prev => [...prev, ...newPreviews])
    }
  }

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!subject.trim() || !description.trim()) {
      alert("Subject and Description are required.")
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('subject', subject)
      formData.append('category', category)
      formData.append('priority', priority)
      formData.append('description', description)
      if (imageFiles.length > 0) {
        imageFiles.forEach(file => {
          formData.append('images', file)
        })
      }

      const res = await authFetch(`${API_BASE}/auth/tickets/`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || 'Failed to submit ticket')
      }

      // Reset form
      setSubject('')
      setCategory('GENERAL')
      setPriority('MEDIUM')
      setDescription('')
      setImageFiles([])
      setImagePreviews([])
      setShowForm(false)
      
      // Refresh list
      fetchTickets()
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'OPEN': return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case 'IN_PROGRESS': return <Clock className="w-4 h-4 text-blue-600" />
      case 'RESOLVED': return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'CLOSED': return <CheckCircle2 className="w-4 h-4 text-slate-600" />
      default: return <AlertCircle className="w-4 h-4 text-slate-600" />
    }
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'OPEN': return 'bg-yellow-100 text-yellow-700'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700'
      case 'RESOLVED': return 'bg-green-100 text-green-700'
      case 'CLOSED': return 'bg-slate-100 text-slate-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  if (loading && tickets.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#00694C]" />
      </div>
    )
  }

  const selectedTicket = tickets.find(t => t.id === selectedTicketId)

  // -- Chat Interface will be rendered as a modal at the bottom --

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Support Tickets</h2>
          <p className="text-sm text-gray-500 mt-1">Submit issues and track your support requests.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#00694C] text-white text-sm font-medium rounded-lg hover:bg-[#00523b] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Ticket
          </button>
        )}
      </div>

      {/* New Ticket Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Create New Ticket</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Brief summary of your issue..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00694C] focus:border-transparent"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00694C] focus:border-transparent cursor-pointer"
                >
                  {CATEGORY_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00694C] focus:border-transparent cursor-pointer"
                >
                  {PRIORITY_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Please describe your issue in detail..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00694C] focus:border-transparent resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Screenshot / Images (Optional)</label>
              <div className="flex flex-wrap gap-4 mb-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative inline-block">
                    <img src={preview} alt="Preview" className="h-32 w-auto object-contain border border-gray-200 rounded-lg bg-white" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <Upload className="w-6 h-6 mb-2 text-gray-400" />
                <span className="text-sm">Click to upload images</span>
                <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
              </div>
              
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="flex justify-end pt-2 gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#00694C] text-white text-sm font-medium rounded-lg hover:bg-[#00523b] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                Submit Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tickets List */}
      {!showForm && tickets.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-10 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No tickets yet</h3>
          <p className="text-gray-500 mt-1 max-w-sm">If you need help with an order, your account, or a technical issue, open a support ticket.</p>
        </div>
      )}

      {!showForm && tickets.length > 0 && (
        <div className="space-y-4">
          {tickets.map(ticket => (
            <div 
              key={ticket.id} 
              onClick={() => setSelectedTicketId(ticket.id)}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-[#00694C]/50 transition-colors cursor-pointer shadow-sm hover:shadow"
            >
              <div className="p-5">
                <div className="flex flex-wrap gap-2 justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-gray-400">#{ticket.id}</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(ticket.status)}`}>
                      {getStatusIcon(ticket.status)}
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {ticket.category}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h4 className="text-base font-semibold text-gray-900 mb-1">{ticket.subject}</h4>
                <p className="text-sm text-gray-500 truncate max-w-3xl">
                  {ticket.description}
                </p>
                
                {/* Unread indicator or last message info could go here */}
                {ticket.messages && ticket.messages.length > 0 && (
                  <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {ticket.messages.length} replies
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat Modal */}
      {selectedTicket && (
        <TicketChat 
          ticket={selectedTicket} 
          authFetch={authFetch} 
          onBack={() => setSelectedTicketId(null)} 
          getStatusBadge={getStatusBadge}
          getStatusIcon={getStatusIcon}
        />
      )}
    </div>
  )
}

function TicketChat({ ticket, authFetch, onBack, getStatusBadge, getStatusIcon }) {
  const [replyText, setReplyText] = useState('')
  const [replyImages, setReplyImages] = useState([])
  const [replyImagePreviews, setReplyImagePreviews] = useState([])
  const [sending, setSending] = useState(false)
  
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editingMessageText, setEditingMessageText] = useState('')
  const [openMenuId, setOpenMenuId] = useState(null)
  const [deleteModalId, setDeleteModalId] = useState(null)

  const fileRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Scroll to bottom whenever ticket messages change
  const messagesCount = ticket.messages?.length || 0;
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messagesCount])

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024)
      if (validFiles.length < files.length) {
        alert("Some files were skipped because they exceed 5MB")
      }
      setReplyImages(prev => [...prev, ...validFiles])
      
      const newPreviews = validFiles.map(file => URL.createObjectURL(file))
      setReplyImagePreviews(prev => [...prev, ...newPreviews])
    }
  }

  const removeImage = (indexToRemove) => {
    setReplyImages(prev => prev.filter((_, idx) => idx !== indexToRemove))
    setReplyImagePreviews(prev => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!replyText.trim() && replyImages.length === 0) return

    setSending(true)
    try {
      const formData = new FormData()
      if (replyText.trim()) formData.append('message', replyText)
      replyImages.forEach(img => {
        formData.append('images', img)
      })

      const res = await authFetch(`${API_BASE}/auth/tickets/${ticket.id}/reply/`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Failed to send reply')
      }

      setReplyText('')
      setReplyImages([])
      setReplyImagePreviews([])
      // The parent polling will pick up the new message shortly, or we could optimistically update
    } catch (err) {
      alert(err.message)
    } finally {
      setSending(false)
    }
  }

  const handleDeleteMessage = async (msgId) => {
    try {
      const res = await authFetch(`${API_BASE}/auth/tickets/${ticket.id}/messages/${msgId}/`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete message')
      setDeleteModalId(null)
      // Wait for next poll or could update locally
    } catch (err) {
      alert(err.message)
    }
  }

  const handleEditSubmit = async (msgId) => {
    if (!editingMessageText.trim()) return;
    try {
      const res = await authFetch(`${API_BASE}/auth/tickets/${ticket.id}/messages/${msgId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: editingMessageText })
      })
      if (!res.ok) throw new Error('Failed to edit message')
      setEditingMessageId(null)
      setEditingMessageText('')
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onBack}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusBadge(ticket.status)}`}>
                  {getStatusIcon(ticket.status)}
                  {ticket.status.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-mono text-gray-400">#{ticket.id}</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">{ticket.subject}</h3>
            </div>
          </div>
          <button 
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
        
        {/* Original Ticket Description as First Message */}
        <div className="flex flex-col items-end">
          <div className="max-w-[85%] bg-[#00694C] text-white rounded-2xl rounded-tr-sm px-3 py-2 shadow-sm">
            <p className="text-[14px] whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
            
            {ticket.images && ticket.images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {ticket.images.map(img => (
                  <a key={img.id} href={img.image} target="_blank" rel="noopener noreferrer" className="cursor-pointer block">
                    <img src={img.image} className="h-20 w-auto rounded border border-white/20 object-cover" alt="attachment" />
                  </a>
                ))}
              </div>
            )}
            <div className="text-[10px] text-white/70 mt-2 text-right">
              {new Date(ticket.created_at).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Legacy Admin Response (if exists) */}
        {ticket.admin_response && (
          <div className="flex flex-col items-start">
            <div className="flex items-end gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[14px] text-slate-600">support_agent</span>
              </div>
              <span className="text-xs text-slate-500 font-medium">Support Team</span>
            </div>
            <div className="max-w-[85%] bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm ml-8">
              <p className="text-[14px] whitespace-pre-wrap leading-relaxed">{ticket.admin_response}</p>
            </div>
          </div>
        )}

        {/* New Messages Thread */}
        {ticket.messages && ticket.messages.map(msg => {
          const isUser = !msg.isAdmin
          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              {!isUser && (
                <div className="flex items-end gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[14px] text-slate-600">support_agent</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{msg.senderName || 'Support Team'}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 group/msg relative">
                {/* 3-Dot Menu Actions (Only for user) */}
                {isUser && !msg.is_deleted && ticket.status !== 'CLOSED' && (
                  <div className="relative flex items-center">
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
                      className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover/msg:opacity-100 focus:opacity-100 mr-1 cursor-pointer" 
                      title="More options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {openMenuId === msg.id && (
                      <div className="absolute right-full top-0 mr-2 bg-white shadow-lg border border-gray-100 rounded-xl py-1 z-20 min-w-[120px] overflow-hidden flex flex-col">
                        <button 
                          onClick={() => { setEditingMessageId(msg.id); setEditingMessageText(msg.message); setOpenMenuId(null); }} 
                          className="px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors w-full cursor-pointer"
                        >
                          Edit
                        </button>
                        <div className="h-px w-full bg-gray-100"></div>
                        <button 
                          onClick={() => { setDeleteModalId(msg.id); setOpenMenuId(null); }} 
                          className="px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 transition-colors w-full cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className={`max-w-[85%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
                  {(msg.message || msg.is_deleted || editingMessageId === msg.id) && (
                    <div className={`px-3 py-2 shadow-sm relative ${
                      isUser 
                        ? 'bg-[#00694C] text-white rounded-2xl rounded-tr-sm' 
                        : 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm ml-8'
                    }`}>
                      {msg.is_deleted ? (
                        <p className="text-sm italic text-white/70">You deleted this message</p>
                      ) : editingMessageId === msg.id ? (
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          <textarea 
                            value={editingMessageText}
                            onChange={(e) => setEditingMessageText(e.target.value)}
                            className="w-full bg-white/10 border border-white/30 rounded p-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
                            rows="3"
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingMessageId(null)} className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors cursor-pointer">Cancel</button>
                            <button onClick={() => handleEditSubmit(msg.id)} className="text-xs bg-white text-[#00694C] font-medium hover:bg-gray-100 px-2 py-1 rounded transition-colors cursor-pointer">Save</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                      )}
                    </div>
                  )}

                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className={`flex flex-wrap gap-2 ${!isUser && 'ml-8'} ${isUser ? 'justify-end' : 'justify-start'}`}>
                      {msg.attachments.map((att, i) => (
                        <a key={i} href={att.file} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                          <img src={att.file} className="h-40 w-auto rounded-lg object-cover shadow-sm border border-gray-200 hover:opacity-90 transition-opacity" alt="attachment" />
                        </a>
                      ))}
                    </div>
                  )}

                  <div className={`flex items-center gap-1 text-[10px] mt-1 ${isUser ? 'justify-end text-gray-400' : 'justify-start text-gray-400 ml-8'}`}>
                    {msg.is_edited && !msg.is_deleted && <span>(edited)</span>}
                    <span>{formatMessageTime(msg.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Input */}
      {ticket.status !== 'CLOSED' && (
        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
          {replyImagePreviews.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-3">
              {replyImagePreviews.map((preview, idx) => (
                <div key={idx} className="relative inline-block">
                  <img src={preview} alt={`Preview ${idx + 1}`} className="h-20 w-auto object-cover rounded-lg border border-gray-200 shadow-sm" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md transition-transform hover:scale-105 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="p-3 text-gray-400 hover:text-[#00694C] hover:bg-[#00694C]/10 rounded-xl transition-colors shrink-0 cursor-pointer"
            >
              <Upload className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileRef} 
              onChange={handleImageChange} 
              accept="image/*,.pdf,.doc,.docx" 
              className="hidden" 
              multiple 
            />
            
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Type your reply..."
              className="flex-1 max-h-32 min-h-[44px] p-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00694C]/50 focus:border-[#00694C] resize-y"
              rows={1}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e)
                }
              }}
            />
            
            <button
              type="submit"
              disabled={sending || (!replyText.trim() && replyImages.length === 0)}
              className="flex items-center justify-center w-12 h-12 bg-[#0f172a] text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:bg-slate-300 transition-all shrink-0 shadow-md hover:shadow-lg mb-1 cursor-pointer disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      )}
      {ticket.status === 'CLOSED' && (
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-sm text-gray-500 shrink-0">
          This ticket has been closed. You cannot reply to a closed ticket.
        </div>
      )}
      </div>
      {/* Delete Confirmation Modal */}
      {deleteModalId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Message?</h3>
            <p className="text-gray-500 text-sm text-center mb-6">
              This action cannot be undone. Are you sure you want to permanently delete this message?
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setDeleteModalId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteMessage(deleteModalId)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 shadow-sm transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
