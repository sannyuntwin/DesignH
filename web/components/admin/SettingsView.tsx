"use client";

import React, { useState } from "react";
import { Save, ShieldCheck, Globe, Cpu, Mail, Trash2 } from "lucide-react";
import { readAuthSession } from "@/lib/auth-session";

interface AdminSettings {
  admin_emails: string;
  debug_mode: boolean;
  app_name: string;
  cors_origins: string;
  log_retention_days?: number;
}

export function SettingsView({ settings: initialSettings }: { settings: AdminSettings }) {
  const [settings, setSettings] = useState<AdminSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSave = async () => {
    const session = readAuthSession();
    if (!session) return;

    setIsSaving(true);
    setSaveStatus(null);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${base}/api/admin/settings`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}` 
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSaveStatus("Settings saved successfully!");
      } else {
        setSaveStatus("Failed to save settings.");
      }
    } catch (e) {
      setSaveStatus("Error saving settings.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">System Settings</h2>
          <p className="mt-1 text-sm text-slate-500">Global configuration for the Design Editor platform.</p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus && (
            <span className={`text-xs font-semibold ${saveStatus.includes("success") ? "text-emerald-600" : "text-rose-600"}`}>
               {saveStatus}
            </span>
          )}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
          >
            <Save size={18} />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </header>

      <div className="grid gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
             <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <ShieldCheck size={20} />
             </div>
             <div>
                <h3 className="font-semibold text-slate-900">Access Control</h3>
                <p className="text-xs text-slate-500">Manage administrator access levels.</p>
             </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
               <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Mail size={14} className="text-slate-400" />
                  Admin Emails
               </label>
               <input 
                 type="text" 
                 value={settings.admin_emails}
                 onChange={(e) => setSettings({ ...settings, admin_emails: e.target.value })}
                 className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none ring-indigo-500/20 focus:ring-4 focus:border-indigo-500 transition-all"
                 placeholder="admin@example.com, developer@example.com"
               />
               <p className="text-[10px] text-slate-400">Comma-separated list of emails that have full system permissions.</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
             <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                <Trash2 size={20} />
             </div>
             <div>
                <h3 className="font-semibold text-slate-900">Log Management</h3>
                <p className="text-xs text-slate-500">Control activity log retention and cleanup.</p>
             </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
               <label className="text-sm font-semibold text-slate-700">Log Retention (Days)</label>
               <input 
                 type="number" 
                 value={settings.log_retention_days || 30}
                 onChange={(e) => setSettings({ ...settings, log_retention_days: parseInt(e.target.value) })}
                 className="w-full max-w-[200px] rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none ring-rose-500/20 focus:ring-4 focus:border-rose-500 transition-all"
               />
               <p className="text-[10px] text-slate-400">Number of days to keep audit logs before they are automatically purged.</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
             <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <Globe size={20} />
             </div>
             <div>
                <h3 className="font-semibold text-slate-900">Network & API</h3>
                <p className="text-xs text-slate-500">Manage external connections and security.</p>
             </div>
          </div>
          
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
               <label className="text-sm font-semibold text-slate-700">App Name</label>
               <input 
                 type="text" 
                 value={settings.app_name}
                 onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                 className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none ring-indigo-500/20 focus:ring-4 focus:border-indigo-500 transition-all"
               />
            </div>
            <div className="space-y-2">
               <label className="text-sm font-semibold text-slate-700">CORS Origins</label>
               <input 
                 type="text" 
                 value={settings.cors_origins}
                 onChange={(e) => setSettings({ ...settings, cors_origins: e.target.value })}
                 className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none ring-indigo-500/20 focus:ring-4 focus:border-indigo-500 transition-all"
               />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
             <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <Cpu size={20} />
             </div>
             <div>
                <h3 className="font-semibold text-slate-900">Debug & Environment</h3>
                <p className="text-xs text-slate-500">System-level developer flags.</p>
             </div>
          </div>
          
          <div className="mt-6 flex items-center justify-between">
             <div>
                <h4 className="text-sm font-semibold text-slate-900">Debug Mode</h4>
                <p className="text-xs text-slate-500">Enable verbose logging and stack traces.</p>
             </div>
             <button 
               onClick={() => setSettings({ ...settings, debug_mode: !settings.debug_mode })}
               className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.debug_mode ? "bg-slate-900" : "bg-slate-200"
             }`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.debug_mode ? "translate-x-5" : "translate-x-0"
                }`} />
             </button>
          </div>
        </section>
      </div>
    </div>
  );
}
