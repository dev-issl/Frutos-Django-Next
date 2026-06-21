"use client";

import { useState } from "react";
import { useStaffAuth } from "@/app/staff/_context/StaffAuthContext";

export default function StaffLoginPage() {
  const { login } = useStaffAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f9f6] px-4 font-sans">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-full bg-[#00694C] flex items-center justify-center shadow-lg">
              <span className="text-white font-serif font-bold text-2xl">EA</span>
            </div>
          </div>
          <h1 className="text-2xl font-serif text-[#00694C] font-semibold tracking-tight">
            El Árbol Staff
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Sign in to your staff portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@elarbol.com"
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00694C]/20 focus:border-[#00694C] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Secret Key / Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00694C]/20 focus:border-[#00694C] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#00694C] text-white text-sm font-medium rounded-xl hover:bg-[#00523b] disabled:opacity-50 transition-all mt-6 shadow-sm hover:shadow"
          >
            {loading ? "Signing in..." : "Sign in to Portal"}
          </button>
        </form>
        
        <p className="text-center text-xs text-slate-400 mt-8">
          © 2025 El Árbol Retail Group
        </p>
      </div>
    </div>
  );
}
