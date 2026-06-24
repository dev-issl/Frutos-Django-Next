"use client";

import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Delete", destructive = true }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.3)", backdropFilter: "blur(4px)" }}
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="relative w-full max-w-sm"
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #f1f5f9",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          padding: "24px",
          animation: "db-modal-in 0.2s ease",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{ position: "absolute", top: "14px", right: "14px", padding: "6px", borderRadius: "8px", border: "none", cursor: "pointer", background: "transparent", color: "#94a3b8", display: "flex" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          <X size={14} />
        </button>

        {/* Icon + text */}
        <div className="flex items-start gap-4">
          <div
            style={{
              padding: "10px",
              borderRadius: "12px",
              flexShrink: 0,
              background: destructive ? "#fef2f2" : "#fffbeb",
            }}
          >
            <AlertTriangle
              size={20}
              style={{ color: destructive ? "#ef4444" : "#f59e0b" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#1e293b", margin: "0 0 6px 0" }}>
              {title || "Are you sure?"}
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: "1.5" }}>
              {message || "This action cannot be undone."}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              fontSize: "13px",
              fontWeight: "600",
              borderRadius: "12px",
              border: "1.5px solid #e2e8f0",
              background: "#ffffff",
              color: "#374151",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            style={{
              padding: "10px 20px",
              fontSize: "13px",
              fontWeight: "700",
              borderRadius: "12px",
              border: "none",
              background: destructive ? "#ef4444" : "#f59e0b",
              color: "#ffffff",
              cursor: "pointer",
              transition: "all 0.15s",
              boxShadow: destructive ? "0 4px 12px rgba(239,68,68,0.2)" : "0 4px 12px rgba(245,158,11,0.2)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = destructive ? "#dc2626" : "#d97706"; }}
            onMouseLeave={e => { e.currentTarget.style.background = destructive ? "#ef4444" : "#f59e0b"; }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
