"use client";

import React, { useEffect, useState } from "react";
import { Terminal, Clock, User, HardDrive } from "lucide-react";
import { readAuthSession } from "@/lib/auth-session";

interface LogEntry {
  id: string;
  time: string;
  user: string;
  action: string;
  status: string;
  target: string;
  details?: any;
}

export function LogsView() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const session = readAuthSession();
      if (!session) return;

      try {
        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${base}/api/admin/logs?limit=100`, {
          headers: { Authorization: `Bearer ${session.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        }
      } catch (e) {
        console.error("Failed to fetch logs", e);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchLogs();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Activity Logs</h2>
        <p className="mt-1 text-sm text-slate-500">Audit trail of system events and administrative actions.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-slate-900 overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-800/50 px-4 py-2 text-xs font-mono text-slate-400">
          <Terminal size={14} />
          <span>system_audit.log</span>
        </div>
        
        <div className="divide-y divide-slate-800 font-mono text-xs max-h-[600px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-slate-500 animate-pulse">Loading logs from server...</div>
          ) : logs.map((log) => (
            <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-slate-800/30 transition-colors">
              <span className="shrink-0 text-slate-500 flex items-center gap-1">
                <Clock size={12} />
                {log.time ? new Date(log.time).toLocaleString() : "-"}
              </span>
              <span className="shrink-0 text-indigo-400 flex items-center gap-1">
                 <User size={12} />
                 {log.user}
              </span>
              <span className={`shrink-0 font-bold ${
                log.status === "success" ? "text-emerald-400" : 
                log.status === "warning" ? "text-amber-400" : "text-rose-400"
              }`}>
                [{log.action}]
              </span>
              <span className="text-slate-300 truncate">
                {log.target}
              </span>
            </div>
          ))}
          {!isLoading && logs.length === 0 && (
             <div className="p-4 text-slate-500 italic">
                -- No logs found in database --
             </div>
          )}
          {!isLoading && logs.length > 0 && (
             <div className="p-4 text-slate-500 italic">
                -- End of recent activity --
             </div>
          )}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
         <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
               <HardDrive size={18} className="text-slate-400" />
               Storage Usage
            </h3>
            <div className="mt-4 space-y-2">
               <div className="flex justify-between text-xs text-slate-500">
                  <span>8.2 GB of 20 GB used</span>
                  <span>41%</span>
               </div>
               <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full w-[41%] bg-slate-900" />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
