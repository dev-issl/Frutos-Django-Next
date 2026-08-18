"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

export default function SearchableSelect({
  options = [],
  value = "",
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  disabled = false,
  required = false,
  name,
  className = "",
  isMulti = false,
  allowCustom = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  // Helper to safely get selected options
  const getSelectedOptions = () => {
    if (isMulti) {
      const vals = Array.isArray(value) ? value : [];
      return vals.map(val => {
        const match = options.find(o => String(o.value) === String(val));
        if (match) return match;
        return allowCustom && val ? { label: val, value: val } : null;
      }).filter(Boolean);
    } else {
      const match = options.find(o => String(o.value) === String(value));
      if (match) return [match];
      if (allowCustom && value) return [{ label: value, value: value }];
      return [];
    }
  };

  const selectedOptions = getSelectedOptions();
  const selected = isMulti ? null : selectedOptions[0];

  let filtered = search
    ? options.filter(o => o.label?.toLowerCase().includes(search.toLowerCase()))
    : [...options];

  if (allowCustom && search) {
    const exactMatch = options.some(o => String(o.value).toLowerCase() === search.toLowerCase() || String(o.label).toLowerCase() === search.toLowerCase());
    if (!exactMatch) {
      filtered.push({ label: `Create "${search}"`, value: search, isCustom: true });
    }
  }

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") { setOpen(false); setSearch(""); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  const handleSelect = (optValue) => {
    if (isMulti) {
      const currentVals = Array.isArray(value) ? value : [];
      const isSelected = currentVals.some(v => String(v) === String(optValue));
      if (isSelected) {
        onChange?.(currentVals.filter(v => String(v) !== String(optValue)));
      } else {
        onChange?.([...currentVals, optValue]);
        if (allowCustom) setSearch("");
      }
    } else {
      onChange?.(optValue);
      setOpen(false);
      setSearch("");
    }
  };

  const toggleOpen = () => {
    if (!disabled) setOpen(o => !o);
  };
  
  const displayLabel = () => {
    if (isMulti) {
      if (selectedOptions.length === 0) return placeholder;
      if (selectedOptions.length === 1) return selectedOptions[0].label;
      if (selectedOptions.length <= 2) return selectedOptions.map(o => o.label).join(", ");
      return `${selectedOptions.length} selected`;
    }
    return selected ? selected.label : placeholder;
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          padding: "10px 14px",
          border: open ? "1.5px solid #6366f1" : "1.5px solid #e2e8f0",
          borderRadius: "10px",
          fontSize: "14px",
          background: "#ffffff",
          color: selectedOptions.length > 0 ? "#1e293b" : "#94a3b8",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          boxShadow: open ? "0 0 0 3px rgba(99,102,241,0.1)" : "none",
          transition: "all 0.15s",
          outline: "none",
          textAlign: "left",
          fontFamily: "inherit",
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: selectedOptions.length > 0 ? "600" : "400" }}>
          {displayLabel()}
        </span>
        <ChevronDown
          size={16}
          style={{
            color: "#94a3b8",
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
          }}
        />
      </button>

      {name && (
        <input
          tabIndex={-1}
          required={required}
          name={name}
          value={isMulti ? (Array.isArray(value) && value.length > 0 ? value.join(",") : "") : (value ?? "")}
          onChange={() => {}}
          aria-hidden="true"
          style={{ position: "absolute", bottom: 0, left: 0, width: "100%", opacity: 0, pointerEvents: "none", height: 0 }}
        />
      )}

      {open && (
        <div style={{
          position: "absolute",
          zIndex: 100,
          width: "100%",
          marginTop: "6px",
          minWidth: "180px",
          background: "#ffffff",
          border: "1.5px solid #e2e8f0",
          borderRadius: "12px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          overflow: "hidden",
          animation: "db-modal-in 0.15s ease",
        }}>
          {/* Search box */}
          <div style={{ padding: "10px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ position: "relative" }}>
              <Search
                size={13}
                style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}
              />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                style={{
                  width: "100%",
                  paddingLeft: "30px",
                  paddingRight: "10px",
                  paddingTop: "7px",
                  paddingBottom: "7px",
                  fontSize: "13px",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "8px",
                  background: "#f8fafc",
                  color: "#1e293b",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
                onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.background = "#ffffff"; }}
                onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; }}
              />
            </div>
          </div>

          {/* Options list */}
          <div style={{ maxHeight: "220px", overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", fontSize: "13px", color: "#94a3b8", fontWeight: "500" }}>
                No options found
              </div>
            ) : (
              filtered.map(o => {
                let isSelected = false;
                if (isMulti) {
                   const vals = Array.isArray(value) ? value : [];
                   isSelected = vals.some(v => String(v) === String(o.value));
                } else {
                   isSelected = String(o.value) === String(value);
                }
                
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => handleSelect(o.value)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      padding: "10px 14px",
                      fontSize: "13px",
                      textAlign: "left",
                      background: isSelected ? "#f0f9ff" : "transparent",
                      color: isSelected ? "#0ea5e9" : "#374151",
                      fontWeight: isSelected ? "700" : "500",
                      border: "none",
                      cursor: "pointer",
                      borderBottom: "1px solid #f8fafc",
                      transition: "background 0.1s",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#f8fafc"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.label}</span>
                    {isSelected && <Check size={13} style={{ color: "#0ea5e9", flexShrink: 0 }} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
