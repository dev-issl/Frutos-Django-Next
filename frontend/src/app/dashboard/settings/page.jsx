"use client";

import { useState, useEffect } from "react";
import { Save, Store, Globe, Bell, Shield, Palette, Mail, Loader2 } from "lucide-react";
import Container from "@/app/dashboard/_components/Container";
import SearchableSelect from "@/app/dashboard/_components/SearchableSelect";
import { useToastContext } from "@/app/dashboard/_components/Toaster";
import useSWR from "swr";
import { siteSettingsService } from "@/app/dashboard/_lib/services";
import { api } from "@/app/dashboard/_lib/api";

const tabs = [
  { id: "general", label: "General", icon: Store },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "email", label: "Email", icon: Mail },
  { id: "seo", label: "SEO", icon: Globe },
];

export default function SettingsPage() {
  const toast = useToastContext();
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState({});

  const { data: rawSettings, isLoading, mutate } = useSWR(
    "site-settings",
    () => siteSettingsService.list({ page_size: 100 }),
    { revalidateOnFocus: false }
  );

  const settings = rawSettings?.results || rawSettings || [];

  // Build a key→value map from the settings list
  useEffect(() => {
    if (settings.length > 0) {
      const map = {};
      settings.forEach((s) => { map[s.key] = s.value; });
      setLocalSettings(map);
    }
  }, [settings]);

  const getSetting = (key, fallback = "") => localSettings[key] ?? fallback;
  const setSetting = (key, value) => setLocalSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update each changed setting
      const updates = Object.entries(localSettings).map(([key, value]) => {
        const existing = settings.find((s) => s.key === key);
        if (existing) {
          return siteSettingsService.patch(existing.id, { value });
        }
        return siteSettingsService.create({ key, value, setting_type: "text" });
      });
      await Promise.all(updates);
      toast.success("Settings saved");
      mutate();
    } catch (err) {
      toast.error(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const form = e.target;
    const oldPw = form.current_password.value;
    const newPw = form.new_password.value;
    if (!oldPw || !newPw) return;
    try {
      await api.post("/api/auth/change-password/", { old_password: oldPw, new_password: newPw });
      toast.success("Password changed");
      form.reset();
    } catch (err) {
      toast.error(err?.message || "Password change failed");
    }
  };

  if (isLoading) {
    return (
      <Container title="Settings" description="Configure your store">
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      </Container>
    );
  }

  return (
    <Container title="Settings" description="Configure your store">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Tabs */}
        <div className="lg:w-48 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "bg-[#00694C] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white border border-slate-200 rounded-lg p-5">
          {activeTab === "general" && (
            <div className="space-y-5">
              <h3 className="text-sm font-medium text-slate-800">General Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Store Name</label>
                  <input type="text" value={getSetting("store_name", "iCommerce Store")} onChange={(e) => setSetting("store_name", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Store URL</label>
                  <input type="text" value={getSetting("store_url", "")} onChange={(e) => setSetting("store_url", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                  <SearchableSelect
                    value={getSetting("currency", "BDT")}
                    onChange={val => setSetting("currency", val)}
                    options={[
                      { value: "BDT", label: "BDT (৳)" },
                      { value: "USD", label: "USD ($)" },
                      { value: "EUR", label: "EUR (€)" },
                      { value: "GBP", label: "GBP (£)" },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
                  <SearchableSelect
                    value={getSetting("timezone", "BST")}
                    onChange={val => setSetting("timezone", val)}
                    options={[
                      { value: "BST", label: "Bangladesh (BST)" },
                      { value: "UTC", label: "UTC" },
                      { value: "EST", label: "Eastern (EST)" },
                      { value: "PST", label: "Pacific (PST)" },
                    ]}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Store Description</label>
                <textarea rows={3} value={getSetting("store_description", "")} onChange={(e) => setSetting("store_description", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-400 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Store Logo URL</label>
                <input type="url" value={getSetting("logo_url", "")} onChange={(e) => setSetting("logo_url", e.target.value)} placeholder="https://example.com/logo.png" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                {getSetting("logo_url") && (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={getSetting("logo_url")} alt="Logo preview" className="h-10 object-contain border border-slate-200 rounded p-1 bg-white" onError={e => e.target.style.display="none"} />
                    <p className="text-xs text-slate-400">Logo preview</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-5">
              <h3 className="text-sm font-medium text-slate-800">Appearance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Primary Color</p>
                    <p className="text-xs text-slate-500 mt-0.5">Brand color used across the store</p>
                  </div>
                  <input type="color" value={getSetting("primary_color", "#18181b")} onChange={(e) => setSetting("primary_color", e.target.value)} className="w-8 h-8 rounded border border-slate-200 cursor-pointer" />
                </div>
                <div className="flex items-center justify-between py-2 border-t border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Product Grid Columns</p>
                    <p className="text-xs text-slate-500 mt-0.5">Default columns on product listing</p>
                  </div>
                  <SearchableSelect
                    value={getSetting("grid_columns", "4")}
                    onChange={val => setSetting("grid_columns", val)}
                    options={[
                      { value: "3", label: "3" },
                      { value: "4", label: "4" },
                      { value: "5", label: "5" },
                    ]}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-5">
              <h3 className="text-sm font-medium text-slate-800">Notification Preferences</h3>
              {["notify_new_order", "notify_status_change", "notify_low_stock", "notify_new_user", "notify_review"].map((key) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-700 capitalize">{key.replace(/notify_/g, "").replace(/_/g, " ")}</span>
                  <button
                    onClick={() => setSetting(key, getSetting(key, "true") === "true" ? "false" : "true")}
                    className={`w-10 h-6 rounded-full relative transition-colors ${getSetting(key, "true") === "true" ? "bg-gray-900" : "bg-gray-200"}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full transition-all ${getSetting(key, "true") === "true" ? "right-1 bg-white" : "left-1 bg-white"}`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === "security" && (
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <h3 className="text-sm font-medium text-slate-800">Security Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                  <input name="current_password" type="password" placeholder="••••••••" className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                  <input name="new_password" type="password" placeholder="••••••••" className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                </div>
                <button type="submit" className="px-4 py-2 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] transition-colors">
                  Change Password
                </button>
              </div>
            </form>
          )}

          {activeTab === "email" && (
            <div className="space-y-5">
              <h3 className="text-sm font-medium text-slate-800">Email Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Host</label>
                  <input type="text" value={getSetting("smtp_host", "")} onChange={(e) => setSetting("smtp_host", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Port</label>
                  <input type="text" value={getSetting("smtp_port", "")} onChange={(e) => setSetting("smtp_port", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">From Email</label>
                  <input type="email" value={getSetting("from_email", "")} onChange={(e) => setSetting("from_email", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">From Name</label>
                  <input type="text" value={getSetting("from_name", "")} onChange={(e) => setSetting("from_name", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "seo" && (
            <div className="space-y-5">
              <h3 className="text-sm font-medium text-slate-800">SEO Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Meta Title</label>
                  <input type="text" value={getSetting("meta_title", "")} onChange={(e) => setSetting("meta_title", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Meta Description</label>
                  <textarea rows={2} value={getSetting("meta_description", "")} onChange={(e) => setSetting("meta_description", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-400 resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Google Analytics ID</label>
                  <input type="text" value={getSetting("ga_id", "")} onChange={(e) => setSetting("ga_id", e.target.value)} placeholder="G-XXXXXXXXXX" className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                </div>
              </div>
            </div>
          )}

          {/* Save button */}
          {activeTab !== "security" && (
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#00694C] text-white rounded-md hover:bg-[#085041] disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

