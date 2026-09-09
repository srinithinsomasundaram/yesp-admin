"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Globe } from "lucide-react";
import { Spinner } from "@/components/Spinner";
import { getAccessToken } from "@/lib/api";

interface OAuthClientItem {
  clientId: string;
  redirectUris: string[];
  status: string;
}

interface App {
  id: string;
  name: string;
  slug: string;
  type: string;
  description?: string | null;
  status: string;
  createdAt: string;
  oauthClients: OAuthClientItem[];
}

interface CreateForm {
  name: string;
  slug: string;
  type: string;
  description: string;
  redirectUris: string;
  homepageUrl: string;
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    web: "bg-blue-50 text-blue-700 border-blue-200",
    spa: "bg-indigo-50 text-indigo-700 border-indigo-200",
    mobile: "bg-purple-50 text-purple-700 border-purple-200",
    server: "bg-slate-100 text-slate-700 border-slate-300",
    service: "bg-amber-50 text-amber-700 border-amber-200",
    internal: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border uppercase tracking-wide ${colors[type] ?? colors.web}`}
    >
      {type}
    </span>
  );
}

export default function AdminApps() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateForm>({
    name: "",
    slug: "",
    type: "web",
    description: "",
    redirectUris: "",
    homepageUrl: "",
  });

  const token = getAccessToken() ?? "";

  const load = () => {
    setLoading(true);
    fetch("/api/v1/admin/apps", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data: unknown) => setApps(Array.isArray(data) ? (data as App[]) : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/v1/admin/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          type: form.type,
          description: form.description || undefined,
          homepageUrl: form.homepageUrl || undefined,
          redirectUris: form.redirectUris
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ name: "", slug: "", type: "web", description: "", redirectUris: "", homepageUrl: "" });
        load();
      }
    } catch {
      // no-op
    } finally {
      setCreating(false);
    }
  }

  async function deleteApp(slug: string) {
    if (!confirm(`Delete application "${slug}"? This cannot be undone.`)) return;
    await fetch(`/api/v1/admin/apps/${slug}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
          <p className="text-sm text-slate-500 mt-1">Registered OAuth client applications.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} /> New app
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 animate-scale-in">
          <h2 className="text-base font-semibold text-slate-900 mb-5">Register new application</h2>
          <form onSubmit={create} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="e-label">App name</label>
                <input
                  className="e-input"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Yesp SheetPro"
                />
              </div>
              <div>
                <label className="e-label">Slug (unique ID)</label>
                <input
                  className="e-input font-mono"
                  required
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                    }))
                  }
                  placeholder="yesp-sheetpro"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="e-label">Application type</label>
                <select
                  className="e-input"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                >
                  {["web", "spa", "mobile", "server", "service", "internal"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="e-label">Homepage URL (optional)</label>
                <input
                  className="e-input"
                  type="url"
                  value={form.homepageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, homepageUrl: e.target.value }))}
                  placeholder="https://sheetpro.yesp.space"
                />
              </div>
            </div>
            <div>
              <label className="e-label">Description (optional)</label>
              <input
                className="e-input"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of the application"
              />
            </div>
            <div>
              <label className="e-label">
                Redirect URIs{" "}
                <span className="text-slate-400 font-normal">(one per line)</span>
              </label>
              <textarea
                className="e-input font-mono text-xs"
                rows={3}
                required
                value={form.redirectUris}
                onChange={(e) => setForm((f) => ({ ...f, redirectUris: e.target.value }))}
                placeholder={
                  "https://sheetpro.yesp.space/auth/callback\nhttps://sheetpro.yesp.space/bridge"
                }
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={creating} className="btn-primary w-auto px-6">
                {creating ? (
                  <>
                    <Spinner className="w-4 h-4" /> Creating…
                  </>
                ) : (
                  "Create application"
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="btn-secondary w-auto px-4"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="w-6 h-6 text-blue-600" />
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          No applications registered yet.
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <div key={app.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1">
                    <h3 className="font-semibold text-slate-900">{app.name}</h3>
                    <TypeBadge type={app.type} />
                    {app.status !== "active" && (
                      <span className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full uppercase">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono">{app.slug}</p>
                  {app.description && (
                    <p className="text-xs text-slate-500 mt-1">{app.description}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteApp(app.slug)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              {app.oauthClients.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  {app.oauthClients.map((c) => (
                    <div key={c.clientId} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                          Client ID
                        </span>
                        <code className="text-xs bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-mono">
                          {c.clientId}
                        </code>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {c.redirectUris.map((uri) => (
                          <div
                            key={uri}
                            className="flex items-center gap-1 text-[11px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-mono"
                          >
                            <Globe size={10} /> {uri}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
