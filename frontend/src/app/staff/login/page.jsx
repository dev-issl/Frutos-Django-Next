"use client";

import { useState } from "react";
import { useStaffAuth } from "@/app/staff/_context/StaffAuthContext";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function StaffLoginPage() {
  const { login } = useStaffAuth();
  const [staffId, setStaffId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(staffId, "");
    } catch (err) {
      setError(err.message || "Invalid Staff ID. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f9f6] px-4 sm:px-6 font-sans">
      <div className="w-full max-w-sm">
        <div className="bg-white px-6 py-8 sm:px-8 sm:py-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="relative h-24 w-48 flex items-center justify-center">
                <Image
                  src="/el-erbol-logo.png"
                  alt="El Árbol Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif text-slate-900 font-bold tracking-tight">
              Staff Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium">
              Welcome back! Please enter your details.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50/80 border border-red-100 rounded-xl px-4 py-2.5 text-center font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Staff ID
              </label>
              <input
                type="text"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                placeholder="e.g. STF-123456"
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00694C]/20 focus:border-[#00694C] transition-all font-medium placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#00694C] text-white text-sm font-bold rounded-xl hover:bg-[#00523b] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors mt-2 flex justify-center items-center h-[44px]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          © {new Date().getFullYear()} El Árbol Retail Group
        </p>
      </div>
    </div>
  );
}

