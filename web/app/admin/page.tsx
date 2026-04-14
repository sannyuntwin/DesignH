"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuthSession, readAuthSession } from "@/lib/auth-session";
import { 
  fetchAdminOverview, 
  fetchAdminUsers, 
  type AdminOverviewResponse, 
  type AdminUserRecord 
} from "@/lib/admin-api";
import { AdminSidebar, AdminView } from "@/components/admin/Sidebar";
import { OverviewView } from "@/components/admin/OverviewView";
import { UsersView } from "@/components/admin/UsersView";
import { ModerationView } from "@/components/admin/ModerationView";
import { TemplatesView } from "@/components/admin/TemplatesView";
import { LogsView } from "@/components/admin/LogsView";
import { SettingsView } from "@/components/admin/SettingsView";

export default function AdminPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<AdminView>("overview");
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [designs, setDesigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const session = readAuthSession();
      if (!session) {
        router.replace("/signin");
        return;
      }
      if (!session.isAdmin) {
        setIsUnauthorized(true);
        setIsLoading(false);
        return;
      }

      try {
        setError(null);
        // Initial load of overview and users for the first view
        const [overviewData, usersData] = await Promise.all([
          fetchAdminOverview(session.token),
          fetchAdminUsers(session.token, 50),
        ]);
        
        if (!active) return;
        setOverview(overviewData);
        setUsers(usersData.users);
        
        // Populate designs and templates if available
        setDesigns(overviewData.recent_designs || []);
        
        // Fetch supplemental data for other views
        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        try {
           const [tempRes, setRes] = await Promise.all([
              fetch(`${base}/api/admin/templates`, { headers: { Authorization: `Bearer ${session.token}` }}),
              fetch(`${base}/api/admin/settings`, { headers: { Authorization: `Bearer ${session.token}` }})
           ]);
           if (tempRes.ok) {
              const d = await tempRes.json();
              setTemplates(d.templates || []);
           }
           if (setRes.ok) {
              const d = await setRes.json();
              setSettings(d.settings);
           }
        } catch (e) {
           console.log("Supplemental data fetch failed", e);
        }

      } catch (err) {
        if (!active) return;
        const message = err instanceof Error ? err.message : "Failed to load admin dashboard";
        if (message.toLowerCase().includes("admin access required")) {
          setIsUnauthorized(true);
        } else {
          setError(message);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [router]);

  const handleSignOut = () => {
    clearAuthSession();
    router.replace("/signin");
  };

  const handleBackToProjects = () => {
    router.push("/projects");
  };

  if (isUnauthorized) {
    return (
      <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#ffe4e6_0%,#fef3c7_42%,#f8fafc_100%)] px-4 py-10 text-slate-900">
        <section className="w-full max-w-lg rounded-3xl border border-rose-200 bg-white/95 p-8 shadow-xl shadow-rose-100/60">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">Restricted</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Admin Access Required</h1>
          <p className="mt-2 text-sm text-slate-600">Your account does not have permission to view the administrative dashboard.</p>
          <div className="mt-6 flex gap-3">
            <button onClick={handleBackToProjects} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
              Return to Safety
            </button>
            <button onClick={handleSignOut} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Switch Account
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        onSignOut={handleSignOut}
        onBackToProjects={handleBackToProjects}
      />

      <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,#dbeafe_0%,#f8fafc_40%)]">
        <div className="mx-auto w-full max-w-7xl px-8 py-10">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
               <div className="flex items-center gap-3 text-slate-400">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                  <span className="text-sm font-medium">Initializing Dashboard...</span>
               </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
              <p className="text-sm font-semibold text-rose-700">Failed to load dashboard data</p>
              <p className="mt-1 text-xs text-rose-600">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Retry Request
              </button>
            </div>
          ) : (
            <>
              {activeView === "overview" && <OverviewView data={overview!} />}
              {activeView === "users" && <UsersView users={users} />}
              {activeView === "moderation" && <ModerationView designs={designs} />}
              {activeView === "templates" && <TemplatesView templates={templates} />}
              {activeView === "logs" && <LogsView />}
              {activeView === "settings" && <SettingsView settings={settings} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
