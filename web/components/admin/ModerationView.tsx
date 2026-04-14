"use client";

import React from "react";
import { Shield, ExternalLink, MoreVertical } from "lucide-react";

interface AdminDesignRecord {
  id: string;
  name: string;
  owner_email: string | null;
  width: number;
  height: number;
  is_template: boolean;
  is_public: boolean;
  updated_at: string | null;
}

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString();
}

export function ModerationView({ designs }: { designs: AdminDesignRecord[] }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Design Moderation</h2>
          <p className="mt-1 text-sm text-slate-500">Review and manage user designs and public content.</p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {designs.map((design) => (
          <article key={design.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-lg hover:shadow-slate-200/50">
            <div className="aspect-[4/3] w-full bg-slate-100 flex items-center justify-center relative overflow-hidden">
               <Shield className="text-slate-300" size={48} />
               {design.is_template && (
                 <span className="absolute top-3 left-3 rounded-full bg-indigo-600 px-2 py-1 text-[10px] font-bold uppercase text-white">
                   Template
                 </span>
               )}
            </div>
            
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900 line-clamp-1">{design.name}</h3>
                <button className="text-slate-400 hover:text-slate-900">
                  <MoreVertical size={16} />
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">{design.owner_email || "Anonymous"}</p>
              
              <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  {design.width} x {design.height}
                </span>
                <span className="text-[10px] text-slate-400">
                  {formatDate(design.updated_at)}
                </span>
              </div>
              
              <div className="mt-3 flex gap-2">
                <button className="flex-1 rounded-lg bg-slate-100 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-200 transition-colors">
                  Review
                </button>
                <button className="rounded-lg bg-slate-900 px-2 py-1.5 text-white hover:bg-slate-700 transition-colors">
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </article>
        ))}
        {designs.length === 0 && (
           <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
              <p className="text-slate-500 font-medium">No designs found for moderation.</p>
           </div>
        )}
      </section>
    </div>
  );
}
