"use client";

import { useState, useRef, useEffect } from "react";
import { Filter, ChevronRight, Check } from "lucide-react";

export default function CategoryFilter({ categories, selectedCategory, selectedSubCategory, onChange }) {
  const [open, setOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState(null);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setHoveredCat(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectedCatName = categories?.find(c => c.slug === selectedCategory)?.name || "All Categories";
  const selectedSubName = categories?.flatMap(c => c.subcategories || [])?.find(sc => sc.slug === selectedSubCategory)?.name;

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button 
        type="button" 
        style={{ cursor: 'pointer' }}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
      >
        <Filter className="w-4 h-4 text-slate-400" />
        <span>
          {selectedSubName ? `${selectedCatName} > ${selectedSubName}` : selectedCatName}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-56 rounded-xl bg-white shadow-xl ring-1 ring-slate-200 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
          <div className="py-1">
            <button
              style={{cursor: 'pointer'}}
              onClick={() => { onChange(null, null); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-50 ${!selectedCategory ? "font-bold text-[#00694C] bg-emerald-50/50" : "text-slate-700"}`}
            >
              All Categories
              {!selectedCategory && <Check className="w-4 h-4" />}
            </button>
          </div>

          <div className="py-1">
            {categories?.map((cat) => {
              const hasSub = cat.subcategories && cat.subcategories.length > 0;
              const isSelected = selectedCategory === cat.slug && !selectedSubCategory;
              return (
                <div 
                  key={cat.id}
                  className="relative group/item"
                  onMouseEnter={() => setHoveredCat(cat.id)}
                  onMouseLeave={() => setHoveredCat(null)}
                >
                  <button
                    style={{cursor: 'pointer'}}
                    onClick={() => {
                      onChange(cat.slug, null);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-50 ${selectedCategory === cat.slug ? "font-bold text-[#00694C] bg-emerald-50/50" : "text-slate-700"}`}
                  >
                    <span>{cat.name} {cat.total_products !== undefined && <span className="ml-1 text-xs text-slate-400 font-medium">({cat.total_products})</span>}</span>
                    <div className="flex items-center gap-1">
                      {isSelected && <Check className="w-4 h-4" />}
                      {hasSub && <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {/* Submenu */}
                  {hasSub && hoveredCat === cat.id && (
                    <div className="absolute left-[98%] top-0 ml-1 w-48 rounded-xl bg-white shadow-xl ring-1 ring-slate-200 py-1 z-50 animate-in fade-in slide-in-from-left-2 duration-100">
                      {cat.subcategories.map(sub => {
                        const isSubSelected = selectedSubCategory === sub.slug;
                        return (
                          <button
                            key={sub.id}
                            style={{cursor: 'pointer'}}
                            onClick={(e) => {
                              e.stopPropagation();
                              onChange(cat.slug, sub.slug);
                              setOpen(false);
                              setHoveredCat(null);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-50 ${isSubSelected ? "font-bold text-[#00694C] bg-emerald-50/50" : "text-slate-700"}`}
                          >
                            <span>{sub.name} {sub.total_products !== undefined && <span className="ml-1 text-xs text-slate-400 font-medium">({sub.total_products})</span>}</span>
                            {isSubSelected && <Check className="w-4 h-4" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
