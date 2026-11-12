"use client";

import React from "react";

function parseNutritionRows(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter(r => r && r.label && r.value);
  }
  const text = String(raw).trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.filter(r => r && r.label && r.value);
      }
    } catch {
      // Fallback to line parsing
    }
  }
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const label = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (label && value) rows.push({ label, value });
  }
  return rows;
}

function InfoBlock({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{value || "N/A"}</span>
    </div>
  );
}

function Section({ title, children, className = "", icon }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-sm ${className}`}>
      <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
        {icon && <span className="text-indigo-500">{icon}</span>}
        {title}
      </h4>
      {children}
    </div>
  );
}

function StatusBadge({ active }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${active ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"
      }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-rose-500"}`}></span>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default function ProductView({ item, stores }) {
  if (!item) return null;

  return (
    <div className="space-y-6 pb-2">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-48 shrink-0">
          {item.thumbnail_url ? (
            <img src={item.thumbnail_url} alt={item.name} className="w-full aspect-square object-cover rounded-xl border border-slate-200 shadow-md" />
          ) : (
            <div className="w-full aspect-square rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shadow-inner">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">No Image</span>
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge active={item.is_active} />
                {item.badge && (
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[11px] font-bold uppercase tracking-wide">
                    {item.badge}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2 leading-tight">
                {item.name}
                {item.variant && <span className="ml-2 text-sm px-2 py-1 bg-slate-100 text-slate-500 rounded font-bold align-middle tracking-widest uppercase">{item.variant}</span>}
              </h2>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="px-2 py-1 bg-white border border-slate-200 rounded-md shadow-sm">{item.category?.name || 'Uncategorized'}</span>
                <span className="px-2 py-1 bg-white border border-slate-200 rounded-md shadow-sm text-amber-600 font-semibold">
                  ★ {item.rating ? `${Number(item.rating).toFixed(1)} (${item.review_count})` : "New"}
                </span>
                <span className="px-2 py-1 bg-white border border-slate-200 rounded-md shadow-sm text-slate-600 font-semibold">
                  Stock: {item.is_unlimited_stock ? "∞ Unlimited" : (item.stock || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout for Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Retail Pricing Section */}
        <Section title="Retail Information" className="bg-blue-50/30 border-blue-100">
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <InfoBlock label="Regular Price" value={`€${Number(item.price).toLocaleString()}`} />
            <InfoBlock label="Sale Price" value={item.discount_price ? `€${Number(item.discount_price).toLocaleString()}` : "N/A"} />
            <InfoBlock label="Display Unit" value={item.unit} />
            <InfoBlock label="Tax Rate" value={item.tax_rate ? `${item.tax_rate}%` : "0%"} />
          </div>
        </Section>

        {/* Internal Wholesale Pricing Section */}
        <Section title="Internal Wholesale" className="bg-amber-50/30 border-amber-100">
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <InfoBlock label="Internal Price" value={item.wholesale_price ? `€${Number(item.wholesale_price).toLocaleString()}` : "N/A"} />
            <InfoBlock label="Internal Sale Price" value={item.wholesale_discount_price ? `€${Number(item.wholesale_discount_price).toLocaleString()}` : "N/A"} />
            <InfoBlock label="Internal Unit" value={item.wholesale_unit || "N/A"} />
            <InfoBlock label="Min Purchase Qty" value={item.minimum_purchase || "N/A"} />
            <InfoBlock label="Stock" value={item.is_unlimited_wholesale_stock ? "∞ Unlimited" : (item.wholesale_stock ?? "N/A")} />
          </div>
        </Section>

        {/* External Wholesale Pricing Section */}
        <Section title="External Wholesale" className="bg-emerald-50/30 border-emerald-100">
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <InfoBlock label="External Price" value={item.restaurant_price ? `€${Number(item.restaurant_price).toLocaleString()}` : "N/A"} />
            <InfoBlock label="External Sale Price" value={item.restaurant_discount_price ? `€${Number(item.restaurant_discount_price).toLocaleString()}` : "N/A"} />
            <InfoBlock label="External Unit" value={item.restaurant_unit || "N/A"} />
            <InfoBlock label="Min Purchase Qty" value={item.restaurant_minimum_purchase || "N/A"} />
            <InfoBlock label="Stock" value={item.is_unlimited_restaurant_stock ? "∞ Unlimited" : (item.restaurant_stock ?? "N/A")} />
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Section title="General Details">
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <InfoBlock label="Product Slug" value={item.slug} />
              <InfoBlock label="Origin Country" value={item.origin} />
              <InfoBlock label="Brand" value={item.brand?.name} />
              <InfoBlock label="Sub Category" value={item.sub_category?.name} />
              <InfoBlock label="Shop / Vendor" value={item.shop?.name} />
              <InfoBlock label="Physical Stores" value={Array.isArray(item.stores) && item.stores.length > 0 ? (stores?.length > 0 && item.stores.length === stores.length ? "All" : item.stores.map(s => s.name).join(", ")) : "None"} />
              <InfoBlock label="Badge Color" value={item.badge_color} />
            </div>
          </Section>

          {item.short_description && item.short_description.trim() !== "" && (
             <Section title="Short Description (Hero Summary)">
               <p className="text-sm text-slate-700 leading-relaxed">{item.short_description}</p>
             </Section>
          )}

          {item.description && item.description.trim() !== "" && (
             <Section title="Description">
               <div className="prose prose-sm max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: item.description }} />
             </Section>
          )}

          {Array.isArray(item.highlights) && item.highlights.length > 0 && (
             <Section title="Product Highlights">
               <ul className="space-y-2 text-sm text-slate-700">
                 {item.highlights.map((h, i) => (
                   <li key={i} className="flex items-start gap-2">
                     <span className="mt-1.5 w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                     <span>{h}</span>
                   </li>
                 ))}
               </ul>
             </Section>
          )}

          {(() => {
            const parsedNutrition = parseNutritionRows(item.nutritional_info);
            if (!item.nutritional_info || parsedNutrition.length === 0 && !String(item.nutritional_info).trim()) return null;
            return (
              <Section title={`Nutritional Information (${item.nutrition_serving_size || "per 100g"})`}>
                {parsedNutrition.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {parsedNutrition.map((row, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-emerald-50/70 border border-emerald-100 rounded-xl px-3.5 py-2.5">
                        <span className="text-xs font-semibold text-slate-600">{row.label}</span>
                        <span className="text-xs font-bold text-[#00694C]">{row.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#00694C] rounded-xl p-5 shadow-inner">
                    <pre className="font-mono text-xs text-emerald-400 whitespace-pre-wrap leading-relaxed">
                      {item.nutritional_info}
                    </pre>
                  </div>
                )}
              </Section>
            );
          })()}

          {(
            item.trust_badges?.length > 0 ||
            item.promo_card_title ||
            item.promo_card_image_url ||
            item.shipping_info_title ||
            item.shipping_info ||
            item.return_policy_title ||
            item.return_policy ||
            item.farm_story_title ||
            item.farm_story_description ||
            item.farm_story_image_url ||
            item.farm_story_stats?.length > 0
          ) && (
            <Section title="Details Page & Story Overrides">
              <div className="space-y-4 text-xs text-slate-700">
                {item.trust_badges?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Hero Trust Badges</p>
                    <div className="flex flex-wrap gap-2">
                      {item.trust_badges.map((b, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 font-semibold text-[#00694C]">
                          {b.text}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(item.promo_card_title || item.promo_card_image_url) && (
                  <div className="flex items-center gap-3">
                    {item.promo_card_image_url && (
                      <img src={item.promo_card_image_url} alt="Promo card" className="w-16 h-12 rounded-lg object-cover border border-slate-200" />
                    )}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Promo Card Title</p>
                      <p className="font-semibold text-slate-800">{item.promo_card_title || "Default Title"}</p>
                    </div>
                  </div>
                )}
                {(item.shipping_info_title || item.shipping_info) && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shipping Info Override</p>
                    <p className="font-semibold text-slate-800">{item.shipping_info_title || "Shipping Info"}</p>
                    {item.shipping_info && <p className="text-slate-600 mt-0.5 whitespace-pre-line">{item.shipping_info}</p>}
                  </div>
                )}
                {(item.return_policy_title || item.return_policy) && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Return Policy Override</p>
                    <p className="font-semibold text-slate-800">{item.return_policy_title || "Return Policy"}</p>
                    {item.return_policy && <p className="text-slate-600 mt-0.5 whitespace-pre-line">{item.return_policy}</p>}
                  </div>
                )}
                {(item.farm_story_title || item.farm_story_description || item.farm_story_image_url || item.farm_story_stats?.length > 0) && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Farm Story Override</p>
                    <div className="flex items-start gap-3">
                      {item.farm_story_image_url && (
                        <img src={item.farm_story_image_url} alt="Farm story" className="w-16 h-12 rounded-lg object-cover border border-slate-200 shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold text-slate-800">
                          {item.farm_story_eyebrow ? `${item.farm_story_eyebrow} — ` : ""}{item.farm_story_title || "Farm Story"}
                        </p>
                        {item.farm_story_description && <p className="text-slate-600 mt-0.5">{item.farm_story_description}</p>}
                        {item.farm_story_stats?.length > 0 && (
                          <div className="flex flex-wrap gap-3 mt-1.5">
                            {item.farm_story_stats.map((st, idx) => (
                              <span key={idx} className="font-semibold text-[#00694C]">
                                {st.value} {st.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {item.specifications?.length > 0 && (
            <Section title="Specifications">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {item.specifications.map((s, i) => (
                  <div key={i} className="flex flex-col bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{s.name}</span>
                    <span className="text-sm text-slate-800 font-semibold mt-0.5">{s.value}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {item.additional_images?.length > 0 && (
            <Section title="Image Gallery">
              <div className="flex flex-wrap gap-4">
                {item.additional_images.map((img, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <img src={img.image} alt="" className="w-24 h-24 object-cover transition-transform duration-300 group-hover:scale-110" />
                  </div>
                ))}
              </div>
            </Section>
          )}

          {item.store_stocks?.length > 0 && (
            <Section title="Store Inventory">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {item.store_stocks.map((ss, i) => (
                  <div key={i} className="flex flex-col bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{ss.store_name}</span>
                    <span className="text-sm text-slate-800 font-semibold mt-0.5">{ss.stock} units</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        <div className="space-y-6">
          <Section title="Variants & Options">
            {(item.colors?.length > 0 || item.sizes?.length > 0 || item.variant) ? (
              <div className="space-y-5">
                {item.variant && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Quality Class</span>
                    <div className="flex flex-wrap gap-2">
                      <div className="px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 shadow-sm text-xs font-bold text-indigo-700 uppercase tracking-wide">
                        {item.variant}
                      </div>
                    </div>
                  </div>
                )}
                {item.colors?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Available Colors</span>
                    <div className="flex flex-wrap gap-2">
                      {item.colors.map(c => (
                        <div key={c.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm text-xs font-semibold text-slate-700">
                          {c.hex_code && <span className="w-3 h-3 rounded-full border border-slate-200 shadow-inner" style={{ background: c.hex_code }} />}
                          {c.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {item.sizes?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Available Sizes</span>
                    <div className="flex flex-wrap gap-2">
                      {item.sizes.map(s => (
                        <div key={s.id} className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm text-xs font-semibold text-slate-700">
                          {s.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No variants available.</p>
            )}
          </Section>

          <Section title="System Information">
            <div className="space-y-4">
              <InfoBlock label="Created On" value={item.created_at ? new Date(item.created_at).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "N/A"} />
              <InfoBlock label="Created By" value={item.created_by_name ? `${item.created_by_name} ${item.created_by_role ? `(${item.created_by_role})` : ''}` : "System"} />
              <InfoBlock label="Last Updated" value={item.updated_at ? new Date(item.updated_at).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "N/A"} />
              <InfoBlock label="Updated By" value={item.updated_by_name ? `${item.updated_by_name} ${item.updated_by_role ? `(${item.updated_by_role})` : ''}` : "System"} />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
