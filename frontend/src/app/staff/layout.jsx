"use client";

import { StaffAuthProvider } from "./_context/StaffAuthContext";
import { ToastProvider } from "@/app/dashboard/_components/Toaster";

export default function StaffLayout({ children }) {
  return (
    <StaffAuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </StaffAuthProvider>
  );
}
