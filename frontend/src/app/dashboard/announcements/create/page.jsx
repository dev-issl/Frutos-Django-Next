"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDashboardAuth } from "@/app/dashboard/_context/DashboardAuthContext";
import { announcementsService } from "@/app/dashboard/_lib/services";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import Container from "@/app/dashboard/_components/Container";
import Link from "next/link";
import Image from "next/image";
import { 
  Send, Store, Users, CheckCircle2, Loader2, ArrowLeft, 
  Megaphone, Search, ImagePlus, X, Paperclip, FileText, 
  FileArchive, FileSpreadsheet, Upload, Trash2
} from "lucide-react";

// ── File icon helper ──────────────────────────────────────────────
function FileTypeIcon({ name }) {
  const ext = name?.split('.').pop()?.toLowerCase();
  if (['xls','xlsx','csv'].includes(ext)) return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
  if (['zip','rar','7z'].includes(ext)) return <FileArchive className="w-5 h-5 text-amber-600" />;
  return <FileText className="w-5 h-5 text-blue-600" />;
}

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function CreateAnnouncementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useDashboardAuth();
  const { success, error } = useToastContext();
  
  const [title, setTitle] = useState(searchParams.get("title") || "");
  const [message, setMessage] = useState(searchParams.get("message") || "");
  const [targetAllStores, setTargetAllStores] = useState(false);
  const [targetsData, setTargetsData] = useState([]);
  const [selectedStores, setSelectedStores] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingTargets, setLoadingTargets] = useState(true);
  const [storeSearch, setStoreSearch] = useState("");
  const [staffSearches, setStaffSearches] = useState({});

  // Attachment states
  const [photos, setPhotos] = useState([]); // [{file, preview}]
  const [attachmentFiles, setAttachmentFiles] = useState([]); // [{id, file, name, size}]
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const photoInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const isAdmin = user?.userType === "ADMIN" || user?.isSuperuser;

  useEffect(() => {
    if (!isAdmin) { router.push("/dashboard/announcements"); return; }
    const fetchTargets = async () => {
      try {
        const res = await announcementsService.targets();
        setTargetsData(Array.isArray(res) ? res : res.results || []);
      } catch (err) {
        console.error(err);
        error("Failed to load staff list");
      } finally {
        setLoadingTargets(false);
      }
    };
    fetchTargets();
  }, [isAdmin, router, error]);

  // ── Photo handling ─────────────────────────────────────────────────
  const addPhotos = useCallback((files) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;
    const newPhotos = validFiles.map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
  }, []);

  const removePhoto = (id) => {
    setPhotos(prev => {
      const p = prev.find(p => p.id === id);
      if (p) URL.revokeObjectURL(p.preview);
      return prev.filter(p => p.id !== id);
    });
  };

  const handlePhotoDrop = (e) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
    addPhotos(e.dataTransfer.files);
  };

  // ── File handling ─────────────────────────────────────────────────
  const addFiles = useCallback((files) => {
    const newFiles = Array.from(files).map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      name: file.name,
      size: file.size,
    }));
    setAttachmentFiles(prev => [...prev, ...newFiles]);
  }, []);

  const removeFile = (id) => {
    setAttachmentFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    addFiles(e.dataTransfer.files);
  };

  // Handle forwarded announcement
  useEffect(() => {
    const forwardId = searchParams.get("forward_id");
    if (forwardId && isAdmin) {
      const loadForwarded = async () => {
        try {
          const res = await announcementsService.get(forwardId);
          setTitle(`Fwd: ${res.title}`);
          setMessage(res.message);
          
          if (res.images?.length > 0) {
            const photoFiles = await Promise.all(res.images.map(async img => {
              const fetchRes = await fetch(img.image_url);
              const blob = await fetchRes.blob();
              return new File([blob], img.file_name || 'photo.jpg', { type: blob.type });
            }));
            addPhotos(photoFiles);
          }
          
          if (res.files?.length > 0) {
            const fileAttachments = await Promise.all(res.files.map(async f => {
              const fetchRes = await fetch(f.file_url);
              const blob = await fetchRes.blob();
              return new File([blob], f.file_name || 'file', { type: blob.type });
            }));
            addFiles(fileAttachments);
          }
        } catch(err) {
          console.error("Failed to load forwarded announcement", err);
          error("Failed to load forwarded announcement details");
        }
      }
      loadForwarded();
    }
  }, [searchParams, isAdmin, error, addPhotos, addFiles]);

  // ── Staff / store selection ────────────────────────────────────────
  const handleStoreSelect = (storeId) => {
    if (selectedStores.includes(storeId)) {
      setSelectedStores(prev => prev.filter(id => id !== storeId));
      const storeStaffIds = targetsData.find(s => s.id === storeId)?.staff_list.map(st => st.id) || [];
      setSelectedStaff(prev => prev.filter(id => !storeStaffIds.includes(id)));
    } else {
      setSelectedStores(prev => [...prev, storeId]);
      const storeStaffIds = targetsData.find(s => s.id === storeId)?.staff_list.map(st => st.id) || [];
      setSelectedStaff(prev => Array.from(new Set([...prev, ...storeStaffIds])));
    }
  };

  const handleStaffSelect = (staffId, storeId) => {
    if (selectedStaff.includes(staffId)) {
      setSelectedStaff(prev => prev.filter(id => id !== staffId));
      setSelectedStores(prev => prev.filter(id => id !== storeId));
    } else {
      const newSelected = [...selectedStaff, staffId];
      setSelectedStaff(newSelected);
      const storeStaff = targetsData.find(s => s.id === storeId)?.staff_list || [];
      if (storeStaff.length > 0 && storeStaff.every(st => newSelected.includes(st.id))) {
        setSelectedStores(prev => [...prev, storeId]);
      }
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return error("Title and message are required.");
    if (!targetAllStores && selectedStores.length === 0 && selectedStaff.length === 0) {
      return error("Select at least one store or staff member to notify.");
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('message', message);
      formData.append('target_all_stores', targetAllStores);
      if (!targetAllStores) {
        selectedStores.forEach(id => formData.append('target_stores', id));
        selectedStaff.forEach(id => formData.append('target_staff', id));
      }
      photos.forEach(p => formData.append('images', p.file));
      attachmentFiles.forEach(f => formData.append('files', f.file));

      await announcementsService.create(formData);
      success("Announcement sent successfully!");
      router.push("/dashboard/announcements");
    } catch (err) {
      console.error(err);
      error("Failed to send announcement");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) return null;

  const filteredStores = targetsData.filter(store =>
    store.name.toLowerCase().includes(storeSearch.toLowerCase())
  );

  return (
    <Container
      title="Create Announcement"
      description="Send a targeted message to your staff members in real-time."
      actions={
        <Link
          href="/dashboard/announcements"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-md shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-w-5xl">

        {/* ── Message Content ─────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800">Message Content</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all bg-slate-50/50 focus:bg-white"
                placeholder="e.g. Important Update: New Store Hours"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm resize-none transition-all bg-slate-50/50 focus:bg-white"
                placeholder="Type your detailed announcement here..."
                required
              />
            </div>
          </div>
        </div>

        {/* ── Attachments ─────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800">Attachments</h2>
            <span className="ml-auto text-[10px] text-slate-400 font-medium">Optional</span>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Photo upload zone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <ImagePlus className="w-3.5 h-3.5 text-emerald-600" />
                Photos
                <span className="text-slate-400 font-normal ml-1">(multiple allowed)</span>
              </label>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingPhoto(true); }}
                onDragLeave={() => setIsDraggingPhoto(false)}
                onDrop={handlePhotoDrop}
                onClick={() => photoInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  isDraggingPhoto
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50/50'
                }`}
              >
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => addPhotos(e.target.files)}
                />
                <Upload className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-500">
                  {isDraggingPhoto ? 'Drop photos here' : 'Click or drag photos here'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP — any size</p>
              </div>

              {/* Preview grid */}
              {photos.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {photos.map(p => (
                    <div key={p.id} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                      <Image src={p.preview} alt={p.name} fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removePhoto(p.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 bg-white/90 rounded-full text-red-500 hover:bg-white transition-all shadow-sm"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-gradient-to-t from-black/60 to-transparent">
                        <p className="text-white text-[9px] font-medium truncate">{p.name}</p>
                      </div>
                    </div>
                  ))}
                  {/* Add more button */}
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-slate-200 hover:border-emerald-400 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all group"
                  >
                    <ImagePlus className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    <span className="text-[9px] text-slate-400 mt-1 font-medium">Add more</span>
                  </div>
                </div>
              )}
            </div>

            {/* File attachment */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                Files
                <span className="text-slate-400 font-normal ml-1">(multiple allowed)</span>
              </label>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  isDraggingFile
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={e => addFiles(e.target.files)}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.zip,.rar,.ppt,.pptx,.txt"
                />
                <Upload className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-500">
                  {isDraggingFile ? 'Drop files here' : 'Click or drag files here'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">PDF, Word, Excel, ZIP, etc.</p>
              </div>

              {/* List of files */}
              {attachmentFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachmentFiles.map(f => (
                    <div key={f.id} className="flex items-start gap-3 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                        <FileTypeIcon name={f.name} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{f.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{formatBytes(f.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Target Audience ─────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-800">Target Audience</h2>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
              {targetAllStores ? 'All Staff' : `${selectedStaff.length} Staff Selected`}
            </span>
          </div>

          <div className="p-4">
            <div
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer mb-5 transition-all ${targetAllStores ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-slate-50'}`}
              onClick={() => setTargetAllStores(!targetAllStores)}
            >
              <div className={`flex items-center justify-center w-5 h-5 rounded border ${targetAllStores ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 text-transparent'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-bold ${targetAllStores ? 'text-emerald-900' : 'text-slate-800'}`}>Broadcast to Everyone</p>
                <p className={`text-xs ${targetAllStores ? 'text-emerald-700/80' : 'text-slate-500'}`}>Send this message to every single staff member across all stores.</p>
              </div>
            </div>

            <div className={`transition-all duration-300 ${targetAllStores ? 'opacity-40 pointer-events-none grayscale-[50%]' : 'opacity-100'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Or Select Specific Staff</h3>
                <div className="relative w-full sm:w-auto">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search stores..."
                    value={storeSearch}
                    onChange={e => setStoreSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-full sm:w-48 transition-all"
                  />
                </div>
              </div>

              {loadingTargets ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <p className="text-xs">Loading stores and staff...</p>
                </div>
              ) : filteredStores.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center">
                  <Store className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">No stores matched your search.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStores.map(store => {
                    const isStoreSelected = selectedStores.includes(store.id);
                    const currentStaffSearch = staffSearches[store.id] || "";
                    const filteredStaff = store.staff_list.filter(s =>
                      s.name.toLowerCase().includes(currentStaffSearch.toLowerCase()) ||
                      s.role.toLowerCase().includes(currentStaffSearch.toLowerCase())
                    );
                    return (
                      <div key={store.id} className={`rounded-lg border overflow-hidden transition-all ${isStoreSelected ? 'border-emerald-500/50 bg-emerald-50/10' : 'border-slate-200 bg-white'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 border-b border-slate-100 p-2 sm:p-0 sm:pr-3 gap-2 sm:gap-0">
                          <div
                            className="flex items-center gap-2 p-1.5 sm:p-3 cursor-pointer hover:bg-slate-100 transition-colors flex-1 rounded-md sm:rounded-none"
                            onClick={() => handleStoreSelect(store.id)}
                          >
                            <div className={`flex items-center justify-center w-4 h-4 rounded border shrink-0 ${isStoreSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 text-transparent bg-white'}`}>
                              <CheckCircle2 className="w-3 h-3" />
                            </div>
                            <Store className={`w-4 h-4 shrink-0 ${isStoreSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <h4 className="font-bold text-slate-800 text-sm truncate flex-1">{store.name}</h4>
                            <div className="text-[10px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">Select All</div>
                          </div>
                          <div className="relative ml-0 sm:ml-2 w-full sm:w-auto">
                            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              placeholder="Search staff..."
                              value={currentStaffSearch}
                              onChange={e => setStaffSearches(prev => ({ ...prev, [store.id]: e.target.value }))}
                              className="pl-6 pr-2 py-1.5 sm:py-1 border border-slate-200 rounded text-[11px] sm:text-[10px] focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-full sm:w-32 transition-all bg-white"
                            />
                          </div>
                        </div>
                        <div className="p-3">
                          {store.staff_list.length === 0 ? (
                            <p className="text-xs text-slate-400 italic text-center py-2 bg-slate-50 rounded border border-dashed border-slate-200">Staff not working now</p>
                          ) : filteredStaff.length === 0 ? (
                            <p className="text-xs text-slate-400 italic text-center py-2 bg-slate-50 rounded border border-dashed border-slate-200">No staff matched your search.</p>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                              {filteredStaff.map(staff => {
                                const isStaffSelected = selectedStaff.includes(staff.id);
                                return (
                                  <div
                                    key={staff.id}
                                    onClick={() => handleStaffSelect(staff.id, store.id)}
                                    className={`relative flex flex-col items-center p-2 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${isStaffSelected ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-emerald-200'}`}
                                  >
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden mb-2 border border-white shadow-sm ring-1 ring-slate-100 shrink-0 bg-slate-100 flex items-center justify-center">
                                      {staff.photo ? (
                                        <Image src={staff.photo.startsWith('http') ? staff.photo : `http://127.0.0.1:8000${staff.photo}`} alt={staff.name} fill className="object-cover" />
                                      ) : (
                                        <Users className="w-4 h-4 text-slate-300" />
                                      )}
                                    </div>
                                    <span className="font-bold text-xs text-slate-800 text-center line-clamp-1 w-full">{staff.name}</span>
                                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase mt-1 w-full text-center truncate">{staff.role}</span>
                                    {isStaffSelected && (
                                      <div className="absolute top-1 right-1 bg-white rounded-full">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Submit ──────────────────────────────────────────────── */}
        <div className="flex justify-end pt-1 pb-8">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-bold text-xs transition-all shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {submitting ? "Sending..." : "Send Announcement Now"}
          </button>
        </div>

      </form>
    </Container>
  );
}
