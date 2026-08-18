"use client";

import { useState, useEffect } from "react";
import api from "@/app/dashboard/_lib/api";
import { Megaphone, Loader2, ChevronDown, Paperclip, FileText, FileSpreadsheet, FileArchive, Download } from "lucide-react";

function FileTypeIcon({ name }) {
  const ext = name?.split('.').pop()?.toLowerCase();
  if (['xls','xlsx','csv'].includes(ext)) return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
  if (['zip','rar','7z'].includes(ext)) return <FileArchive className="w-5 h-5 text-amber-600" />;
  return <FileText className="w-5 h-5 text-blue-600" />;
}

export default function StaffAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/staff/announcements/");
      const data = Array.isArray(res) ? res : res.results || [];
      setAnnouncements(data);
      if (data.length > 0) {
        setExpandedId(data[0].id); // Expand the first one by default
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();

    const handleNewAnnouncement = () => {
      fetchAnnouncements();
    };
    window.addEventListener("new_announcement", handleNewAnnouncement);
    return () => window.removeEventListener("new_announcement", handleNewAnnouncement);
  }, []);

  const toggleAccordion = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="mb-12 max-w-4xl">
      <div className="flex justify-between items-end mb-6">
        <h1 className="text-3xl font-serif text-[#004A3A] font-medium tracking-tight">Announcements</h1>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100">
            <Loader2 className="w-6 h-6 animate-spin text-[#00694C] mb-3" />
            <p className="text-sm font-medium text-slate-500">Loading your updates...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="w-16 h-16 rounded-full bg-[#F1F6EB] flex items-center justify-center mb-4">
              <Megaphone className="w-8 h-8 opacity-40 text-[#00694C]" />
            </div>
            <p className="text-base font-semibold text-[#004A3A]">No announcements yet</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">You're all caught up! Updates will appear here.</p>
          </div>
        ) : (
          announcements.map((ann) => {
            const isExpanded = expandedId === ann.id;
            
            return (
              <div 
                key={ann.id} 
                className={`bg-white rounded-2xl transition-all duration-300 border overflow-hidden ${
                  isExpanded ? 'shadow-md border-[#00694C]/20 ring-1 ring-[#00694C]/5' : 'shadow-sm border-slate-100 hover:border-[#00694C]/30 hover:shadow'
                }`}
              >
                <div 
                  className={`flex items-center justify-between p-4 sm:px-6 cursor-pointer transition-colors duration-300 select-none ${
                    isExpanded ? 'bg-gradient-to-r from-[#F1F6EB]/50 to-white' : 'bg-white hover:bg-slate-50'
                  }`}
                  onClick={() => toggleAccordion(ann.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm ${
                      isExpanded 
                        ? 'bg-gradient-to-br from-[#00694C] to-[#004A3A] text-white scale-110' 
                        : 'bg-[#E4EFDA] text-[#00694C]'
                    }`}>
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className={`font-semibold text-[15px] tracking-tight leading-tight transition-colors duration-300 ${
                        isExpanded ? 'text-[#00694C]' : 'text-[#004A3A]'
                      }`}>
                        {ann.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">
                          {ann.created_by_name || 'Management'}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-[11px] font-medium text-slate-400">
                          {new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isExpanded ? 'bg-[#00694C]/10 text-[#00694C]' : 'text-slate-300 group-hover:text-[#00694C] group-hover:bg-slate-100'
                  }`}>
                    <ChevronDown className={`w-5 h-5 transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                
                {/* Animated Accordion Body using CSS Grid */}
                <div 
                  className={`grid transition-all duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] ${
                    isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="p-4 pt-0 sm:px-6 sm:pb-6">
                      <div className="relative mt-2">
                         {/* Subtle left border accent */}
                         <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#00694C]/40 to-transparent rounded-full"></div>
                         <p className="text-[13px] text-slate-600 whitespace-pre-wrap leading-relaxed pl-5 font-medium">
                           {ann.message}
                         </p>
                      </div>

                      {/* Display Photos/Images */}
                      {ann.images && ann.images.length > 0 && (
                        <div className="mt-4 pl-5">
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Photos</h4>
                          <div className="flex flex-wrap gap-3">
                            {ann.images.map((img) => (
                              <a 
                                key={img.id} 
                                href={img.image_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block w-24 h-24 rounded-lg overflow-hidden border border-slate-200 hover:border-[#00694C] shadow-sm hover:shadow-md transition-all group relative"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                  src={img.image_url} 
                                  alt="Announcement photo" 
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Display Files */}
                      {ann.files && ann.files.length > 0 && (
                        <div className="mt-4 pl-5">
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5" /> Attachments
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {ann.files.map((file) => (
                              <a 
                                key={file.id} 
                                href={file.file_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-[#F1F6EB] border border-slate-200 hover:border-[#00694C]/30 rounded-xl transition-all group"
                              >
                                <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                  <FileTypeIcon name={file.file_name} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-[#00694C] transition-colors">{file.file_name}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">Click to view/download</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-[#00694C] shadow-sm">
                                  <Download className="w-4 h-4" />
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
