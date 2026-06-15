"use client";

import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";

export default function FormModal({ fields, initialValues = {}, onSubmit, submitLabel = "Save", loading: externalLoading }) {
  const [values, setValues] = useState(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isLoading = externalLoading || submitting;

  const handleChange = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
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
    padding: "10px 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#1e293b",
    background: "#ffffff",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s, box-shadow 0.15s",
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
            <select
              value={values[field.key] ?? ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              required={field.required}
              style={{ ...inputStyle, cursor: "pointer", appearance: "auto" }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            >
              <option value="">Select...</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
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
