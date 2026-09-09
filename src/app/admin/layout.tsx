"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Users,
  AppWindow,
  ShieldAlert,
  FileText,
  LogOut,
  ChevronRight,
  Menu,
  X,
  BookOpen,
} from "lucide-react";
import { getMe, logout, clearTokens, setTokens, getAccessToken, ApiError, type Me } from "@/lib/api";
import { isAuthenticated } from "@/lib/session";

const AUTH_URL = (process.env.NEXT_PUBLIC_AUTH_URL ?? "https://auth.yesp.space").replace(/\/$/, "");
const ADMIN_URL = (process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.yesp.space").replace(/\/$/, "");
import { Spinner } from "@/components/Spinner";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/apps", label: "Applications", icon: AppWindow },
  { href: "/admin/audit", label: "Audit Log", icon: FileText },
  { href: "/admin/security", label: "Security", icon: ShieldAlert },
  { href: "/admin/setup-guide", label: "Setup Guide", icon: BookOpen },
];

function isActive(href: string, path: string, exact?: boolean) {
  return exact ? path === href : path.startsWith(href);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [initError, setInitError] = useState(false);

  const toLogin = useCallback(() => {
    clearTokens();
    window.location.href = `${AUTH_URL}/auth/login?next=${encodeURIComponent(ADMIN_URL + "/admin")}`;
  }, []);

  const init = useCallback(async () => {
    setInitError(false);
    setMe(null);
    setForbidden(false);

    if (!isAuthenticated()) {
      try {
        const res = await fetch("/api/v1/auth/token/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          if (res.status === 401) { toLogin(); return; }
          setInitError(true); return;
        }
        const data = await res.json() as { accessToken: string; refreshToken?: string };
        setTokens(data.accessToken, data.refreshToken ?? "");
      } catch {
        setInitError(true); return;
      }
    }

    let user;
    try {
      user = await getMe();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        toLogin();
      } else {
        setInitError(true);
      }
      return;
    }

    // Verify admin access before setting `me` (so no admin UI flashes for non-admins)
    try {
      const adminCheck = await fetch("/api/v1/admin/stats", {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      if (adminCheck.status === 403) {
        setForbidden(true);
        setMe(user);
        return;
      }
      if (!adminCheck.ok) {
        setInitError(true);
        return;
      }
    } catch {
      setInitError(true);
      return;
    }

    setMe(user);
  }, [toLogin]);

  // Initial auth check
  useEffect(() => { init(); }, [init]);

  // Re-check auth on bfcache restore (browser back/forward)
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) { setInitError(false); init(); }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [init]);

  if (!me) {
    if (initError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm font-medium text-slate-700">Unable to connect</p>
          <p className="text-xs text-slate-400 max-w-xs">Check your internet connection and try again. You will not be logged out.</p>
          <button
            onClick={() => init()}
            className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-6 h-6 text-blue-600" />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
          <ShieldAlert size={24} className="text-red-500" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">Access denied</h1>
        <p className="text-sm text-slate-500 max-w-xs">
          Your account does not have admin access to Yesp Identity Platform.
        </p>
        <a href={`${(process.env.NEXT_PUBLIC_CONSOLE_URL || "https://accounts.yesp.space")}/console`} className="btn-primary mt-2 w-auto px-6">Go to console</a>
      </div>
    );
  }

  const displayName = me.displayName ?? me.email.split("@")[0];
  const initial = displayName[0].toUpperCase();

  return (
    <div className="h-screen bg-[#f8f9fb] flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-[220px] bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="h-[60px] flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-[13px] font-bold text-slate-900 leading-tight">Yesp Identity</p>
            <p className="text-[10px] text-red-500 font-semibold uppercase tracking-widest leading-tight">Admin Console</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-slate-400">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {ADMIN_NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, pathname, exact);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all relative",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-full" />
                )}
                <Icon
                  size={15}
                  className={clsx("shrink-0", active ? "text-blue-600" : "text-slate-400")}
                />
                {label}
                {active && <ChevronRight size={12} className="ml-auto text-blue-400" />}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="mx-3 mb-3 p-3 rounded-xl border border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-slate-900 truncate">{displayName}</p>
              <p className="text-[10px] text-slate-400 truncate">{me.email}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await logout();
              clearTokens();
              window.location.href = `${AUTH_URL}/auth/login?logged_out=1`;
            }}
            className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-red-600 transition-colors"
          >
            <LogOut size={11} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-[60px] bg-white border-b border-slate-200 flex items-center px-4 gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          >
            <Menu size={18} />
          </button>
          <div className="flex-1" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Yesp Identity Platform
          </span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-6xl mx-auto animate-fade-slide-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
