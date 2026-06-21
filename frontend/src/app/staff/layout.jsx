"use client";

import { StaffAuthProvider } from "./_context/StaffAuthContext";

export default function StaffLayout({ children }) {
  return (
    <StaffAuthProvider>
      {children}
    </StaffAuthProvider>
  );
}
