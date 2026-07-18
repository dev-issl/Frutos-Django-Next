'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, MessageSquare, X, SendHorizontal, Search, Users, Phone, Video, Store, Loader2, Info, ChevronDown, Check, ArrowLeft } from 'lucide-react';
import { toast } from '@/app/dashboard/_components/Toaster';
import { API_BASE_URL } from '@/app/dashboard/_lib/api';

const API_BASE = `${API_BASE_URL}/api`;
const WS_BASE = API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');



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
  const modalRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const pendingMessagesRef = useRef([]);
  const connectWSRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    function handleClickOutside(event) {
      if (isOpen && modalRef.current && !modalRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Preload real notification sound once (WAV file in /public/)
  const notifAudioRef = useRef(null);
  useEffect(() => {
    notifAudioRef.current = new Audio('/notification.wav');
    notifAudioRef.current.preload = 'auto';
    notifAudioRef.current.volume = 0.8;
    return () => { notifAudioRef.current = null; };
  }, []);

  const playSound = useCallback(() => {
    try {
      if (notifAudioRef.current) {
        notifAudioRef.current.currentTime = 0;
        notifAudioRef.current.play().catch(() => {
          // Fallback: AudioContext synth (if Audio element blocked)
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const resume = ctx.state === 'suspended' ? ctx.resume() : Promise.resolve();
            resume.then(() => {
              const t = ctx.currentTime;
              const addTone = (freq, start, amp, decay) => {
                const osc = ctx.createOscillator(); const g = ctx.createGain();
                osc.type = 'sine'; osc.frequency.setValueAtTime(freq, start);
                g.gain.setValueAtTime(0.001, start);
                g.gain.linearRampToValueAtTime(amp, start + 0.004);
                g.gain.exponentialRampToValueAtTime(0.001, start + decay);
                osc.connect(g); g.connect(ctx.destination);
                osc.start(start); osc.stop(start + decay + 0.05);
              };
              addTone(880,    t,        0.6, 0.22);
              addTone(1108.7, t + 0.13, 0.5, 0.28);
            });
          } catch { /* silent */ }
        });
      }
    } catch { /* silent */ }
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
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    // Only ADMIN or STAFF can use this
    if (!user || (user.user_type !== 'ADMIN' && user.user_type !== 'STAFF' && !user.is_staff)) {
      return;
    }

    fetchContacts();

    const connectWebSocket = () => {
      if (!isMountedRef.current) return;
      const access = getAccess();
      if (!access) return;

      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      const wsUrl = `${WS_BASE}/ws/livechat/?token=${access}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        // Flush any pending messages
        while (pendingMessagesRef.current.length > 0) {
          const payload = pendingMessagesRef.current.shift();
          if (wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(payload));
          }
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

          setIsOpen(prevIsOpen => {
            setActiveChat(prevActive => {
              // Only suppress sound when widget IS open AND this exact chat is active
              const chatIsVisible = prevIsOpen && prevActive && String(prevActive.id) === String(msg.sender_id);
              if (chatIsVisible) {
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
              } else {
                playSound();
                fetchContacts();
              }
              return prevActive;
            });
            return prevIsOpen;
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
        if (!isMountedRef.current) return;
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            connectWebSocket();
          }, 3000);
        }
      };

      wsRef.current.onerror = () => {
        // Handled by onclose — do NOT use console.error (triggers Next.js overlay)
      };
    };

    // Store connect function in ref so handleSendMessage can call it
    connectWSRef.current = connectWebSocket;
    connectWebSocket();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
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
    const receiverId = activeChat.id;

    // Optimistic update — show immediately in UI
    const tempMsg = {
      id: Date.now(),
      sender_id: user.id,
      receiver_id: receiverId,
      text: text,
      created_at: new Date().toISOString(),
      is_read: false
    };
    setMessages(prev => [...prev, tempMsg]);
    setInputValue('');

    const payload = { action: 'send_message', receiver_id: receiverId, text: text };
    const typingPayload = { action: 'typing', receiver_id: receiverId, is_typing: false };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Connected — send immediately
      wsRef.current.send(JSON.stringify(payload));
      wsRef.current.send(JSON.stringify(typingPayload));
    } else {
      // Not connected — queue message and reconnect immediately
      pendingMessagesRef.current.push(payload);
      // Trigger immediate reconnect (bypass the 3s delay)
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (connectWSRef.current) connectWSRef.current();
    }
  };

  const handleTyping = (e) => {
    setInputValue(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      if (activeChat && wsRef.current?.readyState === WebSocket.OPEN) {
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
      if (activeChat && wsRef.current?.readyState === WebSocket.OPEN) {
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
      <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] transition-all duration-300 ${isOpen ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100 scale-100'}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex items-center justify-center w-[50px] h-[50px] sm:w-[54px] sm:h-[54px] bg-emerald-600 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
        >
          <MessageCircle size={30} />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs font-bold w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full border-2 border-white animate-bounce">
              {totalUnread}
            </span>
          )}
        </button>
      </div>

      {/* Chat Modal */}
      <div
        ref={modalRef}
        className={`fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 w-full sm:w-[360px] h-full sm:h-[calc(100vh-48px)] sm:max-h-[calc(100vh-48px)] bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col z-[9998] sm:border border-gray-200 transition-all duration-300 ease-in-out transform ${isOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-full sm:translate-x-[150%] opacity-0 pointer-events-none'
          }`}
      >
        {/* --- CONTACTS LIST VIEW --- */}
        <div className="flex flex-col h-full bg-white text-gray-900">
          <div className="pt-4 pb-2 px-4 flex justify-between items-center">
            <h3 className="font-bold text-2xl">Chats</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <X size={24} />
            </button>
          </div>

          <div className="px-4 pb-2">
            <div className="relative flex items-center">
              <Search className="absolute left-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search Messenger"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-100 border-none rounded-full text-[15px] text-gray-900 focus:outline-none placeholder-gray-500"
              />
            </div>
            
            {/* Store Filter mimicking Messenger tabs */}
            {uniqueStores.length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                <button
                  onClick={() => setStoreFilter("")}
                  className={`px-3 py-1.5 rounded-full text-[14px] font-semibold whitespace-nowrap transition-colors ${!storeFilter ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                >
                  All
                </button>
                {uniqueStores.map(store => (
                  <button
                    key={store}
                    onClick={() => setStoreFilter(store)}
                    className={`px-3 py-1.5 rounded-full text-[14px] font-semibold whitespace-nowrap transition-colors ${storeFilter === store ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                  >
                    {store}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent pb-2">
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
                  className="flex items-center gap-3 py-2 px-3 mx-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors group relative"
                >
                  <div className="relative">
                    {contact.photo ? (
                      <img src={contact.photo.startsWith('http') ? contact.photo : `${API_BASE_URL}${contact.photo.startsWith('/') ? '' : '/'}${contact.photo}`} alt={contact.name} className="w-[50px] h-[50px] rounded-full object-cover" />
                    ) : (
                      <div className="w-[50px] h-[50px] bg-gradient-to-br from-emerald-400 to-green-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {contact.is_active && (contact.store_name || contact.user_type === 'ADMIN') && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#31a24c] rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex justify-between items-center">
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="font-semibold text-gray-900 text-[15px] truncate">{contact.name}</h4>
                      <div className="flex items-center gap-1 mt-0.5 truncate">
                        {contact.store_name && (
                          <span className="text-[13px] text-gray-500 whitespace-nowrap">
                            {contact.store_name} •
                          </span>
                        )}
                        <p className={`text-[13px] truncate ${contact.unread_count > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                          {contact.last_message || 'No messages yet'}
                        </p>
                        {contact.last_message_time && (
                          <span className="text-[12px] text-gray-400 whitespace-nowrap flex-shrink-0">
                             • {new Date(contact.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {contact.unread_count > 0 && (
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- ACTIVE CHAT VIEW (Slides up from bottom) --- */}
        <div 
          className={`absolute inset-0 bg-white flex flex-col z-20 transition-transform duration-300 ease-in-out ${activeChat ? 'translate-y-0' : 'translate-y-full'}`}
        >
          {activeChat && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-2 py-3 bg-white border-b border-gray-100 shadow-sm relative z-10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setActiveChat(null); fetchContacts(); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer text-emerald-600"
                  >
                    <ArrowLeft size={24} />
                  </button>
                  <div className="relative">
                    {activeChat.photo ? (
                      <img src={activeChat.photo.startsWith('http') ? activeChat.photo : `${API_BASE_URL}${activeChat.photo.startsWith('/') ? '' : '/'}${activeChat.photo}`} alt={activeChat.name} className="w-9 h-9 rounded-full object-cover shadow-sm" />
                    ) : (
                      <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-green-500 text-white rounded-full flex items-center justify-center font-bold shadow-sm">
                        {activeChat.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {activeChat.is_active && (activeChat.store_name || activeChat.user_type === 'ADMIN') && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#31a24c] rounded-full border-[1.5px] border-white"></div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="font-bold text-[15px] text-gray-900 leading-tight">{activeChat.name}</h3>
                    {activeChat.store_name && (
                      <p className="text-[12px] text-emerald-600 font-medium leading-tight mt-0.5">
                        {activeChat.store_name}
                      </p>
                    )}
                  </div>
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
                            <img src={activeChat.photo.startsWith('http') ? activeChat.photo : `${API_BASE_URL}${activeChat.photo.startsWith('/') ? '' : '/'}${activeChat.photo}`} alt={activeChat.name} className="w-7 h-7 rounded-full object-cover shadow-sm" />
                          ) : (
                            <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-green-500 text-white rounded-full flex items-center justify-center font-bold text-[11px] shadow-sm">
                              {activeChat.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      )}
                      <div className={`max-w-[75%] px-3 py-1.5 rounded-2xl shadow-sm text-[15px] ${isMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'}`}>
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
                    placeholder="Aa"
                    value={inputValue}
                    onChange={handleTyping}
                    className="flex-1 bg-gray-100 border-none rounded-full pl-4 pr-11 py-2 text-[15px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  {inputValue.trim().length > 0 && (
                    <button
                      type="submit"
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      <SendHorizontal size={16} />
                    </button>
                  )}
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
