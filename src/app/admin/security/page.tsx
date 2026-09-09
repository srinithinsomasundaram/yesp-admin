"use client";

import { useEffect, useState, useCallback } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Spinner } from "@/components/Spinner";
import { clsx } from "clsx";
import { getAccessToken } from "@/lib/api";

interface LoginAttempt {
  id: string;
  identifier: string;
  ipAddress: string | null;
  success: boolean;
  occurredAt: string;
}

interface SecurityData {
  recentFailures: LoginAttempt[];
  blockedIps: string[];
  totalFailures24h: number;
  totalSuccess24h: number;
}

export default function AdminSecurityPage() {
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/security", {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      if (res.ok) {
        setData(await res.json() as SecurityData);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Security</h1>
        <p className="text-sm text-slate-500 mt-1">Login activity and suspicious access monitoring.</p>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Spinner className="w-5 h-5 text-blue-600" />
        </div>
      )}

      {!loading && data && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <CheckCircle2 size={16} />
                <span className="text-xs font-medium uppercase tracking-wider">Successful logins (24h)</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{data.totalSuccess24h}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 text-red-500 mb-1">
                <XCircle size={16} />
                <span className="text-xs font-medium uppercase tracking-wider">Failed logins (24h)</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{data.totalFailures24h}</p>
            </div>
          </div>

          {/* Recent failures */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-500" />
              <h2 className="text-sm font-semibold text-slate-800">Recent failed login attempts</h2>
            </div>
            {data.recentFailures.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">No failed attempts in the last 24 hours.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.recentFailures.map((a) => (
                  <div key={a.id} className="px-5 py-3 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-slate-800">{a.identifier}</span>
                      {a.ipAddress && <span className="ml-2 text-slate-400 text-xs">{a.ipAddress}</span>}
                    </div>
                    <span className={clsx("text-xs", a.success ? "text-green-600" : "text-red-500")}>
                      {new Date(a.occurredAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Blocked IPs */}
          {data.blockedIps.length > 0 && (
            <div className="bg-white rounded-xl border border-red-200">
              <div className="px-5 py-4 border-b border-red-100 flex items-center gap-2">
                <ShieldAlert size={15} className="text-red-500" />
                <h2 className="text-sm font-semibold text-slate-800">IPs with 5+ failures (24h)</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {data.blockedIps.map((ip) => (
                  <div key={ip} className="px-5 py-3 text-sm font-mono text-slate-700">{ip}</div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !data && (
        <div className="text-center py-12 text-sm text-slate-400">Unable to load security data.</div>
      )}
    </div>
  );
}
