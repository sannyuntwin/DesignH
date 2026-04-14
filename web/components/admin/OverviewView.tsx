"use client";

import React from "react";
import { AdminOverviewResponse } from "@/lib/admin-api";

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100 transition-all hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
    </article>
  );
}

export function OverviewView({ data }: { data: AdminOverviewResponse }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h2>
        <p className="mt-1 text-sm text-slate-500">Quick snapshot of your platform's health and activity.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={data.stats.users} />
        <StatCard label="Total Designs" value={data.stats.designs} />
        <StatCard label="Stock Templates" value={data.stats.templates} />
        <StatCard label="Active Admins" value={data.stats.admins} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Recent Users</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-semibold">Email</th>
                  <th className="px-3 py-3 font-semibold">Role</th>
                  <th className="px-3 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recent_users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 py-3 font-medium text-slate-900">{user.email}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.is_admin ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700"
                      }`}>
                        {user.is_admin ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-500">{formatDate(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Recent Designs</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-semibold">Design Name</th>
                  <th className="px-3 py-3 font-semibold">Owner</th>
                  <th className="px-3 py-3 font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recent_designs.map((design) => (
                  <tr key={design.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 py-3 font-medium text-slate-900">{design.name}</td>
                    <td className="px-3 py-3 text-slate-600">{design.owner_email || "-"}</td>
                    <td className="px-3 py-3 text-slate-500">{formatDate(design.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
