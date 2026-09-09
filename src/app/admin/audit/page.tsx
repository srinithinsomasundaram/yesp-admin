"use client";

import { useEffect, useState, useCallback } from "react";
import { Spinner } from "@/components/Spinner";
import { clsx } from "clsx";
import { getAccessToken } from "@/lib/api";

interface AuditActor {
  email: string;
  displayName: string | null;
}

interface AuditEventItem {
  id: string;
  eventType: string;
  actorUserId: string | null;
  actorUser: AuditActor | null;
  organizationId: string | null;
  applicationId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
  occurredAt: string;
}

interface AuditResponse {
  events: AuditEventItem[];
  total: number;
  page: number;
  pages: number;
}

function EventTypeBadge({ type }: { type: string }) {
  const isError =
    type.includes("failed") || type.includes("error") || type.includes("denied");
  const isSuccess =
    type.includes("success") || type.includes("login.success") || type.includes("verified");
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border",
        isError
          ? "bg-red-50 text-red-700 border-red-200"
          : isSuccess
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-slate-50 text-slate-600 border-slate-200"
      )}
    >
      {type}
    </span>
  );
}

export default function AuditLogPage() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const token = getAccessToken() ?? "";

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/audit?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json()) as Partial<AuditResponse>;
      if (Array.isArray(json.events)) setData(json as AuditResponse);
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  }, [page, token]);

  useEffect(() => { fetchAudit(); }, [fetchAudit]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
        <p className="text-sm text-slate-500 mt-1">
          Security events and access history across the platform.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="w-6 h-6 text-blue-600" />
          </div>
        ) : !data || data.events.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">No audit events found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      Event
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      Actor
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      IP Address
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.events.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <EventTypeBadge type={event.eventType} />
                      </td>
                      <td className="px-4 py-3.5">
                        {event.actorUser ? (
                          <div>
                            <p className="text-xs font-medium text-slate-800 truncate max-w-[180px]">
                              {event.actorUser.displayName ?? event.actorUser.email.split("@")[0]}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                              {event.actorUser.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">System</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-slate-500 font-mono">
                          {event.ipAddress ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(event.occurredAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  Page {data.page} of {data.pages} ({data.total} events)
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
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page === data.pages}
                    className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-[5px] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
