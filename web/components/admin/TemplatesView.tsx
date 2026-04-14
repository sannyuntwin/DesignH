"use client";

import React from "react";
import { Plus, Layout, Tag, Trash2 } from "lucide-react";

interface AdminTemplateRecord {
  id: string;
  name: string;
  category: string;
  width: number;
  height: number;
  created_at: string | null;
}

export function TemplatesView({ templates }: { templates: AdminTemplateRecord[] }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Template Gallery</h2>
          <p className="mt-1 text-sm text-slate-500">Manage global templates available to all users.</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-all shadow-lg shadow-slate-200">
          <Plus size={18} />
          <span>New Template</span>
        </button>
      </header>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <article key={template.id} className="group relative rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-xl hover:shadow-slate-100">
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <Layout size={24} />
              </div>
              <button className="rounded-lg p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="mt-4">
              <h3 className="font-bold text-slate-900">{template.name}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                  <Tag size={10} />
                  {template.category}
                </span>
                <span className="inline-flex rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  {template.width}x{template.height}
                </span>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                Edit JSON
              </button>
              <button className="flex-1 rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors">
                Open in Editor
              </button>
            </div>
          </article>
        ))}
        {templates.length === 0 && (
           <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
              <p className="text-slate-500 font-medium text-sm">No templates found. Click "New Template" to create one.</p>
           </div>
        )}
      </section>
    </div>
  );
}
