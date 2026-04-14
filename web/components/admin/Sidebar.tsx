"use client";

import React from "react";
import { 
  BarChart3, 
  Users, 
  ShieldCheck, 
  LayoutDashboard, 
  FileClock, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Layout
} from "lucide-react";

export type AdminView = "overview" | "users" | "moderation" | "templates" | "logs" | "settings";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
}

function SidebarItem({ icon, label, active, onClick, collapsed }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
        active 
          ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <div className={`flex shrink-0 items-center justify-center transition-transform duration-200 ${active ? "scale-110" : "group-hover:scale-110"}`}>
        {icon}
      </div>
      {!collapsed && (
        <span className="text-sm font-medium tracking-tight whitespace-nowrap opacity-100 transition-opacity duration-300">
          {label}
        </span>
      )}
    </button>
  );
}

interface AdminSidebarProps {
  activeView: AdminView;
  setActiveView: (view: AdminView) => void;
  onSignOut: () => void;
  onBackToProjects: () => void;
}

export function AdminSidebar({ activeView, setActiveView, onSignOut, onBackToProjects }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  const menuItems: { id: AdminView; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={20} /> },
    { id: "users", label: "Users", icon: <Users size={20} /> },
    { id: "moderation", label: "Moderation", icon: <ShieldCheck size={20} /> },
    { id: "templates", label: "Templates", icon: <Layout size={20} /> },
    { id: "logs", label: "Activity Logs", icon: <FileClock size={20} /> },
    { id: "settings", label: "Settings", icon: <Settings size={20} /> },
  ];

  return (
    <aside 
      className={`flex h-screen flex-col border-r border-slate-200 bg-white/80 backdrop-blur-md transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex h-20 items-center justify-between px-6">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <span className="text-lg font-bold text-white">D</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">DesignH</span>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-900"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeView === item.id}
            onClick={() => setActiveView(item.id)}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div className="border-t border-slate-100 p-4 space-y-1">
        <SidebarItem
          icon={<BarChart3 size={20} />}
          label="Back to Projects"
          active={false}
          onClick={onBackToProjects}
          collapsed={collapsed}
        />
        <SidebarItem
          icon={<LogOut size={20} />}
          label="Sign out"
          active={false}
          onClick={onSignOut}
          collapsed={collapsed}
        />
      </div>
    </aside>
  );
}
