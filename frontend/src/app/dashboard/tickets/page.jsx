"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  MessageSquare, Eye, Reply, CheckCircle2, Clock, AlertCircle,
  XCircle, Loader2, ChevronDown, ZoomIn, X, Send, RefreshCw, Paperclip, Upload, User, MoreVertical, Mail, Tag, AlertTriangle, Smile, Download
} from "lucide-react";
import Container from "@/app/dashboard/_components/Container";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import api from "@/app/dashboard/_lib/api";

/* ─── Constants ──────────────────────────────────────────────── */
const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "OPEN", label: "Open" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "RESOLVED", label: "Resolved" },
  { id: "CLOSED", label: "Closed" },
];

const PRIORITY_BADGE = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-600",
  HIGH: "bg-orange-100 text-orange-600",
  URGENT: "bg-red-100 text-red-600",
};

const STATUS_BADGE = {
  OPEN: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-slate-100 text-slate-600",
};

const STATUS_ICON = {
  OPEN: AlertCircle,
  IN_PROGRESS: Clock,
  RESOLVED: CheckCircle2,
  CLOSED: XCircle,
};

const CATEGORY_LABEL = {
  GENERAL: "General", TECHNICAL: "Technical", PAYMENT: "Payment",
  ACCOUNT: "Account", ORDER: "Order", PRODUCT: "Product",
};

const EMOJI_LIST = [
  '😀','😃','😄','😁','😆','😅','😂','🤣','🥲','🥹','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🫣','🤭','🫢','🫡','🤫','🫠','🤥','😶','🫥','😐','🫤','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😮‍💨','😵','😵‍💫','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾',
  '👋','🤚','🖐','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🫀','🫁','🧠','🦷','🦴','👀','👁','👅','👄','💋','🩸',
  '❤️','🧡','💛','💚','💙','🩵','💜','🖤','🩶','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','🔥','✨','🌟','💫','💥','💢','💦','💧','💤','💨'
];

/* ─── Utility: extract image URLs from text ─────────────────── */
function extractImageUrls(text = "") {
  const urlRegex = /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|gif|webp|svg)(\?[^\s"'<>]*)?/gi;
  return [...new Set(text.match(urlRegex) || [])];
}

/* ─── Image Viewer Modal ─────────────────────────────────────── */
const getFullUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') : 'http://127.0.0.1:8000';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

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

/* ─── Ticket Detail Modal ────────────────────────────────────── */
function TicketDetailModal({ ticket: initialTicket, onClose, onReplySuccess }) {
  const toast = useToastContext();
  const [ticket, setTicket] = useState(initialTicket);
  const [replyText, setReplyText] = useState("");
  const [replyImages, setReplyImages] = useState([]);
  const [replyImagePreviews, setReplyImagePreviews] = useState([]);
  const [newStatus, setNewStatus] = useState(initialTicket.status);
  const [submitting, setSubmitting] = useState(false);
  const [viewerSrc, setViewerSrc] = useState(null);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [ws, setWs] = useState(null);

  const STATUS_OPTIONS = [
    { value: "OPEN", label: "Open", icon: "⚪", color: "text-slate-600", bg: "bg-white" },
    { value: "IN_PROGRESS", label: "Progress", icon: "🔵", color: "text-blue-600", bg: "bg-blue-50" },
    { value: "RESOLVED", label: "Resolved", icon: "🟢", color: "text-emerald-600", bg: "bg-emerald-50" },
    { value: "CLOSED", label: "Closed", icon: "⚫", color: "text-slate-700", bg: "bg-slate-100" }
  ];
  const currentStatusObj = STATUS_OPTIONS.find(s => s.value === newStatus) || STATUS_OPTIONS[0];

  const messagesEndRef = useRef(null);
  const fileRef = useRef(null);

  // Scroll to bottom when messages change
  const messagesCount = ticket.messages?.length || 0;
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesCount, ticket.is_user_typing]);

  // Handle click outside to close emoji picker
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showEmojiPicker && !e.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // Connect to WebSocket for real-time chat
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const apiHost = process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).host : '127.0.0.1:8000';
    const wsUrl = `${wsProtocol}//${apiHost}/ws/chat/ticket/${ticket.id}/`;
    
    const socket = new WebSocket(wsUrl);
    
    socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'message') {
          const newMsg = data.message;
          setTicket(prev => {
            const msgs = prev.messages || [];
            const idx = msgs.findIndex(m => m.id === newMsg.id || (m.isTemp && m.message === newMsg.message));
            if (idx !== -1) {
              const updated = [...msgs];
              updated[idx] = newMsg;
              return { ...prev, messages: updated };
            }
            return { ...prev, messages: [...msgs, newMsg] };
          });
        } else if (data.type === 'typing') {
          if (data.sender_id !== 'admin') {
            setTicket(prev => ({ ...prev, is_user_typing: data.is_typing }));
          }
        } else if (data.type === 'message_status') {
          setTicket(prev => ({
            ...prev,
            messages: (prev.messages || []).map(m => m.id === data.message_id ? { ...m, delivery_status: data.status } : m)
          }));
        }
      } catch(err){}
    };
    
    setWs(socket);
    return () => socket.close();
  }, [ticket.id]);

  // Handle typing indicator
  useEffect(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
    if (replyText.trim().length > 0) {
      ws.send(JSON.stringify({ action: 'typing', is_typing: true, sender_id: 'admin' }));
      
      const timeout = setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: 'typing', is_typing: false, sender_id: 'admin' }));
        }
      }, 2000);
      return () => clearTimeout(timeout);
    } else {
      ws.send(JSON.stringify({ action: 'typing', is_typing: false, sender_id: 'admin' }));
    }
  }, [replyText, ws, ticket.id]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024)
      if (validFiles.length < files.length) {
        toast.error("Some files were skipped because they exceed 5MB")
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() && replyImages.length === 0) { 
      toast.error("Message or image is required"); 
      return; 
    }

    // Optimistic UI Update
    const tempId = `temp_${Date.now()}`;
    const tempMsg = {
      id: tempId,
      message: replyText,
      senderEmail: 'admin@system.com', // Dummy for admin
      senderName: 'Admin',
      created_at: new Date().toISOString(),
      isTemp: true,
      delivery_status: 'SENDING',
      attachments: replyImagePreviews.map(p => ({ file: p }))
    };
    
    setTicket(prev => ({
      ...prev,
      messages: [...(prev.messages || []), tempMsg]
    }));

    const currentText = replyText;
    const currentImages = [...replyImages];
    const currentStatus = newStatus;
    
    setReplyText("");
    setReplyImages([]);
    setReplyImagePreviews([]);
    setSubmitting(true);
    
    try {
      const formData = new FormData();
      if (currentText.trim()) formData.append('message', currentText);
      currentImages.forEach(img => {
        formData.append('images', img)
      });
      if (currentStatus !== ticket.status) formData.append('status', currentStatus);

      const newMsg = await api.post(`/api/auth/admin/tickets/${ticket.id}/reply/`, formData);
      
      // Update UI with the real message from the API response
      setTicket(prev => {
        const msgs = prev.messages || [];
        const idx = msgs.findIndex(m => m.id === tempId);
        if (idx !== -1) {
          const updated = [...msgs];
          updated[idx] = newMsg;
          return { ...prev, messages: updated };
        }
        
        // If tempId was already replaced by WebSocket, update by real ID
        const realIdx = msgs.findIndex(m => m.id === newMsg.id);
        if (realIdx !== -1) {
          const updated = [...msgs];
          updated[realIdx] = newMsg;
          return { ...prev, messages: updated };
        }
        
        return { ...prev, messages: [...msgs, newMsg] };
      });
      
      onReplySuccess?.();
    } catch (err) {
      toast.error(err?.message || "Failed to send reply");
      // Revert Optimistic UI
      setTicket(prev => ({
        ...prev,
        messages: (prev.messages || []).filter(m => m.id !== tempId)
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (e) => {
    const nextStatus = e.target.value;
    setNewStatus(nextStatus);
    try {
      await api.patch(`/api/auth/admin/tickets/${ticket.id}/`, { status: nextStatus });
      toast.success("Status updated automatically");
      
      const updatedTicket = await api.get(`/api/auth/admin/tickets/${ticket.id}/`);
      setTicket(updatedTicket);
      onReplySuccess?.();
    } catch (err) {
      toast.error(err?.message || "Failed to update status");
      setNewStatus(ticket.status);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    // Optimistic UI update
    setTicket(prev => ({
      ...prev,
      messages: (prev.messages || []).map(m => m.id === msgId ? { ...m, is_deleted: true, message: '', attachments: [] } : m)
    }));
    setDeleteModalId(null);

    try {
      await api.delete(`/api/auth/admin/tickets/${ticket.id}/messages/${msgId}/`);
      toast.success("Message deleted");
    } catch (err) {
      toast.error(err?.message || "Failed to delete message");
    }
  };

  const handleEditSubmit = async (msgId) => {
    if (!editingMessageText.trim()) return;
    
    const originalText = editingMessageText;
    
    // Optimistic UI update
    setTicket(prev => ({
      ...prev,
      messages: (prev.messages || []).map(m => m.id === msgId ? { ...m, message: originalText, is_edited: true } : m)
    }));
    setEditingMessageId(null);
    setEditingMessageText('');
    
    try {
      await api.patch(`/api/auth/admin/tickets/${ticket.id}/messages/${msgId}/`, {
        message: originalText
      });
      toast.success("Message updated");
    } catch (err) {
      toast.error(err?.message || "Failed to update message");
    }
  };

  const StatusIcon = STATUS_ICON[ticket.status] || AlertCircle;

  return (
    <>
      {viewerSrc && <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />}
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 sm:p-4" onClick={onClose}>
        <div
          className="bg-white sm:rounded-xl shadow-2xl w-full h-[100dvh] sm:h-[85vh] sm:max-w-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
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
                
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-transform hover:-translate-y-0.5 cursor-default shadow-sm ${STATUS_BADGE[ticket.status] || ""}`}>
                  <StatusIcon className="w-3 h-3" />
                  {ticket.status.replace("_", " ")}
                </span>
                
                <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-lg shadow-sm transition-transform hover:-translate-y-0.5 cursor-default ${PRIORITY_BADGE[ticket.priority] || ""}`}>
                  {ticket.priority}
                </span>
              </div>
              
              <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight truncate w-full">Customer Support</h2>
              
              <div className="flex items-center gap-3 sm:gap-4 text-[11px] text-slate-500 mt-1 font-medium">
                <span className="flex items-center gap-1 group cursor-default">
                  <div className="p-0.5 bg-slate-100 rounded group-hover:bg-slate-200 transition-colors">
                    <span className="material-symbols-outlined text-[12px] text-slate-600">support_agent</span>
                  </div>
                  <span className="truncate max-w-[100px] sm:max-w-[200px]">{ticket.subject || "—"}</span>
                </span>
                <span className="flex items-center gap-1 group cursor-default">
                  <div className="p-0.5 bg-slate-100 rounded group-hover:bg-slate-200 transition-colors">
                    <Tag className="w-3 h-3 text-slate-600" />
                  </div>
                  {CATEGORY_LABEL[ticket.category] || ticket.category}
                </span>
              </div>
            </div>
            
            <button 
              onClick={onClose} 
              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-300 hover:rotate-90 shrink-0 cursor-pointer focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 scroll-smooth relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ backgroundColor: '#efeae2', backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")', backgroundSize: '400px' }}>
            {/* Initial Description (User) */}
            <div className="flex flex-col items-start mb-2">
              <div className="max-w-[85%] bg-white rounded-xl rounded-tl-none px-2.5 pt-2 pb-1.5 shadow-sm relative border border-slate-200/50">
                <div className="text-[12px] font-bold text-[#e87c03] mb-0.5">{ticket.userName || 'User'}</div>
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

            {/* Legacy Admin Response (if exists) */}
            {ticket.admin_response && (
              <div className="flex flex-col items-end mb-2">
                <div className="max-w-[85%] bg-[#dcf8c6] rounded-xl rounded-tr-none px-2.5 pt-2 pb-1.5 shadow-sm relative border border-[#dcf8c6]">
                  <p className="text-[14.5px] whitespace-pre-wrap leading-snug text-[#111b21]">{ticket.admin_response}</p>
                  <div className="flex justify-end items-center mt-0.5 space-x-1 float-right ml-3 text-[11px] text-[#667781]">
                    <span>Legacy</span>
                    <span className="text-[#53bdeb] tracking-tighter ml-0.5">✓✓</span>
                  </div>
                  <div className="clear-both"></div>
                </div>
              </div>
            )}

            {/* New Chat Thread */}
            {ticket.messages && ticket.messages.map((msg) => {
              const isAdminMsg = msg.isAdmin || msg.senderEmail === 'admin@system.com';
              const hasText = msg.message && msg.message.trim().length > 0;
              const isOnlyImages = !hasText && msg.attachments && msg.attachments.length > 0;

              return (
                <div key={msg.id} className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'} mb-2 group/msg relative w-full`}>
                  <div className={`flex items-end max-w-[85%] ${isAdminMsg ? 'justify-end' : 'justify-start'}`}>
                    
                    {!isAdminMsg && (
                      <div className="flex-shrink-0 mr-2 mb-1">
                        {msg.sender_avatar || msg.senderAvatar || ticket.user_avatar || ticket.userAvatar ? (
                          <img src={getFullUrl(msg.sender_avatar || msg.senderAvatar || ticket.user_avatar || ticket.userAvatar)} alt="User" className="w-7 h-7 rounded-full object-cover shadow-sm border border-slate-200" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shadow-sm border border-slate-200">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`relative ${
                      msg.is_deleted ? (isAdminMsg ? 'bg-[#dcf8c6] rounded-xl rounded-tr-none border border-[#dcf8c6] px-2.5 pt-2 pb-1.5 shadow-sm' : 'bg-white rounded-xl rounded-tl-none border border-slate-200/50 px-2.5 pt-2 pb-1.5 shadow-sm')
                      : isOnlyImages ? '' 
                      : (isAdminMsg ? 'bg-[#dcf8c6] rounded-xl rounded-tr-none border border-[#dcf8c6] px-2.5 pt-2 pb-1.5 shadow-sm' : 'bg-white rounded-xl rounded-tl-none border border-slate-200/50 px-2.5 pt-2 pb-1.5 shadow-sm')
                    }`}>
                    
                    {/* Admin Dropdown */}
                    {isAdminMsg && !msg.is_deleted && ticket.status !== 'CLOSED' && (
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

                    {!isAdminMsg && !isOnlyImages && (
                      <div className="text-[12px] font-bold text-[#e87c03] mb-0.5">{msg.senderName || ticket.userName || 'User'}</div>
                    )}

                    {msg.is_deleted ? (
                      <div className="flex items-center gap-1.5 italic text-[#667781] py-1">
                        <XCircle className="w-4 h-4" />
                        <span className="text-[14.5px]">{isAdminMsg ? "You deleted this message" : "This message was deleted"}</span>
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
                        {hasText && <p className={`text-[14.5px] whitespace-pre-wrap leading-snug text-[#111b21] ${isAdminMsg ? 'pr-4' : ''}`}>{msg.message}</p>}
                        
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className={`grid gap-1 max-w-[320px] ${hasText ? 'mt-2' : ''} ${msg.attachments.length === 1 ? 'grid-cols-1' : msg.attachments.length === 2 || msg.attachments.length === 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                            {msg.attachments.map((att, i) => (
                              <button key={i} onClick={() => setViewerSrc(getFullUrl(att.file))} className={`relative overflow-hidden cursor-pointer w-full ${isOnlyImages ? 'rounded-xl shadow-sm' : 'rounded-md'}`}>
                                <img src={getFullUrl(att.file)} className={`w-full object-cover ${isOnlyImages && msg.attachments.length === 1 ? 'max-h-64 h-auto' : 'aspect-square'} ${isOnlyImages ? '' : 'border border-black/5'}`} alt="attachment" />
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
                      {isAdminMsg && !msg.is_deleted && (
                        <span className={`tracking-tighter ml-0.5 ${msg.delivery_status === 'SEEN' || msg.delivery_status === 'DELIVERED' ? 'text-[#53bdeb]' : 'text-slate-400'}`} title={msg.delivery_status}>
                          {msg.delivery_status === 'SENDING' ? <Loader2 className="w-3 h-3 animate-spin inline" /> : msg.delivery_status === 'SENT' ? '✓' : '✓✓'}
                        </span>
                      )}
                    </div>
                    <div className="clear-both"></div>
                  </div>
                </div>
              </div>
            );
            })}

            {/* User Typing Indicator */}
            {ticket.is_user_typing && (
              <div className="flex flex-col items-start mb-2">
                <div className="flex items-end max-w-[85%] justify-start">
                  <div className="flex-shrink-0 mr-2 mb-1">
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shadow-sm border border-slate-200">
                      <User className="w-4 h-4" />
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

          {/* Reply Form Footer (WhatsApp Style) */}
          <div className="p-2 sm:p-3 bg-[#f0f2f5] shrink-0 flex items-end gap-1.5 sm:gap-2 relative z-10">
            <div className="relative flex flex-col shrink-0 gap-2 items-center mb-1 sm:mb-1">
               <button
                  type="button"
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full border border-slate-200 shadow-sm text-[11px] sm:text-[13px] font-semibold transition-all hover:shadow-md cursor-pointer ${currentStatusObj.bg} ${currentStatusObj.color}`}
                >
                  <span className="text-[10px] sm:text-[11px]">{currentStatusObj.icon}</span>
                  <span className="hidden sm:inline">{currentStatusObj.label}</span>
                  <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-0.5 opacity-70" />
                </button>

                {isStatusOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsStatusOpen(false)} />
                    <div className="absolute bottom-full left-0 mb-2 w-[140px] bg-white rounded-xl shadow-xl border border-slate-100 p-1.5 z-20 overflow-hidden">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            handleStatusChange({ target: { value: opt.value } });
                            setIsStatusOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] font-medium rounded-lg transition-colors cursor-pointer ${newStatus === opt.value ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          <span className="text-[10px]">{opt.icon}</span>
                          <span>{opt.label}</span>
                          {newStatus === opt.value && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-[#00a884]" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
            </div>

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
                            onClick={() => {
                              setReplyText(prev => prev + emoji);
                            }}
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
                      handleSubmit(e);
                    }
                  }}
                />

                {(replyText.trim() || replyImages.length > 0 || submitting) && (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#00a884] text-white flex items-center justify-center shrink-0 hover:bg-[#008f6f] transition-all disabled:opacity-50 mb-1 ml-1 cursor-pointer animate-in zoom-in duration-200"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>
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
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */

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

export default function TicketsPage() {
  const toast = useToastContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlTicketId = searchParams?.get('ticket_id');

  const [activeStatus, setActiveStatus] = useState("all");
  const [tickets, setTickets] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 15;

  // Auto-open ticket from URL
  useEffect(() => {
    if (urlTicketId) {
      const fetchSpecificTicket = async () => {
        try {
          const res = await api.get(`/api/auth/admin/tickets/${urlTicketId}/`);
          setSelectedTicket(res);
        } catch {
          // ignore error if ticket not found
        }
      };
      
      const existing = tickets.find(t => t.id === Number(urlTicketId));
      if (existing) {
        setSelectedTicket(existing);
      } else {
        fetchSpecificTicket();
      }
    }
  }, [urlTicketId, tickets]);

  const handleCloseModal = () => {
    setSelectedTicket(null);
    if (urlTicketId) {
      router.replace('/dashboard/tickets', { scroll: false });
    }
  };

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (activeStatus !== "all") params.status = activeStatus;
      if (search.trim()) params.search = search.trim();
      const res = await api.get("/api/auth/admin/tickets/", params);
      if (Array.isArray(res)) {
        setTickets(res);
        setTotalCount(res.length);
      } else {
        setTickets(res.results ?? []);
        setTotalCount(res.count ?? 0);
      }
    } catch (err) {
      toast.error(err?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [activeStatus, search, page]);

  // Fetch per-status counts for tabs
  const fetchCounts = useCallback(async () => {
    try {
      const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
      const results = await Promise.allSettled(
        statuses.map((s) => api.get("/api/auth/admin/tickets/", { status: s, page_size: 1 }))
      );
      const newCounts = {};
      results.forEach((r, i) => {
        if (r.status === "fulfilled") {
          const res = r.value;
          newCounts[statuses[i]] = Array.isArray(res) ? res.length : (res.count ?? 0);
        }
      });
      setCounts(newCounts);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchTickets(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <Container title="Support Tickets" description="Review and respond to vendor support tickets">
      {/* Modals */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={handleCloseModal}
          onReplySuccess={() => { fetchTickets(); fetchCounts(); }}
        />
      )}

      {/* Status Tabs + Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-px">
          {STATUS_TABS.map((tab) => {
            const allCount = Object.values(counts).reduce((s, c) => s + c, 0);
            const count = tab.id !== "all" ? counts[tab.id] : allCount;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveStatus(tab.id); setPage(1); }}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeStatus === tab.id
                    ? "border-gray-900 text-slate-800"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    tab.id === "OPEN" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 pl-3">
          <input
            type="search"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-400 w-44"
          />
          <button
            onClick={() => { fetchTickets(); fetchCounts(); }}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <MessageSquare className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">No tickets found</p>
          <p className="text-xs mt-1">
            {activeStatus !== "all" ? `No ${activeStatus.toLowerCase().replace("_", " ")} tickets` : "All clear!"}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((ticket) => {
                  const StatusIcon = STATUS_ICON[ticket.status] || AlertCircle;
                  return (
                    <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{ticket.id}</td>
                      <td className="px-4 py-3">
                        <div onClick={() => setSelectedTicket(ticket)} className="cursor-pointer group">
                          <p className="font-medium text-slate-800 max-w-[220px] truncate group-hover:text-[#00a884] transition-colors">{ticket.subject}</p>
                          <p className="text-xs text-slate-400 mt-0.5 max-w-[220px] truncate">{ticket.description}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-800 font-medium text-xs">{ticket.userName || "—"}</p>
                        <p className="text-xs text-slate-400">{ticket.userEmail || ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600">{CATEGORY_LABEL[ticket.category] || ticket.category}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${PRIORITY_BADGE[ticket.priority] || ""}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${STATUS_BADGE[ticket.status] || ""}`}>
                          <StatusIcon className="w-3 h-3" />
                          {ticket.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedTicket(ticket)}
                            className="db-icon-btn cursor-pointer"
                            title="View Chat"
                          >
                            <Eye className="w-4 h-4 text-slate-500 hover:text-slate-800 transition-colors" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-slate-500">
                {totalCount} ticket{totalCount !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-300 disabled:opacity-40 hover:bg-slate-100 transition-colors"
                >
                  Prev
                </button>
                <span className="px-3 py-1.5 text-sm text-slate-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-300 disabled:opacity-40 hover:bg-slate-100 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Container>
  );
}

