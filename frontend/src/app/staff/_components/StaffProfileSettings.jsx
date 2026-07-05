"use client";

import { useState, useRef } from "react";
import useSWR from "swr";
import api from "@/app/dashboard/_lib/api";
import { User, Phone, Lock, Save, Camera, Check, Calendar, Store as StoreIcon, TrendingUp, Loader2, BarChart2, ArrowRight, ChevronDown } from "lucide-react";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import { useStaffAuth } from "../_context/StaffAuthContext";

export default function StaffProfileSettings({ profile, user }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(profile?.photo || null);
  const { success: successToast, error: errorToast } = useToastContext();
  const { fetchUser } = useStaffAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    const formData = new FormData(e.target);
    const password = formData.get("password");
    if (!password) formData.delete("password");
    try {
      await api.patch("/api/staff/me/profile/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setSuccess(true);
      successToast("Profile updated successfully");
      if (fetchUser) await fetchUser();
      setTimeout(() => setSuccess(false), 3000);
      e.target.reset();
    } catch (err) {
      errorToast(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setPhotoPreview(URL.createObjectURL(file));
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 md:p-6 border-b border-slate-100">
            <h2 className="font-serif text-xl font-bold text-emerald-900">Profile Settings</h2>
            <p className="text-slate-500 text-xs mt-1">Update your personal information and profile photo.</p>
          </div>
          <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-5">
            {/* Photo Section */}
            <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
              <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden shrink-0 relative group">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={24} /></div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white w-5 h-5" />
                </div>
                <input type="file" name="photo" accept="image/*" onChange={handlePhotoChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Change Photo" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 text-sm">Profile Photo</h3>
                <p className="text-xs text-slate-500 mb-1.5">Click the image to upload a new photo.</p>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">{profile?.role || "Staff Member"}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-4 w-4 text-slate-400" /></div>
                  <input name="name" defaultValue={user?.name}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm" />
                </div>
              </div>
              <div className="space-y-1.5 opacity-80">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Email (Read-Only)</label>
                <input disabled defaultValue={user?.email}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed shadow-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-4 w-4 text-slate-400" /></div>
                  <input name="phone" defaultValue={profile?.phone}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                  Change Password <span className="text-[9px] text-slate-400 normal-case tracking-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-4 w-4 text-slate-400" /></div>
                  <input name="password" type="password" placeholder="New password"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm" />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button type="submit" disabled={loading}
                className={`px-5 py-2 rounded-lg font-bold text-xs text-white flex items-center gap-2 transition-all shadow-sm ${success ? "bg-green-500" : "bg-emerald-600 hover:bg-emerald-700"} disabled:opacity-70 disabled:cursor-not-allowed`}>
                {loading ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  : success ? <Check size={14} /> : <Save size={14} />}
                {success ? "Saved!" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
    </div>
  );
}


