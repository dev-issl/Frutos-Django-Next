'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, MessageSquare, X, Send, Search, Users, Phone, Video, Store, Loader2, Info, ChevronDown, Check } from 'lucide-react';

const API_BASE = (() => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  let url = envUrl;
  if (!envUrl && typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1" || h.startsWith("192.168.") || h.startsWith("10.")) {
      url = "http://127.0.0.1:8000/api";
    }
  }
  if (!url) url = "https://api.icommerce.passmcq.com/api";
  return url.replace(/\/+$/, "");
})();
const WS_BASE = API_BASE.replace('http://', 'ws://').replace('https://', 'wss://').replace('/api', '');

const WhatsappIcon = ({ size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

export default function LiveChatWidget() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (pathname.startsWith('/dashboard')) {
      const u = localStorage.getItem('admin_user');
      const t = localStorage.getItem('admin_access_token');
      if (u && t) {
        try {
          const parsed = JSON.parse(u);
          parsed.user_type = parsed.userType || parsed.user_type || 'ADMIN';
          setUser(parsed);
          setAccessToken(t);
        } catch { }
      } else {
        setUser(null);
        setAccessToken(null);
      }
    } else if (pathname.startsWith('/staff')) {
      const u = localStorage.getItem('icommerce_staff_user');
      const t = localStorage.getItem('staff_access_token');
      if (u && t) {
        try {
          const parsed = JSON.parse(u);
          parsed.user_type = parsed.userType || parsed.user_type || 'STAFF';
          setUser(parsed);
          setAccessToken(t);
        } catch { }
      } else {
        setUser(null);
        setAccessToken(null);
      }
    } else {
      setUser(null);
      setAccessToken(null);
    }
  }, [pathname]);

  const getAccess = useCallback(() => accessToken, [accessToken]);
  const [isOpen, setIsOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // Contact object
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [theirTypingStatus, setTheirTypingStatus] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize Audio safely
  const playSound = useCallback(() => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAD//w==');
      audio.play().catch(e => console.log('Audio play prevented', e));
    } catch (e) {
      console.log('Audio error', e);
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    const access = getAccess();
    if (!access) return;
    try {
      const res = await fetch(`${API_BASE}/livechat/contacts/`, {
        headers: { 'Authorization': `Bearer ${access}` }
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
        const unread = data.reduce((acc, curr) => acc + curr.unread_count, 0);
        setTotalUnread(unread);
      }
    } catch (err) {
      console.error('Failed to fetch contacts', err);
    }
  }, [getAccess]);

  const fetchHistory = useCallback(async (userId) => {
    const access = getAccess();
    if (!access) return;
    try {
      const res = await fetch(`${API_BASE}/livechat/history/${userId}/`, {
        headers: { 'Authorization': `Bearer ${access}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        // Refresh contacts to update unread counts
        fetchContacts();
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  }, [getAccess, fetchContacts]);

  useEffect(() => {
    // Only ADMIN or STAFF can use this
    if (!user || (user.user_type !== 'ADMIN' && user.user_type !== 'STAFF' && !user.is_staff)) {
      return;
    }

    fetchContacts();

    let reconnectTimer;

    const connectWebSocket = () => {
      const access = getAccess();
      if (!access) return;

      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      wsRef.current = new WebSocket(`${WS_BASE}/ws/livechat/?token=${access}`);

      wsRef.current.onopen = () => {
        console.log('LiveChat WebSocket Connected');
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.action === 'new_message') {
          const msg = data.message;

          if (user && String(msg.sender_id) === String(user.id)) {
            fetchContacts();
            return;
          }

          setActiveChat(prevActive => {
            if (prevActive && String(prevActive.id) === String(msg.sender_id)) {
              setMessages(prev => {
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
              });
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                  action: 'mark_read',
                  sender_id: msg.sender_id
                }));
              }
              return prevActive;
            } else {
              playSound();
              fetchContacts();
              return prevActive;
            }
          });

        } else if (data.action === 'typing') {
          setActiveChat(prevActive => {
            if (prevActive && String(prevActive.id) === String(data.sender_id)) {
              setTheirTypingStatus(data.is_typing);
            }
            return prevActive;
          });
        } else if (data.action === 'read_receipt') {
          setMessages(prev => prev.map(m => m.receiver_id === data.reader_id ? { ...m, is_read: true } : m));
        }
      };

      wsRef.current.onclose = () => {
        console.log('LiveChat WebSocket Disconnected. Reconnecting in 3 seconds...');
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connectWebSocket();
          }, 3000);
        }
      };

      wsRef.current.onerror = () => {
        // Suppress noisy error logs (especially during React Strict Mode unmounts)
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on unmount
        wsRef.current.close();
      }
    };
  }, [user, fetchContacts, getAccess, playSound]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, theirTypingStatus]);

  if (!user || (user.user_type !== 'ADMIN' && user.user_type !== 'STAFF' && !user.is_staff)) {
    return null;
  }

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeChat) return;

    const text = inputValue.trim();

    // Optimistic update
    const tempMsg = {
      id: Date.now(),
      sender_id: user.id,
      receiver_id: activeChat.id,
      text: text,
      created_at: new Date().toISOString(),
      is_read: false
    };
    setMessages(prev => [...prev, tempMsg]);
    setInputValue('');

    wsRef.current.send(JSON.stringify({
      action: 'send_message',
      receiver_id: activeChat.id,
      text: text
    }));

    // Stop typing
    wsRef.current.send(JSON.stringify({
      action: 'typing',
      receiver_id: activeChat.id,
      is_typing: false
    }));
  };

  const handleTyping = (e) => {
    setInputValue(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      if (activeChat) {
        wsRef.current.send(JSON.stringify({
          action: 'typing',
          receiver_id: activeChat.id,
          is_typing: true
        }));
      }
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (activeChat) {
        wsRef.current.send(JSON.stringify({
          action: 'typing',
          receiver_id: activeChat.id,
          is_typing: false
        }));
      }
    }, 2000);
  };

  const openChat = (contact) => {
    setActiveChat(contact);
    fetchHistory(contact.id);
  };

  const uniqueStores = [...new Set(contacts.map(c => c.store_name).filter(Boolean))];

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.store_name && c.store_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStore = storeFilter ? c.store_name === storeFilter : true;
    return matchesSearch && matchesStore;
  });

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex items-center justify-center w-[50px] h-[50px] sm:w-[54px] sm:h-[54px] bg-[#25D366] text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
        >
          {isOpen ? <X size={24} /> : <WhatsappIcon size={30} />}
          {!isOpen && totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs font-bold w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full border-2 border-white animate-bounce">
              {totalUnread}
            </span>
          )}
        </button>
      </div>

      {/* Chat Modal */}
      <div
        className={`fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 w-full sm:w-[360px] h-full sm:h-[560px] sm:max-h-[calc(100vh-120px)] bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col z-[9999] sm:border border-gray-100 transition-all duration-300 transform sm:origin-bottom-right ${isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 translate-y-10 pointer-events-none'
          }`}
      >
        {!activeChat ? (
          // --- CONTACTS LIST VIEW ---
          <>
            <div className="bg-gradient-to-r from-emerald-600 to-green-500 pt-6 sm:pt-3 pb-3 px-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    Chats
                  </h3>
                  <p className="text-emerald-100 text-sm mt-0.5 flex items-center gap-1 cursor-pointer">
                    {user.user_type === 'ADMIN' ? 'Manage Staff' : 'Live Support'}
                  </p>
                </div>
                <button onClick={() => setIsOpen(false)} className="sm:hidden text-white hover:bg-white/20 p-1.5 rounded-full transition-colors cursor-pointer">
                  <X size={20} />
                </button>
              </div>
            </div>

            {user.user_type === 'ADMIN' && (
              <div className="px-4 py-2 flex flex-col gap-2">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search by name or store..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-gray-100/80 border-none rounded-full text-sm focus:ring-2 focus:ring-emerald-500 outline-none placeholder-gray-500"
                  />
                </div>
                {uniqueStores.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                      className="w-full px-4 py-2 bg-gray-50/80 border border-gray-100 rounded-lg text-sm text-gray-700 flex items-center justify-between hover:bg-gray-100 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Store size={14} className="text-emerald-600 flex-shrink-0" />
                        <span className="truncate">{storeFilter || "All Stores"}</span>
                      </div>
                      <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${isStoreDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isStoreDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsStoreDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 py-1.5 z-50 max-h-48 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                          <div
                            onClick={() => {
                              setStoreFilter("");
                              setIsStoreDropdownOpen(false);
                            }}
                            className={`px-3 py-2 text-sm flex items-center justify-between cursor-pointer transition-colors ${!storeFilter ? 'bg-emerald-50/50 text-emerald-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            All Stores
                            {!storeFilter && <Check size={14} className="text-emerald-600" />}
                          </div>
                          {uniqueStores.map(store => (
                            <div
                              key={store}
                              onClick={() => {
                                setStoreFilter(store);
                                setIsStoreDropdownOpen(false);
                              }}
                              className={`px-3 py-2 text-sm flex items-center justify-between cursor-pointer transition-colors ${storeFilter === store ? 'bg-emerald-50/50 text-emerald-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              <span className="truncate pr-2">{store}</span>
                              {storeFilter === store && <Check size={14} className="text-emerald-600 flex-shrink-0" />}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                  <Users size={32} className="mb-2 opacity-50" />
                  <p>No contacts found.</p>
                </div>
              ) : (
                filteredContacts.map(contact => (
                  <div
                    key={contact.id}
                    onClick={() => openChat(contact)}
                    className="flex items-center gap-3 py-2 px-4 hover:bg-gray-50 cursor-pointer transition-colors group relative border-b border-gray-50 last:border-none"
                  >
                    <div className="relative">
                      {contact.photo ? (
                        <img src={contact.photo.startsWith('http') ? contact.photo : `${API_BASE.replace('/api', '')}${contact.photo}`} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-lg">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {contact.is_active && (contact.store_name || contact.user_type === 'ADMIN') && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex justify-between items-center">
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="font-bold text-gray-900 text-sm truncate">{contact.name}</h4>
                        <div className="flex items-center gap-1 mt-0.5 truncate">
                          {contact.store_name && (
                            <span className="text-[11px] text-emerald-600 font-medium whitespace-nowrap">
                              {contact.store_name} •
                            </span>
                          )}
                          <p className={`text-sm truncate ${contact.unread_count > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                            {contact.last_message || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {contact.last_message_time && (
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {new Date(contact.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {contact.unread_count > 0 && (
                          <span className="bg-emerald-600 text-white text-[11px] font-bold h-5 w-5 flex items-center justify-center rounded-full">
                            {contact.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          // --- ACTIVE CHAT VIEW ---
          <>
            <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 pt-6 sm:pt-2.5 pb-2.5 px-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => { setActiveChat(null); fetchContacts(); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer flex-shrink-0"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <div className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    {activeChat.photo ? (
                      <img src={activeChat.photo.startsWith('http') ? activeChat.photo : `${API_BASE.replace('/api', '')}${activeChat.photo}`} alt={activeChat.name} className="w-9 h-9 rounded-full object-cover shadow-sm group-hover:opacity-90 transition-opacity" />
                    ) : (
                      <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-green-500 text-white rounded-full flex items-center justify-center font-bold shadow-sm">
                        {activeChat.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {activeChat.is_active && (activeChat.store_name || activeChat.user_type === 'ADMIN') && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-[1.5px] border-white"></div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="font-bold text-[14px] text-gray-900 leading-tight">{activeChat.name}</h3>
                    {activeChat.store_name && (
                      <p className="text-[11px] text-emerald-600 font-medium leading-tight mt-0.5">
                        {activeChat.store_name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-emerald-600">
                <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-emerald-50 transition-colors cursor-pointer ml-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                  <Info size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ backgroundColor: '#efeae2', backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")', backgroundSize: '400px' }}>
              {messages.map((msg, idx) => {
                const isMe = String(msg.sender_id) === String(user?.id);
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start items-end gap-2'}`}>
                    {!isMe && (
                      <div className="flex-shrink-0">
                        {activeChat.photo ? (
                          <img src={activeChat.photo.startsWith('http') ? activeChat.photo : `${API_BASE.replace('/api', '')}${activeChat.photo}`} alt={activeChat.name} className="w-7 h-7 rounded-full object-cover shadow-sm" />
                        ) : (
                          <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-green-500 text-white rounded-full flex items-center justify-center font-bold text-[11px] shadow-sm">
                            {activeChat.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`max-w-[75%] px-3 py-1.5 rounded-2xl shadow-sm text-sm ${isMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'}`}>
                      <p style={{ wordBreak: 'break-word', lineHeight: '1.4' }}>{msg.text}</p>
                      <p className={`text-[9px] mt-0.5 text-right ${isMe ? 'text-emerald-200' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}

              {theirTypingStatus && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 text-gray-500 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1 w-16">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-white border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="relative flex items-center w-full">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputValue}
                  onChange={handleTyping}
                  className="flex-1 bg-gray-100 border-none rounded-full pl-4 pr-11 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {inputValue.trim().length > 0 && (
                  <button
                    type="submit"
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    <Send size={16} />
                  </button>
                )}
              </form>
            </div>
          </>
        )}
      </div>
    </>
  );
}
