"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, RotateCcw, UserX, UserCheck, CheckCircle2, AlertCircle, Mail } from "lucide-react";
import { Spinner } from "@/components/Spinner";
import { clsx } from "clsx";
import { getAccessToken } from "@/lib/api";

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  status: "active" | "suspended" | "deleted";
  emailVerified: boolean;
  createdAt: string;
  _count: { sessions: number; passkeys: number };
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

let toastId = 0;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [resetting, setResetting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  function addToast(type: Toast["type"], message: string) {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams({ page: String(page) });
      if (debouncedQ) sp.set("q", debouncedQ);
      const res = await fetch(`/api/v1/admin/users?${sp}`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      const data = await res.json() as { users?: AdminUser[]; total?: number; pages?: number };
      setUsers(Array.isArray(data.users) ? data.users : []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } catch {
      addToast("error", "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQ]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [debouncedQ]);

  async function handleResetPassword(user: AdminUser) {
    setResetting(user.id);
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}/reset-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      if (!res.ok) throw new Error();
      addToast("success", `Password reset email sent to ${user.email}`);
    } catch {
      addToast("error", "Failed to send reset email. Try again.");
    } finally {
      setResetting(null);
    }
  }

  async function handleToggleStatus(user: AdminUser) {
    const newStatus = user.status === "active" ? "suspended" : "active";
    setToggling(user.id);
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: newStatus } : u));
      addToast("success", `User ${newStatus === "suspended" ? "suspended" : "reactivated"}.`);
    } catch {
      addToast("error", "Failed to update user status.");
    } finally {
      setToggling(null);
    }
  }

  const displayName = (u: AdminUser) =>
    (u.displayName ?? [u.firstName, u.lastName].filter(Boolean).join(" ")) || u.email.split("@")[0];

  const initials = (u: AdminUser) =>
    displayName(u).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <div className="fixed top-5 right-5 space-y-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={clsx(
              "flex items-center gap-2.5 px-4 py-3 rounded-[8px] shadow-lg text-sm font-medium min-w-[280px] border",
              t.type === "success"
                ? "bg-white border-emerald-200 text-emerald-800"
                : "bg-white border-red-200 text-red-800"
            )}
          >
            {t.type === "success"
              ? <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              : <AlertCircle size={15} className="text-red-500 shrink-0" />
            }
            {t.message}
          </div>
        ))}
      </div>

      <div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Users</h1>
        <p className="text-sm text-slate-500 mt-1">{total} total account{total !== 1 ? "s" : ""}</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email…"
          className="e-input pl-9 py-2 text-sm"
        />
      </div>

      {/* Table */}
      <div className="e-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="w-6 h-6 text-blue-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">No users found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white text-[11px] font-bold">{initials(user)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{displayName(user)}</p>
                        <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                          {user.email}
                          {user.emailVerified && <Mail size={10} className="text-emerald-500" />}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={clsx(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                      user.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : user.status === "suspended" ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    )}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleResetPassword(user)}
                        disabled={resetting === user.id || user.status !== "active"}
                        title="Send password reset email"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-[5px] hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {resetting === user.id
                          ? <Spinner className="w-3 h-3" />
                          : <RotateCcw size={12} />
                        }
                        Reset password
                      </button>

                      {user.status !== "deleted" && (
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={toggling === user.id}
                          title={user.status === "active" ? "Suspend user" : "Reactivate user"}
                          className={clsx(
                            "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border rounded-[5px] transition-colors disabled:opacity-40",
                            user.status === "active"
                              ? "text-amber-600 border-amber-200 hover:bg-amber-50"
                              : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          )}
                        >
                          {toggling === user.id
                            ? <Spinner className="w-3 h-3" />
                            : user.status === "active" ? <UserX size={12} /> : <UserCheck size={12} />
                          }
                          {user.status === "active" ? "Suspend" : "Reactivate"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Page {page} of {pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-[5px] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-[5px] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
