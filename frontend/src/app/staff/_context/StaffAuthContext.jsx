"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/app/dashboard/_lib/api";

// We'll reuse the auth mechanism but ensure user_type is STAFF
const TOKEN_KEY = "admin_access_token";
const REFRESH_KEY = "admin_refresh_token";
const STAFF_USER_KEY = "icommerce_staff_user";

const StaffAuthContext = createContext(null);

export function StaffAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const cachedUser = localStorage.getItem(STAFF_USER_KEY);
    
    if (token && cachedUser) {
      const parsedUser = JSON.parse(cachedUser);
      if (parsedUser.userType === "STAFF") {
        setUser(parsedUser);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (pathname === "/staff/login") return;
    if (!user) {
      router.push("/staff/login");
    }
  }, [loading, user, pathname, router]);

  const login = useCallback(async (email, password) => {
    try {
      // Direct API call
      const res = await api.post("/api/auth/login/", { email, password }, { skipAuth: true });
      
      const { access, refresh, user: u } = res;
      
      if (u.user_type !== "STAFF") {
        throw new Error("Unauthorized. Only staff members can access this portal.");
      }

      localStorage.setItem(TOKEN_KEY, access);
      localStorage.setItem(REFRESH_KEY, refresh);
      
      const mappedUser = {
        id: u.id,
        email: u.email,
        name: u.fullName || u.name || u.email,
        userType: u.user_type,
      };
      localStorage.setItem(STAFF_USER_KEY, JSON.stringify(mappedUser));
      setUser(mappedUser);
      
      router.push("/staff");
      return mappedUser;
    } catch (err) {
      throw new Error(err?.response?.data?.detail || err?.message || "Login failed");
    }
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(STAFF_USER_KEY);
    // Clear old keys to be safe
    localStorage.removeItem("icommerce_admin_access");
    localStorage.removeItem("icommerce_admin_refresh");
    setUser(null);
    router.push("/staff/login");
  }, [router]);

  return (
    <StaffAuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuth() {
  const ctx = useContext(StaffAuthContext);
  if (!ctx) throw new Error("useStaffAuth must be inside StaffAuthProvider");
  return ctx;
}
