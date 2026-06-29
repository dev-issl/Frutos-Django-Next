"use client";

import { useState, useRef, useEffect } from "react";
import { Filter, Check } from "lucide-react";

export default function ClassFilter({ classes = [], selectedClass, onChange }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectedName = selectedClass || "All Classes";

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button 
        type="button" 
        style={{ cursor: 'pointer' }}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
      >
        <Filter className="w-4 h-4 text-slate-400" />
        <span>{selectedClass ? `Class: ${selectedClass}` : "All Classes"}</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-48 rounded-xl bg-white shadow-xl ring-1 ring-slate-200 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
          <div className="py-1">
            <button
              style={{cursor: 'pointer'}}
              onClick={() => { onChange(null); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-50 ${!selectedClass ? "font-bold text-[#00694C] bg-emerald-50/50" : "text-slate-700"}`}
            >
              All Classes
              {!selectedClass && <Check className="w-4 h-4" />}
            </button>
          </div>

          <div className="py-1">
            {classes.map((cls) => {
              const isSelected = selectedClass === cls;
              return (
                <button
                  key={cls}
                  style={{cursor: 'pointer'}}
                  onClick={() => {
                    onChange(cls);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-50 ${isSelected ? "font-bold text-[#00694C] bg-emerald-50/50" : "text-slate-700"}`}
                >
                  <span>{cls}</span>
                  {isSelected && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
