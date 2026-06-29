"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Globe, 
  Share2,
  Image as ImageIcon,
  UploadCloud,
  Eye, 
  Pencil
} from "lucide-react";
import Container from "@/app/dashboard/_components/Container";
import DataTable from "@/app/dashboard/_components/DataTable";
import Modal from "@/app/dashboard/_components/Modal";
import FormModal from "@/app/dashboard/_components/FormModal";
import ConfirmDialog from "@/app/dashboard/_components/ConfirmDialog";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import { useModel } from "@/app/dashboard/_lib/useModel";
import {
  heroBannersService, offerBannersService, blogPostsService, socialLinksService,
  navbarService, offerCategoriesService, horizontalBannersService,
  footerSectionsService, footerLinksService, siteSettingsService,
} from "@/app/dashboard/_lib/services";

const PAGE_SIZE = 10;

/** Clip text to max characters with ellipsis */
const clip = (v, max = 40) => {
  if (!v) return "—";
  const s = String(v);
  return s.length > max ? s.slice(0, max) + "…" : s;
};

const TABS = [
  { id: "settings", label: "Meta Config" },
  { id: "navbar", label: "Navbar" },
  { id: "footer", label: "Footer" },
  { id: "catalog", label: "Catalog" },
];

/* ─── Column / Field definitions per tab ─────────────────────── */

const statusCol = (key = "is_active") => ({
  key,
  label: "Status",
  render: (v) => (
    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${v ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
      {v ? "Active" : "Inactive"}
    </span>
  ),
});

const activeField = { key: "is_active", label: "Active", type: "select", required: true, options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] };

// Hero Banners
const heroColumns = [
  { key: "title", label: "Title", render: (v) => <span title={v}>{clip(v)}</span> },
  { key: "subtitle", label: "Subtitle", render: (v) => v ? <span className="text-slate-500 text-xs" title={v}>{clip(v, 45)}</span> : "—" },
  { key: "order", label: "Order" },
  statusCol(),
];
const heroFields = [
  { key: "title", label: "Title", required: true },
  { key: "subtitle", label: "Subtitle" },
  { key: "button_text", label: "Button Text" },
  { key: "button_url", label: "Button URL" },
  { key: "order", label: "Order", type: "number", placeholder: "1" },
  activeField,
];

// Offer Banners
const offerColumns = [
  { key: "title", label: "Title", render: (v) => <span title={v}>{clip(v)}</span> },
  { key: "order", label: "Order" },
  statusCol(),
];
const offerFields = [
  { key: "title", label: "Title", required: true },
  { key: "subtitle", label: "Subtitle" },
  { key: "button_text", label: "Button Text" },
  { key: "button_url", label: "Button URL" },
  { key: "order", label: "Order", type: "number" },
  activeField,
];

// Horizontal Promo Banners
const horizontalColumns = [
  { key: "title", label: "Title", render: (v) => <span title={v}>{clip(v)}</span> },
  { key: "subtitle", label: "Subtitle", render: (v) => v ? <span className="text-slate-500 text-xs" title={v}>{clip(v, 45)}</span> : "—" },
  { key: "order", label: "Order" },
  statusCol(),
];
const horizontalFields = [
  { key: "title", label: "Title", required: true },
  { key: "subtitle", label: "Subtitle" },
  { key: "button_text", label: "Button Text" },
  { key: "button_url", label: "Button URL" },
  { key: "overlay_colors", label: "Overlay Colors", placeholder: "from-purple-900/70 via-blue-900/50 to-transparent" },
  { key: "order", label: "Order", type: "number" },
  activeField,
];

// Offer Categories
const offerCatColumns = [
  { key: "title", label: "Title", render: (v) => <span title={v}>{clip(v, 35)}</span> },
  { key: "name", label: "Name", render: (v) => <span title={v}>{clip(v, 25)}</span> },
  { key: "link", label: "Link", render: (v) => v ? <span className="font-mono text-xs text-slate-500" title={v}>{clip(v, 35)}</span> : "—" },
  { key: "badge_text", label: "Badge", render: (v) => v ? <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 font-medium">{v}</span> : "—" },
  { key: "order", label: "Order" },
  statusCol(),
];
const offerCatFields = [
  { key: "name", label: "Name", required: true, placeholder: "e.g., flash-sale" },
  { key: "title", label: "Display Title", required: true, placeholder: "e.g., Flash Sale" },
  { key: "link", label: "Link URL", required: true, placeholder: "/products?offer=flash-sale" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "badge_text", label: "Badge Text", placeholder: "HOT, NEW, SALE" },
  { key: "badge_color", label: "Badge Color", placeholder: "red" },
  { key: "icon_class", label: "Icon Class" },
  { key: "order", label: "Order", type: "number" },
  { key: "is_featured", label: "Featured", type: "select", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
  activeField,
];

// Navbar Links
const navbarColumns = [
  { key: "name", label: "Name", render: (v) => <span title={v}>{clip(v, 30)}</span> },
  { key: "link_type", label: "Type", render: (v) => <span className="capitalize">{v}</span> },
  { key: "url", label: "URL", render: (v) => v ? <span className="font-mono text-xs text-slate-500" title={v}>{clip(v, 35)}</span> : "—" },
  { key: "order", label: "Order" },
  statusCol(),
];
const navbarFields = [
  { key: "name", label: "Link Name", required: true },
  { key: "link_type", label: "Type", type: "select", required: true, options: [{ value: "internal", label: "Internal" }, { value: "external", label: "External" }, { value: "dropdown", label: "Dropdown" }] },
  { key: "url", label: "URL", placeholder: "/page or https://..." },
  { key: "icon_class", label: "Icon Class" },
  { key: "order", label: "Order", type: "number" },
  { key: "show_in_mobile", label: "Show Mobile", type: "select", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
  { key: "show_in_desktop", label: "Show Desktop", type: "select", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
  activeField,
];

// Blog Posts
const blogColumns = [
  { key: "title", label: "Title", render: (v) => <span title={v}>{clip(v, 40)}</span> },
  { key: "slug", label: "Slug", render: (v) => <span className="font-mono text-xs text-slate-500" title={v}>{clip(v, 30)}</span> },
  { key: "is_featured", label: "Featured", render: (v) => v ? <span className="text-xs text-amber-600 font-medium">Featured</span> : "—" },
  statusCol("is_active"),
  { key: "publish_date", label: "Published", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];
const blogFields = [
  { key: "title", label: "Title", required: true },
  { key: "description", label: "Description", type: "textarea", required: true },
  { key: "content", label: "Content", type: "textarea" },
  { key: "is_featured", label: "Featured", type: "select", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
  activeField,
];

// Footer Sections
const footerColumns = [
  { key: "title", label: "Title", render: (v) => <span title={v}>{clip(v, 35)}</span> },
  { key: "section_type", label: "Type", render: (v) => <span className="capitalize">{(v || "").replace(/_/g, " ")}</span> },
  { key: "order", label: "Order" },
  { key: "links", label: "Links", render: (v) => v?.length ?? 0 },
  statusCol(),
];
const footerFields = [
  { key: "title", label: "Section Title", required: true },
  { key: "section_type", label: "Section Type", type: "select", required: true, options: [
    { value: "company_info", label: "Company Info" },
    { value: "services", label: "Services" },
    { value: "platforms", label: "Platforms" },
    { value: "company", label: "Company" },
    { value: "legal", label: "Legal" },
    { value: "social", label: "Social Media" },
  ]},
  { key: "order", label: "Order", type: "number" },
  activeField,
];

// Footer Links
const footerLinkColumns = [
  { key: "text", label: "Text", render: (v) => <span title={v}>{clip(v, 30)}</span> },
  { key: "url", label: "URL", render: (v) => v ? <span className="font-mono text-xs text-slate-500" title={v}>{clip(v, 40)}</span> : "—" },
  { key: "order", label: "Order" },
  { key: "open_in_new_tab", label: "New Tab", render: (v) => v ? "Yes" : "No" },
  statusCol(),
];
const footerLinkFields = [
  { key: "text", label: "Link Text", required: true },
  { key: "url", label: "URL", required: true, placeholder: "/page or https://..." },
  { key: "section", label: "Section ID", required: true, placeholder: "Footer Section UUID" },
  { key: "icon_class", label: "Icon Class" },
  { key: "order", label: "Order", type: "number" },
  { key: "open_in_new_tab", label: "Open in New Tab", type: "select", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
  activeField,
];

// Social Links
const socialColumns = [
  { key: "platform", label: "Platform", render: (v) => <span title={v}>{clip(v, 25)}</span> },
  { key: "url", label: "URL", render: (v) => v ? <span className="font-mono text-xs text-slate-500" title={v}>{clip(v, 45)}</span> : "—" },
  { key: "order", label: "Order" },
  statusCol(),
];
const socialFields = [
  { key: "platform", label: "Platform", required: true, placeholder: "e.g., Facebook" },
  { key: "url", label: "URL", required: true, placeholder: "https://..." },
  { key: "icon_class", label: "Icon class", placeholder: "e.g., facebook" },
  { key: "order", label: "Order", type: "number" },
  activeField,
];

// Meta Config / Settings
const settingsColumns = [
  { key: "key", label: "Config Name", render: (v) => <span className="font-semibold text-slate-800 text-xs tracking-wider cursor-pointer">{v.replace('meta_', '').replace('og_', 'OG ').replace(/_/g, ' ').toUpperCase()}</span> },
  { key: "value", label: "Content Details", render: (v) => <span className="text-sm text-slate-600 block truncate max-w-xs cursor-pointer" title={String(v ?? "")}>{clip(v, 60)}</span> },
  { key: "group", label: "Group", render: (v) => <span className="capitalize text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">{v || 'General'}</span> },
  statusCol(),
];
const settingsFields = [
  { key: "key", label: "Config Key (e.g. meta_title)", required: true, placeholder: "e.g., meta_title, meta_description, og_image_url" },
  { key: "value", label: "Content Value", type: "textarea", required: true, placeholder: "Enter the content..." },
  { key: "setting_type", label: "Format Type", type: "select", required: true, options: [
    { value: "text", label: "Short Text" },
    { value: "textarea", label: "Long Description" },
    { value: "url", label: "URL / Image Link" },
  ]},
  { key: "group", label: "Category Group", placeholder: "e.g. SEO, Social" },
  activeField,
];

/* ─── Tab Config Map ─────────────────────────────────────────── */
const TAB_CONFIG = {
  hero:        { service: heroBannersService,      columns: heroColumns,       fields: heroFields,       boolFields: ["is_active"] },
  offers:      { service: offerBannersService,     columns: offerColumns,      fields: offerFields,      boolFields: ["is_active"] },
  horizontal:  { service: horizontalBannersService,columns: horizontalColumns, fields: horizontalFields, boolFields: ["is_active"] },
  offerCats:   { service: offerCategoriesService,  columns: offerCatColumns,   fields: offerCatFields,   boolFields: ["is_active", "is_featured"] },
  navbar:      { service: navbarService,           columns: navbarColumns,     fields: navbarFields,     boolFields: ["is_active", "show_in_mobile", "show_in_desktop"] },
  blog:        { service: blogPostsService,        columns: blogColumns,       fields: blogFields,       boolFields: ["is_active", "is_featured"] },
  footer:      { service: footerSectionsService,   columns: footerColumns,     fields: footerFields,     boolFields: ["is_active"] },
  footerLinks: { service: footerLinksService,      columns: footerLinkColumns, fields: footerLinkFields, boolFields: ["is_active", "open_in_new_tab"] },
  social:      { service: socialLinksService,      columns: socialColumns,     fields: socialFields,     boolFields: ["is_active"] },
  settings:    { service: siteSettingsService,     columns: settingsColumns,   fields: settingsFields,   boolFields: ["is_active"], defaultParams: { group: "meta" } },
};

/* ─── Custom Footer Form ─────────────────────────────────────── */
function FooterForm() {
  const router = useRouter();
  const toast = useToastContext();
  const [data, setData] = useState({
    brand_tagline: { id: null, value: "" },
    contact_email: { id: null, value: "" },
    contact_phone: { id: null, value: "" },
    contact_address: { id: null, value: "" },
    footer_logo_url: { id: null, value: "", file: null },
    developed_by_name: { id: null, value: "" },
    developed_by_url: { id: null, value: "" },
    quick_links_text: { id: null, value: "" },
  });

  const [quickLinks, setQuickLinks] = useState([{ label: "", url: "" }]);
  const [paymentImages, setPaymentImages] = useState([]);
  const [deletedPaymentImages, setDeletedPaymentImages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      let items = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const res = await siteSettingsService.list({ page });
        const resItems = res?.results || res || [];
        items = [...items, ...resItems];
        if (!res?.next) hasMore = false;
        else page++;
      }

      const newData = {
        brand_tagline: { id: null, value: "" },
        contact_email: { id: null, value: "" },
        contact_phone: { id: null, value: "" },
        contact_address: { id: null, value: "" },
        footer_logo_url: { id: null, value: "" },
        developed_by_name: { id: null, value: "" },
        developed_by_url: { id: null, value: "" },
        we_accept_text: { id: null, value: "" },
        quick_links_text: { id: null, value: "" },
      };
      
      const pmItems = items.filter(item => item.group === 'footer_payment_methods');
      setPaymentImages(pmItems.map(item => ({
        id: item.id,
        key: item.key,
        value: item.image_url || item.value || "",
        file: null
      })));

      items.forEach(item => {
        if (newData[item.key] !== undefined) {
          newData[item.key] = { id: item.id, value: item.image_url || item.value || "", file: null };
        }
      });

      const qText = newData.quick_links_text.value;
      if (qText) {
         const parsed = qText.split(',').map(l => {
           const [label, url] = l.split(':').map(s => s?.trim());
           return { label: label || '', url: url || '' };
         }).filter(l => l.label);
         if (parsed.length > 0) setQuickLinks(parsed);
      }

      setData(newData);
    } catch (e) {
      toast.error("Failed to load footer settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, val) => {
    setData(prev => ({ ...prev, [key]: { ...prev[key], value: val } }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const qText = quickLinks.filter(q => q.label && q.url).map(q => `${q.label}:${q.url}`).join(', ');
      
      const payload = {
        ...data,
        quick_links_text: { ...data.quick_links_text, value: qText },
      };

      for (const [key, item] of Object.entries(payload)) {
        if (item.file) {
          const fd = new FormData();
          fd.append('image', item.file);
          if (!item.id) {
              fd.append('key', key);
              fd.append('group', 'footer');
              fd.append('setting_type', 'url');
              fd.append('is_active', 'true');
          }
          if (item.id) {
            await siteSettingsService.patch(item.id, fd);
          } else {
            await siteSettingsService.create(fd);
          }
        } else {
          if (item.id) {
            await siteSettingsService.patch(item.id, { value: item.value });
          } else if (item.value) {
            await siteSettingsService.create({ key, value: item.value, setting_type: key.includes('url') ? 'url' : 'text', group: 'footer' });
          }
        }
      }

      for (const pm of paymentImages) {
        if (pm.file) {
          const fd = new FormData();
          fd.append('image', pm.file);
          if (!pm.id) {
             fd.append('key', pm.key || `payment_method_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`);
             fd.append('group', 'footer_payment_methods');
             fd.append('setting_type', 'url');
             fd.append('is_active', 'true');
          }
          if (pm.id) {
            await siteSettingsService.patch(pm.id, fd);
          } else {
            await siteSettingsService.create(fd);
          }
        }
      }

      for (const delId of deletedPaymentImages) {
        await siteSettingsService.delete(delId);
      }
      setDeletedPaymentImages([]);

      toast.success("Footer saved successfully");
      fetchData();
      router.refresh();
    } catch (e) {
      toast.error("Failed to save footer");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading footer data...</div>;

  return (
    <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-3xl">
      <div className="p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 cursor-pointer">Description / Brand Tagline</label>
          <textarea value={data.brand_tagline.value} onChange={(e) => handleChange("brand_tagline", e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" rows={2} placeholder="e.g., Rooted in quality..." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 cursor-pointer">Contact Email</label>
            <input type="email" value={data.contact_email.value} onChange={(e) => handleChange("contact_email", e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" placeholder="e.g., hello@elarbol.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 cursor-pointer">Contact Phone</label>
            <input type="text" value={data.contact_phone.value} onChange={(e) => handleChange("contact_phone", e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" placeholder="e.g., +34 900 123 456" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 cursor-pointer">Contact Address</label>
          <textarea value={data.contact_address.value} onChange={(e) => handleChange("contact_address", e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" rows={2} placeholder="e.g., Calle de la Huertas 12, Madrid" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Footer Logo Upload */}
          <div className="flex flex-col">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Footer Logo Image</label>
            <div className="relative flex-1 min-h-[120px] border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden group transition-all bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center cursor-pointer p-4">
              {data.footer_logo_url.value ? (
                <div className="flex flex-col items-center gap-2 w-full">
                  <img src={data.footer_logo_url.value} alt="Footer Logo Preview" className="h-14 object-contain bg-[#00694C]/5 p-2 rounded-lg" />
                  <span className="text-[10px] text-slate-500 font-medium px-2 py-1 bg-white rounded-md shadow-sm">Click to change</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-slate-600 transition-colors">
                  <UploadCloud className="w-7 h-7" />
                  <span className="text-xs font-medium">Upload Logo</span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setData(prev => ({ ...prev, footer_logo_url: { ...prev.footer_logo_url, value: URL.createObjectURL(file), file } }));
                  }
                }} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                title="Upload Footer Logo"
              />
            </div>
          </div>

          {/* Payment Methods Upload */}
          <div className="flex flex-col">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Payment Methods Images</label>
            <div className="flex flex-wrap gap-4">
              {paymentImages.map((pm, i) => (
                <div key={pm.id || i} className="relative w-28 h-20 border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden group transition-all bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center cursor-pointer p-2 shadow-sm">
                  {pm.value ? (
                    <img src={pm.value} alt="Payment Method Preview" className="h-full object-contain" />
                  ) : (
                    <UploadCloud className="w-6 h-6 text-slate-400" />
                  )}
                  <button type="button" onClick={(e) => {
                    e.preventDefault();
                    if (pm.id) setDeletedPaymentImages(prev => [...prev, pm.id]);
                    setPaymentImages(prev => prev.filter((_, idx) => idx !== i));
                  }} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity z-10" title="Remove image">
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const newPm = [...paymentImages];
                      newPm[i] = { ...newPm[i], value: URL.createObjectURL(file), file };
                      setPaymentImages(newPm);
                    }
                  }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Change Image" />
                </div>
              ))}
              <div className="relative w-28 h-20 border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden group transition-all bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center cursor-pointer shadow-sm">
                <Plus className="w-8 h-8 text-slate-400 group-hover:text-slate-600 transition-colors" />
                <span className="text-[10px] font-medium text-slate-500 mt-1">Add Image</span>
                <button type="button" onClick={() => setPaymentImages(prev => [...prev, { id: null, key: '', value: '', file: null }])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Add Payment Method" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Quick Links</label>
          <div className="space-y-2">
            {quickLinks.map((q, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="text" value={q.label} onChange={(e) => { const newQ = [...quickLinks]; newQ[i].label = e.target.value; setQuickLinks(newQ); }} className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" placeholder="Label (e.g., Shop All)" />
                <input type="text" value={q.url} onChange={(e) => { const newQ = [...quickLinks]; newQ[i].url = e.target.value; setQuickLinks(newQ); }} className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" placeholder="URL (e.g., /shop)" />
                <button type="button" onClick={() => setQuickLinks(quickLinks.filter((_, idx) => idx !== i))} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button type="button" onClick={() => setQuickLinks([...quickLinks, { label: "", url: "" }])} className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 mt-2"><Plus className="w-3 h-3" /> Add Quick Link</button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 cursor-pointer">Developer Company Name</label>
            <input type="text" value={data.developed_by_name.value} onChange={(e) => handleChange("developed_by_name", e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" placeholder="e.g., Intelligent Systems Ltd" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 cursor-pointer">Developer Website URL</label>
            <input type="text" value={data.developed_by_url.value} onChange={(e) => handleChange("developed_by_url", e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" placeholder="e.g., https://www.intelligentsystemsltd.com/" />
          </div>
        </div>
      </div>
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
        <button type="submit" disabled={saving} className="px-4 py-2 bg-[#00694C] text-white rounded-md text-sm font-medium hover:bg-[#085041] disabled:opacity-50 cursor-pointer">
          {saving ? "Saving..." : "Save Footer"}
        </button>
      </div>
    </form>
  );
}

/* ─── Custom Meta Config Form ───────────────────────────────── */
function MetaConfigForm() {
  const router = useRouter();
  const toast = useToastContext();
  const [data, setData] = useState({
    meta_title: { id: null, value: "" },
    meta_description: { id: null, value: "" },
    meta_keywords: { id: null, value: "" },
    og_title: { id: null, value: "" },
    og_description: { id: null, value: "" },
    og_image_url: { id: null, value: "", file: null },
    favicon_url: { id: null, value: "", file: null },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      let items = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const res = await siteSettingsService.list({ page, group: "meta" });
        const resItems = res?.results || res || [];
        items = [...items, ...resItems];
        if (!res?.next) hasMore = false;
        else page++;
      }

      const newData = {
        meta_title: { id: null, value: "" },
        meta_description: { id: null, value: "" },
        meta_keywords: { id: null, value: "" },
        og_title: { id: null, value: "" },
        og_description: { id: null, value: "" },
        og_image_url: { id: null, value: "", file: null },
        favicon_url: { id: null, value: "", file: null },
      };
      
      items.forEach(item => {
        if (newData[item.key] !== undefined) {
          newData[item.key] = { id: item.id, value: item.image_url || item.value || "", file: null };
        }
      });

      setData(newData);
    } catch (e) {
      toast.error("Failed to load meta settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, val) => {
    setData(prev => ({ ...prev, [key]: { ...prev[key], value: val } }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      for (const [key, item] of Object.entries(data)) {
        if (item.file) {
          const fd = new FormData();
          fd.append('image', item.file);
          if (!item.id) {
              fd.append('key', key);
              fd.append('group', 'meta');
              fd.append('setting_type', 'url');
              fd.append('is_active', 'true');
          }
          if (item.id) {
            await siteSettingsService.patch(item.id, fd);
          } else {
            await siteSettingsService.create(fd);
          }
        } else {
          if (item.id) {
            await siteSettingsService.patch(item.id, { value: item.value });
          } else if (item.value) {
            await siteSettingsService.create({ key, value: item.value, setting_type: key.includes('url') ? 'url' : 'text', group: 'meta', is_active: true });
          }
        }
      }

      toast.success("Meta config saved successfully");
      fetchData();
      router.refresh();
    } catch (e) {
      toast.error("Failed to save meta config");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading meta data...</div>;

  return (
    <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-3xl">
      <div className="p-6 space-y-6">
        
        {/* Basic SEO */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-500" /> Basic SEO
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 cursor-pointer">Meta Title</label>
              <input type="text" value={data.meta_title.value} onChange={(e) => handleChange("meta_title", e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" placeholder="e.g., El Árbol - Premium Fruits" />
              <p className="text-[10px] text-slate-500 mt-1">Recommended length: 50-60 characters</p>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 cursor-pointer">Meta Description</label>
              <textarea value={data.meta_description.value} onChange={(e) => handleChange("meta_description", e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" rows={3} placeholder="e.g., Artisan produce delivered with care..." />
              <p className="text-[10px] text-slate-500 mt-1">Recommended length: 150-160 characters</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 cursor-pointer">Meta Keywords</label>
              <input type="text" value={data.meta_keywords.value} onChange={(e) => handleChange("meta_keywords", e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" placeholder="e.g., organic, fruits, delivery" />
              <p className="text-[10px] text-slate-500 mt-1">Comma-separated list of keywords</p>
            </div>
          </div>
        </div>

        {/* Social Graph / Open Graph */}
        <div className="pt-2">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-slate-500" /> Social Sharing (Open Graph)
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 cursor-pointer">OG Title</label>
              <input type="text" value={data.og_title.value} onChange={(e) => handleChange("og_title", e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" placeholder="e.g., El Árbol - Premium Wholesale Fruits" />
              <p className="text-[10px] text-slate-500 mt-1">Title displayed when sharing on Facebook/Twitter</p>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 cursor-pointer">OG Description</label>
              <textarea value={data.og_description.value} onChange={(e) => handleChange("og_description", e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" rows={2} placeholder="e.g., Artisan produce, delivered with care from local farmers." />
            </div>

            <div className="flex flex-col">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">OG Image (Preview Image)</label>
              <div className="relative w-full min-h-[160px] border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden group transition-all bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center cursor-pointer p-4">
                {data.og_image_url.value ? (
                  <div className="flex flex-col items-center gap-2 w-full">
                    <img src={data.og_image_url.value} alt="OG Image Preview" className="h-24 object-cover bg-[#00694C]/5 rounded-lg shadow-sm" />
                    <span className="text-[10px] text-slate-500 font-medium px-2 py-1 bg-white rounded-md shadow-sm">Click to change</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-slate-600 transition-colors">
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-xs font-medium">Upload OG Image</span>
                    <span className="text-[10px]">Recommended: 1200x630px</span>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setData(prev => ({ ...prev, og_image_url: { ...prev.og_image_url, value: URL.createObjectURL(file), file } }));
                    }
                  }} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  title="Upload OG Image"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Favicon Settings */}
        <div className="pt-2">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-slate-500" /> Site Favicon
          </h3>
          <div className="space-y-4">
            <div className="flex flex-col">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Favicon Image</label>
              <div className="relative w-32 h-32 border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden group transition-all bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center cursor-pointer p-4">
                {data.favicon_url?.value ? (
                  <div className="flex flex-col items-center gap-2 w-full">
                    <img src={data.favicon_url.value} alt="Favicon Preview" className="h-12 w-12 object-contain bg-[#00694C]/5 rounded-lg shadow-sm" />
                    <span className="text-[10px] text-slate-500 font-medium px-2 py-1 bg-white rounded-md shadow-sm">Click to change</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-slate-600 transition-colors">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-[10px] font-medium text-center">Upload Favicon</span>
                    <span className="text-[9px] text-center">32x32px .ico/.png</span>
                  </div>
                )}
                <input 
                  type="file" 
                  accept=".ico,.png,image/png,image/x-icon" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setData(prev => ({ ...prev, favicon_url: { ...prev.favicon_url, value: URL.createObjectURL(file), file } }));
                    }
                  }} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  title="Upload Favicon"
                />
              </div>
            </div>
          </div>
        </div>

        
      </div>
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
        <button type="submit" disabled={saving} className="px-4 py-2 bg-[#00694C] text-white rounded-md text-sm font-medium hover:bg-[#085041] disabled:opacity-50 cursor-pointer">
          {saving ? "Saving..." : "Save Meta Config"}
        </button>
      </div>
    </form>
  );
}

/* ─── Custom Navbar Config Form ───────────────────────────────── */
function NavbarConfigForm() {
  const router = useRouter();
  const toast = useToastContext();
  const [data, setData] = useState({
    brand_name: { id: null, value: "" },
    navbar_logo_url: { id: null, value: "", file: null },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      let items = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const res = await siteSettingsService.list({ page, group: "navbar" });
        const resItems = res?.results || res || [];
        items = [...items, ...resItems];
        if (!res?.next) hasMore = false;
        else page++;
      }

      const newData = {
        brand_name: { id: null, value: "" },
        navbar_logo_url: { id: null, value: "", file: null },
      };
      
      items.forEach(item => {
        if (newData[item.key] !== undefined) {
          newData[item.key] = { id: item.id, value: item.image_url || item.value || "", file: null };
        }
      });

      setData(newData);
    } catch (e) {
      toast.error("Failed to load navbar settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, val) => {
    setData(prev => ({ ...prev, [key]: { ...prev[key], value: val } }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      for (const [key, item] of Object.entries(data)) {
        if (item.file) {
          const fd = new FormData();
          fd.append('image', item.file);
          if (!item.id) {
              fd.append('key', key);
              fd.append('group', 'navbar');
              fd.append('setting_type', 'url');
              fd.append('is_active', 'true');
          }
          if (item.id) {
            await siteSettingsService.patch(item.id, fd);
          } else {
            await siteSettingsService.create(fd);
          }
        } else {
          if (item.id) {
            await siteSettingsService.patch(item.id, { value: item.value });
          } else if (item.value) {
            await siteSettingsService.create({ key, value: item.value, setting_type: key.includes('url') ? 'url' : 'text', group: 'navbar', is_active: true });
          }
        }
      }

      toast.success("Navbar config saved successfully");
      fetchData();
      router.refresh();
    } catch (e) {
      toast.error("Failed to save navbar config");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading navbar data...</div>;

  return (
    <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-3xl">
      <div className="p-6 space-y-6">
        
        {/* Brand Details */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-500" /> Brand Identity
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 cursor-pointer">Brand Name</label>
              <input type="text" value={data.brand_name.value} onChange={(e) => handleChange("brand_name", e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" placeholder="e.g., El Árbol" />
            </div>

            <div className="flex flex-col">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Navbar Logo</label>
              <div className="relative w-full min-h-[160px] border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden group transition-all bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center cursor-pointer p-4">
                {data.navbar_logo_url.value ? (
                  <div className="flex flex-col items-center gap-2 w-full">
                    <img src={data.navbar_logo_url.value} alt="Navbar Logo Preview" className="h-24 object-contain bg-[#00694C]/5 rounded-lg shadow-sm px-4" />
                    <span className="text-[10px] text-slate-500 font-medium px-2 py-1 bg-white rounded-md shadow-sm">Click to change</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-slate-600 transition-colors">
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-xs font-medium">Upload Logo</span>
                    <span className="text-[10px]">Recommended: Transparent PNG</span>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setData(prev => ({ ...prev, navbar_logo_url: { ...prev.navbar_logo_url, value: URL.createObjectURL(file), file } }));
                    }
                  }} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  title="Upload Navbar Logo"
                />
              </div>
            </div>
          </div>
        </div>
        
      </div>
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
        <button type="submit" disabled={saving} className="px-4 py-2 bg-[#00694C] text-white rounded-md text-sm font-medium hover:bg-[#085041] disabled:opacity-50 cursor-pointer">
          {saving ? "Saving..." : "Save Navbar Config"}
        </button>
      </div>
    </form>
  );
}

/* ─── Custom Catalog Config Form ───────────────────────────────── */
function CatalogConfigForm() {
  const router = useRouter();
  const toast = useToastContext();
  const [data, setData] = useState({
    product_classes: { id: null, value: "" },
  });
  const [classesList, setClassesList] = useState([]);
  const [newClass, setNewClass] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      let items = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const res = await siteSettingsService.list({ page, group: "catalog" });
        const resItems = res?.results || res || [];
        items = [...items, ...resItems];
        if (!res?.next) hasMore = false;
        else page++;
      }

      const newData = {
        product_classes: { id: null, value: "" },
      };
      
      let fetchedClassesStr = "";
      items.forEach(item => {
        if (newData[item.key] !== undefined) {
          newData[item.key] = { id: item.id, value: item.value || "", file: null };
          if (item.key === 'product_classes') {
            fetchedClassesStr = item.value || "";
          }
        }
      });

      setData(newData);
      setClassesList(fetchedClassesStr.split(',').map(s => s.trim()).filter(Boolean));
    } catch (e) {
      toast.error("Failed to load catalog settings");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async () => {
    const trimmed = newClass.trim();
    if (!trimmed) return;
    if (classesList.includes(trimmed)) {
      toast.error("This class already exists.");
      return;
    }
    const newClasses = [...classesList, trimmed];
    setClassesList(newClasses);
    setNewClass("");

    // Auto-save on add
    try {
      const finalValue = newClasses.join(', ');
      const updatedData = { ...data };
      updatedData.product_classes = { ...data.product_classes, value: finalValue };
      
      for (const [key, item] of Object.entries(updatedData)) {
        if (item.id) {
          await siteSettingsService.patch(item.id, { value: item.value });
        } else if (item.value) {
          await siteSettingsService.create({ key, value: item.value, setting_type: 'text', group: 'catalog', is_active: true });
        }
      }
      toast.success("Class added successfully");
      fetchData();
      router.refresh();
    } catch (e) {
      toast.error("Failed to add class");
    }
  };

  const handleRemoveClass = async (indexToRemove) => {
    const newClasses = classesList.filter((_, i) => i !== indexToRemove);
    setClassesList(newClasses);
    
    // Auto-save on remove
    try {
      const finalValue = newClasses.join(', ');
      const updatedData = { ...data };
      updatedData.product_classes = { ...data.product_classes, value: finalValue };
      
      for (const [key, item] of Object.entries(updatedData)) {
        if (item.id) {
          await siteSettingsService.patch(item.id, { value: item.value });
        } else if (item.value) {
          await siteSettingsService.create({ key, value: item.value, setting_type: 'text', group: 'catalog', is_active: true });
        }
      }
      toast.success("Class removed successfully");
      fetchData();
      router.refresh();
    } catch (e) {
      toast.error("Failed to remove class");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Update data with the new comma-separated string
    let currentClasses = [...classesList];
    const trimmed = newClass.trim();
    if (trimmed && !currentClasses.includes(trimmed)) {
      currentClasses.push(trimmed);
      setClassesList(currentClasses);
      setNewClass("");
    }
    
    const finalValue = currentClasses.join(', ');
    const updatedData = { ...data };
    updatedData.product_classes = { ...data.product_classes, value: finalValue };
    
    try {
      for (const [key, item] of Object.entries(updatedData)) {
        if (item.id) {
          await siteSettingsService.patch(item.id, { value: item.value });
        } else if (item.value) {
          await siteSettingsService.create({ key, value: item.value, setting_type: 'text', group: 'catalog', is_active: true });
        }
      }
      toast.success("Catalog config saved successfully");
      fetchData();
      router.refresh();
    } catch (e) {
      toast.error("Failed to save catalog config");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading catalog data...</div>;

  return (
    <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-3xl">
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
            Catalog Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 cursor-pointer">Product Quality Classes</label>
              
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={newClass} 
                  onChange={(e) => setNewClass(e.target.value)} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddClass();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" 
                  placeholder="e.g., Class A, Premium..." 
                />
                <button 
                  type="button" 
                  onClick={handleAddClass}
                  className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Add Class
                </button>
              </div>

              {classesList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {classesList.map((cls, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-sm font-medium">
                      <span>{cls}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveClass(i)}
                        className="text-emerald-600 hover:text-emerald-900 focus:outline-none cursor-pointer"
                        title="Remove class"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No classes added yet. Add one above.</p>
              )}
              
              <p className="text-[10px] text-slate-500 mt-3">These quality classes will be available for selection when creating or filtering products.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
        <button type="submit" disabled={saving} className="px-4 py-2 bg-[#00694C] text-white rounded-md text-sm font-medium hover:bg-[#085041] disabled:opacity-50 cursor-pointer">
          {saving ? "Saving..." : "Save Catalog Config"}
        </button>
      </div>
    </form>
  );
}

/* ─── Generic Tab Table ──────────────────────────────────────── */
function TabTable({ service, columns, formFields, lookupField = "id", boolFields = ["is_active"], defaultParams = {} }) {
  const router = useRouter();
  const toast = useToastContext();
  const { data, totalCount, loading, params, setSearch, setPage, create, patch, remove } = useModel(service, { 
    defaultParams: { ...defaultParams, pageSize: PAGE_SIZE } 
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const castBools = (values) => {
    const out = { ...values };
    boolFields.forEach((k) => { if (k in out) out[k] = out[k] === "true"; });
    return out;
  };

  const initBools = (item) => {
    const out = { ...item };
    boolFields.forEach((k) => { if (k in out) out[k] = String(out[k]); });
    return out;
  };

  const handleCreate = async (values) => {
    try { await create(castBools(values)); toast.success("Created successfully"); setCreateOpen(false); router.refresh(); } catch (e) { toast.error(e?.message || "Create failed"); }
  };
  const handleEdit = async (values) => {
    try { await patch(editItem[lookupField], castBools(values)); toast.success("Updated successfully"); setEditItem(null); router.refresh(); } catch (e) { toast.error(e?.message || "Update failed"); }
  };
  const handleDelete = async () => {
    try { await remove(deleteItem[lookupField]); toast.success("Deleted successfully"); setDeleteItem(null); router.refresh(); } catch (e) { toast.error(e?.message || "Delete failed"); }
  };

  return (
    <>
      <div className="flex justify-end mb-3">
        <button onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] transition-colors">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      <DataTable
        columns={columns}
        data={data}
        serverSide
        totalItems={totalCount}
        currentPage={params.page}
        pageSize={PAGE_SIZE}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        onPageChange={setPage}
        loading={loading}
        searchable
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => setViewItem(row)} className="db-icon-btn"><Eye className="w-3.5 h-3.5" /></button>
            <button onClick={() => setEditItem(row)} className="db-icon-btn"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => setDeleteItem(row)} className="db-icon-btn danger"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        )}
      />
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Item">
        <FormModal fields={formFields} onSubmit={handleCreate} submitLabel="Create" />
      </Modal>
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Item">
        {editItem && <FormModal fields={formFields} initialValues={initBools(editItem)} onSubmit={handleEdit} submitLabel="Save" />}
      </Modal>
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Details">
        {viewItem && (
          <div className="space-y-3">
            {Object.entries(viewItem).filter(([k]) => !["id", "image", "image_url_final"].includes(k)).map(([key, val]) => (
              <div key={key} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-500 capitalize">{key.replace(/_/g, " ")}</span>
                <span className="text-sm font-medium text-slate-800 max-w-[60%] text-right truncate">{typeof val === "object" ? JSON.stringify(val) : String(val ?? "—")}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Delete" message="Are you sure you want to delete this item? This action cannot be undone." />
    </>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function WebsitePage() {
  const [activeTab, setActiveTab] = useState("settings");
  const cfg = TAB_CONFIG[activeTab];

  return (
    <Container title="Site Configuration" description="Manage banners, navigation, footer, blog, and meta configs">
      <div className="flex gap-4 overflow-x-auto border-b border-slate-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-semibold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "footer" ? (
        <FooterForm />
      ) : activeTab === "settings" ? (
        <MetaConfigForm />
      ) : activeTab === "navbar" ? (
        <NavbarConfigForm />
      ) : activeTab === "catalog" ? (
        <CatalogConfigForm />
      ) : (
        <TabTable
          key={activeTab}
          service={cfg.service}
          columns={cfg.columns}
          formFields={cfg.fields}
          boolFields={cfg.boolFields}
          defaultParams={cfg.defaultParams || {}}
        />
      )}
    </Container>
  );
}

