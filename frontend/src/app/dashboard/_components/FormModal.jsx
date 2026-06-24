"use client";

import { useState } from "react";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function FormModal({ fields, initialValues = {}, onSubmit, submitLabel = "Save", loading: externalLoading }) {
  const [values, setValues] = useState(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState({});

  const isLoading = externalLoading || submitting;

  const handleChange = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const togglePassword = (key) => {
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit?.(values);
    } catch (err) {
      setError(err?.data?.detail || err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    color: "#1e293b",
    background: "#f8fafc",
    outline: "none",
    boxSizing: "border-box",
    transition: "all 0.2s ease",
    fontFamily: "inherit",
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = "#6366f1";
    e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = "#e2e8f0";
    e.target.style.boxShadow = "none";
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {error && (
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          padding: "12px 16px",
          background: "#fef2f2",
          border: "1.5px solid #fecaca",
          borderRadius: "10px",
          color: "#dc2626",
          fontSize: "13px",
          fontWeight: "600",
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
          <span>{error}</span>
        </div>
      )}

      {fields.map((field) => (
        <div key={field.key}>
          <label style={{
            display: "block",
            fontSize: "11px",
            fontWeight: "700",
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "7px",
          }}>
            {field.label}
            {field.required && <span style={{ color: "#ef4444", marginLeft: "3px" }}>*</span>}
          </label>

          {field.type === "select" ? (
            <div style={{ position: "relative" }}>
              <select
                value={values[field.key] ?? ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                required={field.required}
                style={{ ...inputStyle, cursor: "pointer", appearance: "none", paddingRight: "36px" }}
                onFocus={handleFocus}
                onBlur={handleBlur}
              >
                <option value="" disabled>Select {field.label}...</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div style={{
                position: "absolute",
                right: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                color: "#64748b"
              }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          ) : field.type === "textarea" ? (
            <textarea
              value={values[field.key] ?? ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              required={field.required}
              rows={4}
              placeholder={field.placeholder}
              style={{ ...inputStyle, resize: "vertical", minHeight: "100px" }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          ) : field.type === "password" ? (
            <div style={{ position: "relative" }}>
              <input
                type={showPassword[field.key] ? "text" : "password"}
                value={values[field.key] ?? ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                required={field.required}
                placeholder={field.placeholder}
                style={{ ...inputStyle, paddingRight: "40px" }}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <button
                type="button"
                onClick={() => togglePassword(field.key)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showPassword[field.key] ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          ) : field.type === "file" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "16px", cursor: "pointer", border: "2px dashed #cbd5e1", borderRadius: "12px", padding: "16px", background: "#f8fafc", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "#00694C"} onMouseLeave={e => e.currentTarget.style.borderColor = "#cbd5e1"}>
                <div style={{ position: "relative", width: "64px", height: "64px", borderRadius: "50%", overflow: "hidden", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {values[field.key] ? (
                    <img
                      src={typeof values[field.key] === "string" ? values[field.key] : URL.createObjectURL(values[field.key])}
                      alt="Preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>
                    {values[field.key] ? "Change Photo" : "Upload Photo"}
                  </span>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Click to select an image</span>
                </div>
                <input
                  type="file"
                  accept={field.accept || "image/*"}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleChange(field.key, e.target.files[0]);
                    }
                  }}
                  style={{ display: "none" }}
                />
              </label>
              {values[field.key] && (
                <button
                   type="button"
                   onClick={(e) => { e.preventDefault(); handleChange(field.key, null); }}
                   style={{ fontSize: "12px", color: "#ef4444", background: "none", border: "none", cursor: "pointer", alignSelf: "flex-start", fontWeight: "600" }}
                >
                  Remove Photo
                </button>
              )}
            </div>
          ) : (
            <input
              type={field.type || "text"}
              value={values[field.key] ?? ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              required={field.required}
              placeholder={field.placeholder}
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          )}
        </div>
      ))}

      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "8px" }}>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "10px 22px",
            fontSize: "13px",
            fontWeight: "700",
            background: "#00694C",
            color: "#ffffff",
            borderRadius: "10px",
            border: "none",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.6 : 1,
            transition: "all 0.15s",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
          onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = "#085041"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#00694C"; }}
        >
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
