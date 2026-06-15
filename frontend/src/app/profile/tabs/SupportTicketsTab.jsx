'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, X, Upload, MessageSquare, Clock, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Send, MoreVertical, ChevronDown, Smile, Paperclip, ZoomIn, Download, User, Tag, XCircle } from 'lucide-react'

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
    
    // Poll every 1.5 seconds if a ticket is selected to get new messages instantly
    let interval;
    if (selectedTicketId) {
      interval = setInterval(() => {
        authFetch(`${API_BASE}/auth/tickets/`).then(res => res.json()).then(data => {
          setTickets(Array.isArray(data) ? data : (data.results || []))
        }).catch(() => {})
      }, 1500)
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


const EMOJI_LIST = [
  '😀','😃','😄','😁','😆','😅','😂','🤣','🥲','🥹','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🫣','🤭','🫢','🫡','🤫','🫠','🤥','😶','🫥','😐','🫤','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😮‍💨','😵','😵‍💫','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾',
  '👋','🤚','🖐','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🫀','🫁','🧠','🦷','🦴','👀','👁','👅','👄','💋','🩸',
  '❤️','🧡','💛','💚','💙','🩵','💜','🖤','🩶','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','🔥','✨','🌟','💫','💥','💢','💦','💧','💤','💨'
];

function ImageViewer({ src, onClose }) {
  if (!src) return null;

  const handleDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = src.split('/').pop() || 'download';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      window.open(src, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80" onClick={onClose}>
      <button 
        onClick={handleDownload} 
        className="absolute top-4 right-16 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 cursor-pointer"
        title="Download Image"
      >
        <Download className="w-6 h-6" />
      </button>
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 cursor-pointer"
        title="Close"
      >
        <X className="w-6 h-6" />
      </button>
      <img
        src={src}
        alt="Ticket attachment"
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function TicketChat({ ticket: initialTicket, authFetch, onBack, getStatusBadge, getStatusIcon }) {
  const [ticket, setTicket] = useState(initialTicket);
  const [replyText, setReplyText] = useState('')
  const [replyImages, setReplyImages] = useState([])
  const [replyImagePreviews, setReplyImagePreviews] = useState([])
  const [sending, setSending] = useState(false)
  const [viewerSrc, setViewerSrc] = useState(null)
  
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editingMessageText, setEditingMessageText] = useState('')
  const [openMenuId, setOpenMenuId] = useState(null)
  const [deleteModalId, setDeleteModalId] = useState(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const fileRef = useRef(null)
  const messagesEndRef = useRef(null)

  const messagesCount = ticket.messages?.length || 0;
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messagesCount, ticket.is_admin_typing])

  // Handle typing indicator
  useEffect(() => {
    if (!replyText.trim()) return;
    const timeout = setTimeout(() => {
      authFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/auth/tickets/${ticket.id}/typing/`, { method: 'POST' }).catch(() => {});
    }, 300);
    return () => clearTimeout(timeout);
  }, [replyText, authFetch, ticket.id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showEmojiPicker && !e.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

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

      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/auth/tickets/${ticket.id}/reply/`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Failed to send reply')

      const updatedRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/auth/tickets/${ticket.id}/`);
      if (updatedRes.ok) {
        const updatedTicket = await updatedRes.json();
        setTicket(updatedTicket);
      }

      setReplyText('')
      setReplyImages([])
      setReplyImagePreviews([])
    } catch (err) {
      alert(err.message)
    } finally {
      setSending(false)
    }
  }

  const handleDeleteMessage = async (msgId) => {
    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/auth/tickets/${ticket.id}/messages/${msgId}/`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete message')
      setDeleteModalId(null)
      
      const updatedRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/auth/tickets/${ticket.id}/`);
      if (updatedRes.ok) {
        const updatedTicket = await updatedRes.json();
        setTicket(updatedTicket);
      }
    } catch (err) {
      alert(err.message)
    }
  }

  const handleEditSubmit = async (msgId) => {
    if (!editingMessageText.trim()) return;
    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/auth/tickets/${ticket.id}/messages/${msgId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: editingMessageText })
      })
      if (!res.ok) throw new Error('Failed to edit message')
      setEditingMessageId(null)
      setEditingMessageText('')

      const updatedRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/auth/tickets/${ticket.id}/`);
      if (updatedRes.ok) {
        const updatedTicket = await updatedRes.json();
        setTicket(updatedTicket);
      }
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <>
      {viewerSrc && <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />}
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 sm:p-4" onClick={onBack}>
        <div 
          className="bg-white sm:rounded-xl shadow-2xl w-full h-[100dvh] sm:h-[85vh] sm:max-w-2xl flex flex-col overflow-hidden" 
          onClick={(e) => e.stopPropagation()}
        >
          {/* Chat Header */}
          <div className="flex items-start justify-between px-3 py-2.5 sm:px-4 sm:py-3 border-b border-slate-200/80 bg-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] shrink-0 z-20 relative">
            <div className="flex-1 min-w-0 pr-4 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100/80 text-slate-600 rounded-lg text-xs font-semibold border border-slate-200/50">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500"></span>
                  </span>
                  #{ticket.id}
                </div>
                
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-transform hover:-translate-y-0.5 cursor-default shadow-sm ${getStatusBadge(ticket.status)}`}>
                  {getStatusIcon(ticket.status)}
                  {ticket.status.replace("_", " ")}
                </span>
                
                <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-lg shadow-sm transition-transform hover:-translate-y-0.5 cursor-default bg-gray-100 text-gray-600">
                  {ticket.priority || 'MEDIUM'}
                </span>
              </div>
              
              <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight truncate w-full">{ticket.subject}</h2>
              
              <div className="flex items-center gap-3 sm:gap-4 text-[11px] text-slate-500 mt-1 font-medium">
                <span className="flex items-center gap-1 group cursor-default">
                  <div className="p-0.5 bg-slate-100 rounded group-hover:bg-slate-200 transition-colors">
                    <Tag className="w-3 h-3 text-slate-600" />
                  </div>
                  {ticket.category || "General"}
                </span>
              </div>
            </div>
            
            <button 
              onClick={onBack}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-300 hover:rotate-90 shrink-0 cursor-pointer focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 scroll-smooth relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ backgroundColor: '#efeae2', backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")', backgroundSize: '400px' }}>
            
            <div className="flex flex-col items-end mb-2">
              <div className="max-w-[85%] bg-[#dcf8c6] rounded-xl rounded-tr-none px-2.5 pt-2 pb-1.5 shadow-sm relative border border-[#dcf8c6]">
                <p className="text-[14.5px] whitespace-pre-wrap leading-snug text-[#111b21]">{ticket.description}</p>
                {ticket.images && ticket.images.length > 0 && (
                  <div className={`mt-2 grid gap-1 max-w-[320px] ${ticket.images.length === 1 ? 'grid-cols-1' : ticket.images.length === 2 ? 'grid-cols-2' : ticket.images.length >= 3 ? 'grid-cols-3' : ''}`}>
                    {ticket.images.map((imgObj, i) => (
                      <button key={i} onClick={() => setViewerSrc(imgObj.image)} className="relative overflow-hidden rounded-md cursor-pointer w-full">
                        <img src={imgObj.image} alt={`attachment ${i + 1}`} className={`w-full object-cover border border-slate-100 ${ticket.images.length === 1 ? 'max-h-64 h-auto' : 'aspect-square'}`} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ZoomIn className="w-5 h-5 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex justify-end items-center mt-0.5 space-x-1 float-right ml-3 text-[11px] text-[#667781]">
                  <span>{new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="clear-both"></div>
              </div>
            </div>

            {ticket.admin_response && (
              <div className="flex flex-col items-start mb-2">
                <div className="flex items-end max-w-[85%] justify-start">
                  <div className="flex-shrink-0 mr-2 mb-1">
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shadow-sm border border-slate-200">
                      <span className="material-symbols-outlined text-[14px]">support_agent</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl rounded-tl-none border border-slate-200/50 px-2.5 pt-2 pb-1.5 shadow-sm relative">
                    <div className="text-[12px] font-bold text-[#e87c03] mb-0.5">Support Team</div>
                    <p className="text-[14.5px] whitespace-pre-wrap leading-snug text-[#111b21]">{ticket.admin_response}</p>
                    <div className="flex justify-end items-center mt-0.5 space-x-1 float-right ml-3 text-[11px] text-[#667781]">
                      <span>Legacy</span>
                    </div>
                    <div className="clear-both"></div>
                  </div>
                </div>
              </div>
            )}

            {ticket.messages && ticket.messages.map((msg) => {
              const isUser = msg.senderEmail === ticket.userEmail;
              const hasText = msg.message && msg.message.trim().length > 0;
              const isOnlyImages = !hasText && msg.attachments && msg.attachments.length > 0;

              return (
                <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-2 group/msg relative w-full`}>
                  <div className={`flex items-end max-w-[85%] ${isUser ? 'justify-end' : 'justify-start'}`}>
                    
                    {!isUser && (
                      <div className="flex-shrink-0 mr-2 mb-1">
                        {msg.sender_avatar || msg.senderAvatar ? (
                          <img src={msg.sender_avatar || msg.senderAvatar} alt="Support" className="w-7 h-7 rounded-full object-cover shadow-sm border border-slate-200" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shadow-sm border border-slate-200">
                            <span className="material-symbols-outlined text-[14px]">support_agent</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`relative ${
                      msg.is_deleted ? (isUser ? 'bg-[#dcf8c6] rounded-xl rounded-tr-none border border-[#dcf8c6] px-2.5 pt-2 pb-1.5 shadow-sm' : 'bg-white rounded-xl rounded-tl-none border border-slate-200/50 px-2.5 pt-2 pb-1.5 shadow-sm')
                      : isOnlyImages ? '' 
                      : (isUser ? 'bg-[#dcf8c6] rounded-xl rounded-tr-none border border-[#dcf8c6] px-2.5 pt-2 pb-1.5 shadow-sm' : 'bg-white rounded-xl rounded-tl-none border border-slate-200/50 px-2.5 pt-2 pb-1.5 shadow-sm')
                    }`}>
                    
                    {isUser && !msg.is_deleted && ticket.status !== 'CLOSED' && (
                      <div className="absolute top-1 right-2 opacity-0 group-hover/msg:opacity-100 transition-opacity z-10">
                        <button onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)} className={`hover:text-slate-600 cursor-pointer ${isOnlyImages ? 'text-white drop-shadow-md' : 'text-slate-400'}`}>
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        {openMenuId === msg.id && (
                          <div className="absolute right-0 top-full bg-white shadow-lg border border-slate-100 rounded-md py-1 z-20 min-w-[120px] flex flex-col mt-1">
                            {!isOnlyImages && (
                              <button onClick={() => { setEditingMessageId(msg.id); setEditingMessageText(msg.message); setOpenMenuId(null); }} className="px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-50 w-full cursor-pointer">Edit</button>
                            )}
                            <button onClick={() => { setDeleteModalId(msg.id); setOpenMenuId(null); }} className="px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 w-full cursor-pointer">Delete</button>
                          </div>
                        )}
                      </div>
                    )}

                    {!isUser && !isOnlyImages && (
                      <div className="text-[12px] font-bold text-[#e87c03] mb-0.5">{msg.senderName || 'Support Team'}</div>
                    )}

                    {msg.is_deleted ? (
                      <div className="flex items-center gap-1.5 italic text-[#667781] py-1">
                        <XCircle className="w-4 h-4" />
                        <span className="text-[14.5px]">{isUser ? "You deleted this message" : "This message was deleted"}</span>
                      </div>
                    ) : editingMessageId === msg.id ? (
                      <div className="flex flex-col gap-2 min-w-[200px] mt-1">
                        <textarea 
                          value={editingMessageText}
                          onChange={(e) => setEditingMessageText(e.target.value)}
                          className="w-full bg-white/50 border border-slate-300 rounded p-2 text-[14.5px] text-slate-800 focus:outline-none"
                          rows="2"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingMessageId(null)} className="text-[12px] bg-white hover:bg-slate-50 border border-slate-200 px-2 py-1 rounded cursor-pointer">Cancel</button>
                          <button onClick={() => handleEditSubmit(msg.id)} className="text-[12px] bg-[#00a884] text-white hover:bg-[#008f6f] px-2 py-1 rounded cursor-pointer">Save</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {hasText && <p className={`text-[14.5px] whitespace-pre-wrap leading-snug text-[#111b21] ${isUser ? 'pr-4' : ''}`}>{msg.message}</p>}
                        
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className={`grid gap-1 max-w-[320px] ${hasText ? 'mt-2' : ''} ${msg.attachments.length === 1 ? 'grid-cols-1' : msg.attachments.length === 2 || msg.attachments.length === 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                            {msg.attachments.map((att, i) => (
                              <button key={i} onClick={() => setViewerSrc(att.file)} className={`relative overflow-hidden cursor-pointer w-full ${isOnlyImages ? 'rounded-xl shadow-sm' : 'rounded-md'}`}>
                                <img src={att.file} className={`w-full object-cover ${isOnlyImages && msg.attachments.length === 1 ? 'max-h-64 h-auto' : 'aspect-square'} ${isOnlyImages ? '' : 'border border-black/5'}`} alt="attachment" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <ZoomIn className="w-6 h-6 text-white" />
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    <div className={`flex justify-end items-center mt-1 space-x-1 float-right text-[11px] ${isOnlyImages ? 'bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm text-slate-700 ml-2' : 'text-[#667781] ml-3'}`}>
                      {msg.is_edited && !msg.is_deleted && <span>edited</span>}
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isUser && !msg.is_deleted && (
                        <span className="text-[#53bdeb] tracking-tighter ml-0.5">✓✓</span>
                      )}
                    </div>
                    <div className="clear-both"></div>
                  </div>
                </div>
              </div>
            );
            })}
            {/* Admin Typing Indicator */}
            {ticket.is_admin_typing && (
              <div className="flex flex-col items-start mb-2">
                <div className="flex items-end max-w-[85%] justify-start">
                  <div className="flex-shrink-0 mr-2 mb-1">
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shadow-sm border border-slate-200">
                      <span className="material-symbols-outlined text-[14px]">support_agent</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl rounded-tl-none border border-slate-200/50 px-3 py-2 shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} className="h-1" />
          </div>

          {ticket.status !== 'CLOSED' ? (
            <div className="p-2 sm:p-3 bg-[#f0f2f5] shrink-0 flex items-end gap-1.5 sm:gap-2 relative z-10">
              <div className="flex-1 bg-white rounded-[20px] sm:rounded-[24px] flex flex-col overflow-visible shadow-sm min-h-[40px] sm:min-h-[44px]">
                 {replyImagePreviews.length > 0 && (
                  <div className="px-3 sm:px-4 pt-2 sm:pt-3 flex flex-wrap gap-2 pb-2">
                    {replyImagePreviews.map((preview, idx) => (
                      <div key={idx} className="relative inline-block">
                        <img src={preview} alt={`Preview ${idx + 1}`} className="h-12 sm:h-16 w-auto object-cover rounded-md" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-end p-1 pl-2 sm:pl-3 pr-1 sm:pr-2 relative">
                  <div className="relative emoji-picker-container">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-1.5 sm:p-2 transition-colors cursor-pointer shrink-0 ${showEmojiPicker ? 'text-[#00a884]' : 'text-[#54656f] hover:text-[#00a884]'}`}
                      title="Emoji"
                    >
                      <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    
                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-100 p-3 z-[200] w-[280px] sm:w-[320px] max-h-[250px] sm:max-h-[300px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 origin-bottom-left [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                        <div className="grid grid-cols-6 sm:grid-cols-7 gap-1.5 sm:gap-2">
                          {EMOJI_LIST.map((emoji, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setReplyText(prev => prev + emoji)}
                              className="text-xl sm:text-2xl hover:bg-slate-100 rounded-lg p-1 transition-colors cursor-pointer flex items-center justify-center hover:scale-110"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="p-1.5 sm:p-2 text-[#54656f] hover:text-[#00a884] transition-colors cursor-pointer shrink-0"
                    title="Attach"
                  >
                    <Paperclip className="w-5 h-5 sm:w-6 sm:h-6" />
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
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a message"
                    className="flex-1 max-h-[100px] sm:max-h-[120px] py-1.5 sm:py-2.5 px-1 sm:px-2 text-[14px] sm:text-[15px] bg-transparent border-none text-slate-800 focus:outline-none focus:ring-0 resize-y leading-relaxed"
                    rows="1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                  />

                  {(replyText.trim() || replyImages.length > 0 || sending) && (
                    <button
                      onClick={handleSend}
                      disabled={sending}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#00a884] text-white flex items-center justify-center shrink-0 hover:bg-[#008f6f] transition-all disabled:opacity-50 mb-1 ml-1 cursor-pointer animate-in zoom-in duration-200"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-sm text-gray-500 shrink-0">
              This ticket has been closed. You cannot reply to a closed ticket.
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Message?</h3>
            <p className="text-slate-500 text-sm text-center mb-6">
              This action cannot be undone. Are you sure you want to permanently delete this message?
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setDeleteModalId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors cursor-pointer"
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
    </>
  )
}
