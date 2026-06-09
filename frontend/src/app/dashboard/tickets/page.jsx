"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  MessageSquare, Eye, Reply, CheckCircle2, Clock, AlertCircle,
  XCircle, Loader2, ChevronDown, ZoomIn, X, Send, RefreshCw, Paperclip, Upload, User, MoreVertical, Mail, Tag, AlertTriangle
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

/* ─── Utility: extract image URLs from text ─────────────────── */
function extractImageUrls(text = "") {
  const urlRegex = /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|gif|webp|svg)(\?[^\s"'<>]*)?/gi;
  return [...new Set(text.match(urlRegex) || [])];
}

/* ─── Image Viewer Modal ─────────────────────────────────────── */
function ImageViewer({ src, onClose }) {
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10">
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

  const messagesEndRef = useRef(null);
  const fileRef = useRef(null);

  // Scroll to bottom when messages change
  const messagesCount = ticket.messages?.length || 0;
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesCount]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/api/auth/admin/tickets/${ticket.id}/`);
        setTicket(res);
        setNewStatus(res.status);
      } catch (e) {}
    }, 5000);
    return () => clearInterval(interval);
  }, [ticket.id]);

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
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (replyText.trim()) formData.append('message', replyText);
      replyImages.forEach(img => {
        formData.append('images', img)
      });
      if (newStatus !== ticket.status) formData.append('status', newStatus);

      await api.post(`/api/auth/admin/tickets/${ticket.id}/reply/`, formData);
      toast.success("Reply sent successfully");
      
      // Refresh local ticket state instantly
      const updatedTicket = await api.get(`/api/auth/admin/tickets/${ticket.id}/`);
      setTicket(updatedTicket);
      
      setReplyText("");
      setReplyImages([]);
      setReplyImagePreviews([]);
      onReplySuccess?.();
    } catch (err) {
      toast.error(err?.message || "Failed to send reply");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await api.delete(`/api/auth/admin/tickets/${ticket.id}/messages/${msgId}/`);
      toast.success("Message deleted");
      const updatedTicket = await api.get(`/api/auth/admin/tickets/${ticket.id}/`);
      setTicket(updatedTicket);
      setDeleteModalId(null);
    } catch (err) {
      toast.error(err?.message || "Failed to delete message");
    }
  };

  const handleEditSubmit = async (msgId) => {
    if (!editingMessageText.trim()) return;
    try {
      await api.patch(`/api/auth/admin/tickets/${ticket.id}/messages/${msgId}/`, {
        message: editingMessageText
      });
      toast.success("Message updated");
      setEditingMessageId(null);
      setEditingMessageText('');
      const updatedTicket = await api.get(`/api/auth/admin/tickets/${ticket.id}/`);
      setTicket(updatedTicket);
    } catch (err) {
      toast.error(err?.message || "Failed to update message");
    }
  };

  const StatusIcon = STATUS_ICON[ticket.status] || AlertCircle;

  return (
    <>
      {viewerSrc && <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />}
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-4 border-b border-slate-200 bg-slate-50/50 shrink-0">
            <div>
              <div className="db-filter-bar mb-1">
                <span className="text-xs font-medium text-slate-400">Ticket #{ticket.id}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${STATUS_BADGE[ticket.status] || ""}`}>
                  <StatusIcon className="w-3 h-3" />
                  {ticket.status.replace("_", " ")}
                </span>
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${PRIORITY_BADGE[ticket.priority] || ""}`}>
                  {ticket.priority}
                </span>
              </div>
              <h2 className="text-base font-semibold text-slate-800">{ticket.subject}</h2>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {ticket.userName || "—"}</span>
                <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {CATEGORY_LABEL[ticket.category] || ticket.category}</span>
              </div>
            </div>
            <button onClick={onClose} className="db-icon-btn shrink-0 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#f8fafc] scroll-smooth">
            {/* Initial Description (User) */}
            <div className="flex flex-col items-start">
              <div className="flex items-end gap-2 mb-1.5 ml-1">
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0 shadow-sm border border-white">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
                <span className="text-xs text-slate-500 font-medium">{ticket.userName || 'User'}</span>
              </div>
              <div className="max-w-[75%] bg-white border border-slate-200/60 rounded-2xl rounded-tl-none px-3 py-2 shadow-sm ml-9 relative group">
                <p className="text-[14px] whitespace-pre-wrap leading-relaxed text-slate-700">{ticket.description}</p>
                {ticket.images && ticket.images.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ticket.images.map((imgObj, i) => (
                      <button key={i} onClick={() => setViewerSrc(imgObj.image)} className="relative group overflow-hidden border border-slate-200 rounded-lg shrink-0 cursor-pointer">
                        <img src={imgObj.image} alt={`attachment ${i + 1}`} className="h-24 w-auto object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ZoomIn className="w-5 h-5 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <div className="text-[10px] text-slate-400 mt-2 font-medium">
                  {new Date(ticket.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Legacy Admin Response (if exists) */}
            {ticket.admin_response && (
              <div className="flex flex-col items-end">
                <div className="flex items-end gap-2 mb-1.5 mr-1">
                  <span className="text-xs text-slate-500 font-medium">Support Team</span>
                  <div className="w-7 h-7 rounded-full bg-[#0f172a] flex items-center justify-center shrink-0 shadow-sm border border-white">
                    <span className="material-symbols-outlined text-[14px] text-white">support_agent</span>
                  </div>
                </div>
                <div className="max-w-[75%] bg-[#0f172a] text-white rounded-2xl rounded-tr-none px-3 py-2 shadow-sm mr-9 relative group">
                  <p className="text-[14px] whitespace-pre-wrap leading-relaxed text-slate-100">{ticket.admin_response}</p>
                  <div className="text-[10px] text-slate-400 mt-2 text-right font-medium">
                    Legacy Response
                  </div>
                </div>
              </div>
            )}

            {/* New Chat Thread */}
            {ticket.messages && ticket.messages.map((msg) => {
              const isAdmin = msg.isAdmin;
              return (
                <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                  {isAdmin ? (
                    <div className="flex items-end gap-2 mb-1.5 mr-1">
                      <span className="text-xs text-slate-500 font-medium">{msg.senderName || 'Support Team'}</span>
                      <div className="w-7 h-7 rounded-full bg-[#0f172a] flex items-center justify-center shrink-0 shadow-sm border border-white">
                        <span className="material-symbols-outlined text-[14px] text-white">support_agent</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-end gap-2 mb-1.5 ml-1">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0 shadow-sm border border-white">
                        <User className="w-4 h-4 text-slate-600" />
                      </div>
                      <span className="text-xs text-slate-500 font-medium">{msg.senderName || ticket.userName || 'User'}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 group/msg relative">
                    {/* 3-Dot Menu Actions (Only for admin) */}
                    {isAdmin && !msg.is_deleted && ticket.status !== 'CLOSED' && (
                      <div className="relative flex items-center">
                        {openMenuId === msg.id && (
                          <div className="absolute right-full top-0 mr-2 bg-white shadow-lg border border-slate-100 rounded-xl py-1 z-20 min-w-[120px] overflow-hidden flex flex-col">
                            <button 
                              onClick={() => { setEditingMessageId(msg.id); setEditingMessageText(msg.message); setOpenMenuId(null); }} 
                              className="px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-50 transition-colors w-full cursor-pointer"
                            >
                              Edit
                            </button>
                            <div className="h-px w-full bg-slate-100"></div>
                            <button 
                              onClick={() => { setDeleteModalId(msg.id); setOpenMenuId(null); }} 
                              className="px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 transition-colors w-full cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                        
                        <button 
                          onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
                          className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover/msg:opacity-100 focus:opacity-100 ml-1 cursor-pointer" 
                          title="More options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className={`max-w-[75%] flex flex-col gap-1 ${isAdmin ? 'items-end' : 'items-start'}`}>
                      {(msg.message || msg.is_deleted || editingMessageId === msg.id) && (
                        <div className={`px-3 py-2 shadow-sm relative ${
                          isAdmin 
                            ? 'bg-[#0f172a] text-white rounded-2xl rounded-tr-none mr-9' 
                            : 'bg-white border border-slate-200/60 text-slate-700 rounded-2xl rounded-tl-none ml-9'
                        }`}>
                          {msg.is_deleted ? (
                            <p className="text-[14px] italic opacity-70">
                              {isAdmin ? "You deleted this message" : "This message was deleted"}
                            </p>
                          ) : editingMessageId === msg.id ? (
                            <div className="flex flex-col gap-2 min-w-[200px]">
                              <textarea 
                                value={editingMessageText}
                                onChange={(e) => setEditingMessageText(e.target.value)}
                                className="w-full bg-white/10 border border-white/30 rounded p-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
                                rows="3"
                              />
                              <div className="flex justify-end gap-2 mt-1">
                                <button onClick={() => setEditingMessageId(null)} className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors">Cancel</button>
                                <button onClick={() => handleEditSubmit(msg.id)} className="text-xs bg-white text-[#0f172a] font-medium hover:bg-slate-200 px-2 py-1 rounded transition-colors">Save</button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[14px] whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                          )}
                        </div>
                      )}

                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className={`flex flex-wrap gap-2 ${!isAdmin && 'ml-9'} ${isAdmin ? 'justify-end mr-9' : 'justify-start'}`}>
                          {msg.attachments.map((att, i) => (
                            <button key={i} onClick={() => setViewerSrc(att.file)} className={`relative group/img overflow-hidden rounded-lg shrink-0 cursor-pointer border border-slate-200 hover:opacity-90 transition-opacity`}>
                              <img src={att.file} className="h-40 w-auto object-cover shadow-sm" alt="attachment" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                <ZoomIn className="w-5 h-5 text-white" />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className={`flex items-center gap-1 mt-1 font-medium text-[10px] ${isAdmin ? 'justify-end text-slate-400 mr-9' : 'justify-start text-slate-400 ml-9'}`}>
                        {msg.is_edited && !msg.is_deleted && <span>(edited)</span>}
                        <span>{formatMessageTime(msg.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} className="h-2" />
          </div>

          {/* Reply Form Footer */}
          <div className="p-4 bg-white border-t border-slate-100 shrink-0">
            {replyImagePreviews.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-3">
                {replyImagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative inline-block">
                    <img src={preview} alt={`Preview ${idx + 1}`} className="h-20 w-auto object-cover rounded-lg border border-slate-200 shadow-sm" />
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
            
            <form onSubmit={handleSubmit} className="flex items-end gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200/60 focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-100 transition-all">
              <div className="flex flex-col gap-2 shrink-0">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold border-none bg-white shadow-sm text-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200 w-[120px] cursor-pointer"
                >
                  <option value="OPEN">⚪ Open</option>
                  <option value="IN_PROGRESS">🔵 In Progress</option>
                  <option value="RESOLVED">🟢 Resolved</option>
                  <option value="CLOSED">⚫ Closed</option>
                </select>
                
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center justify-center h-9 bg-white shadow-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  title="Attach image"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <input 
                  type="file" 
                  ref={fileRef} 
                  onChange={handleImageChange} 
                  accept="image/*,.pdf,.doc,.docx" 
                  className="hidden" 
                  multiple 
                />
              </div>

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                className="flex-1 min-h-[70px] max-h-[150px] p-3 text-[14px] bg-transparent border-none text-slate-800 focus:outline-none focus:ring-0 resize-y"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              
              <button
                type="submit"
                disabled={submitting || (!replyText.trim() && replyImages.length === 0)}
                className="flex items-center justify-center w-12 h-12 bg-[#0f172a] text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:bg-slate-300 transition-all shrink-0 shadow-md hover:shadow-lg mb-1 mr-1 cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
              </button>
            </form>
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
  const [activeStatus, setActiveStatus] = useState("all");
  const [tickets, setTickets] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 15;

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
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
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
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap flex items-center gap-1.5 ${
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
                        <p className="font-medium text-slate-800 max-w-[220px] truncate">{ticket.subject}</p>
                        <p className="text-xs text-slate-400 mt-0.5 max-w-[220px] truncate">{ticket.description}</p>
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
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-white bg-gray-800 hover:bg-gray-700 transition-colors"
                          >
                            <Reply className="w-3 h-3" />
                            {ticket.admin_response ? "Update" : "Reply"}
                          </button>
                          <button
                            onClick={() => setSelectedTicket(ticket)}
                            className="db-icon-btn"
                          >
                            <Eye className="w-3.5 h-3.5" />
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

