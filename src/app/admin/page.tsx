"use client";

import { useEffect, useState } from "react";
import { Users, AppWindow, Activity, Shield } from "lucide-react";
import { getAccessToken } from "@/lib/api";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalApps: number;
  totalSessions: number;
  recentLogins: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/v1/admin/stats", {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const cards: {
    label: string;
    value: number | undefined;
    icon: typeof Users;
    color: "blue" | "green" | "purple" | "amber";
  }[] = [
    { label: "Total users", value: stats?.totalUsers, icon: Users, color: "blue" },
    { label: "Active sessions", value: stats?.totalSessions, icon: Activity, color: "green" },
    { label: "Registered apps", value: stats?.totalApps, icon: AppWindow, color: "purple" },
    { label: "Logins (24h)", value: stats?.recentLogins, icon: Shield, color: "amber" },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Identity Platform</h1>
        <p className="text-sm text-slate-500 mt-1">
          Overview of Yesp Auth — users, applications, and sessions.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color]}`}
            >
              <Icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value ?? "—"}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Quick navigation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: "/admin/users", label: "Manage users", desc: "View, suspend, or reset user accounts" },
            { href: "/admin/apps", label: "Applications", desc: "Register and manage OAuth client apps" },
            { href: "/admin/audit", label: "Audit log", desc: "Security events and access history" },
          ].map(({ href, label, desc }) => (
            <a
              key={href}
              href={href}
              className="block p-4 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
            >
              <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
