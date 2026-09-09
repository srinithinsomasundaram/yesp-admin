"use client";

import { useState } from "react";
import { CheckCircle2, ChevronRight, Copy, Check } from "lucide-react";
import { clsx } from "clsx";

const SECTIONS = [
  { id: "overview",       label: "Overview" },
  { id: "env-vars",       label: "Environment Variables" },
  { id: "api-proxy",      label: "API Proxy" },
  { id: "token-store",    label: "Token Store" },
  { id: "bridge",         label: "Bridge Pattern" },
  { id: "auth-guard",     label: "Auth Guard" },
  { id: "login",          label: "Login Flow" },
  { id: "refresh",        label: "Token Refresh" },
  { id: "logout",         label: "Logout" },
  { id: "admin-check",    label: "Admin Access" },
];

function Code({ children, lang = "ts" }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(children.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between bg-slate-800 rounded-t-lg px-4 py-2">
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{lang}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
        >
          {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="bg-slate-900 rounded-b-lg px-4 py-4 text-[12px] leading-relaxed font-mono text-slate-200 overflow-x-auto whitespace-pre">
        {children.trim()}
      </pre>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-blue-600 rounded-full inline-block" />
        {title}
      </h2>
      <div className="space-y-3 text-sm text-slate-600 leading-relaxed">{children}</div>
    </section>
  );
}

function Badge({ color = "blue", children }: { color?: "blue" | "red" | "green" | "amber"; children: React.ReactNode }) {
  const cls = {
    blue:  "bg-blue-50 text-blue-700 border-blue-200",
    red:   "bg-red-50 text-red-700 border-red-200",
    green: "bg-green-50 text-green-700 border-green-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  }[color];
  return (
    <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border", cls)}>
      {children}
    </span>
  );
}

function EnvRow({ name, value, note, required = true }: { name: string; value: string; note: string; required?: boolean }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className="w-[260px] shrink-0">
        <code className="text-[11px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{name}</code>
        {!required && <span className="ml-1.5 text-[10px] text-slate-400">optional</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-mono text-slate-500 truncate mb-0.5">{value}</p>
        <p className="text-xs text-slate-500">{note}</p>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
          {n}
        </div>
        {children && <div className="w-px flex-1 bg-slate-200 my-1" />}
      </div>
      <div className="pb-4 flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 mb-1">{title}</p>
        {children}
      </div>
    </div>
  );
}

function Callout({ type = "info", children }: { type?: "info" | "warn" | "danger"; children: React.ReactNode }) {
  const cfg = {
    info:   { cls: "bg-blue-50 border-blue-200 text-blue-800",   label: "Note" },
    warn:   { cls: "bg-amber-50 border-amber-200 text-amber-800", label: "Important" },
    danger: { cls: "bg-red-50 border-red-200 text-red-800",       label: "Security" },
  }[type];
  return (
    <div className={clsx("border rounded-lg px-4 py-3 text-[12px] leading-relaxed", cfg.cls)}>
      <span className="font-bold mr-1">{cfg.label}:</span>{children}
    </div>
  );
}

export default function SetupGuidePage() {
  const [activeSection, setActiveSection] = useState("overview");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex gap-8 items-start">

      {/* Sticky TOC */}
      <aside className="hidden xl:flex flex-col gap-1 w-44 shrink-0 sticky top-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-2">On this page</p>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className={clsx(
              "text-left text-xs px-2 py-1 rounded-md transition-colors",
              activeSection === s.id
                ? "text-blue-700 font-semibold bg-blue-50"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            )}
          >
            {s.label}
          </button>
        ))}
      </aside>

      {/* Content */}
      <article className="flex-1 min-w-0 space-y-12">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
            <span>Admin</span><ChevronRight size={12} /><span className="text-slate-600 font-medium">Setup Guide</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Yesp Auth — Integration Guide</h1>
          <p className="mt-2 text-sm text-slate-500 max-w-2xl">
            Step-by-step reference for adding Yesp Auth to a new Next.js app. Covers environment setup, the
            cross-domain bridge pattern, protected routes, token refresh, and logout.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge color="blue">Next.js 14+</Badge>
            <Badge color="green">App Router</Badge>
            <Badge color="amber">TypeScript</Badge>
          </div>
        </div>

        {/* Overview */}
        <Section id="overview" title="Architecture Overview">
          <p>
            Yesp Auth is split across four apps that talk to a shared Hono API:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {[
              { name: "auth.yesp.space",     port: "3001", desc: "Login, register, MFA, OAuth flows" },
              { name: "accounts.yesp.space", port: "3002", desc: "User console — profile, security, orgs" },
              { name: "admin.yesp.space",    port: "3003", desc: "Admin panel — users, audit, security" },
              { name: "API (Hono)",          port: "3100", desc: "All auth logic — tokens, sessions, DB" },
            ].map((a) => (
              <div key={a.name} className="border border-slate-200 rounded-lg p-3 bg-white">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-[11px] font-mono text-slate-700 font-semibold">{a.name}</code>
                  <span className="text-[10px] text-slate-400">:{a.port}</span>
                </div>
                <p className="text-xs text-slate-500">{a.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4">
            <strong className="text-slate-700">Tokens are stored in module memory only</strong> — never in
            localStorage, sessionStorage, or JS-readable cookies. The refresh token travels as an
            HttpOnly cookie set by the API, or is passed via the bridge when crossing subdomains.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-[11px] text-slate-600 mt-3 leading-6">
            Login (auth.yesp.space)<br />
            {'  '}↓ POST /api/v1/auth/password/login → API issues AT + RT cookie<br />
            {'  '}↓ navigateToConsole() → redirect to accounts.yesp.space/bridge#at=…&rt=…<br />
            {'  '}↓ Bridge: setTokens(at, rt) in module memory<br />
            {'  '}↓ router.replace("/console") → console layout init() → GET /api/v1/me<br />
            {'  '}↓ Session established ✓
          </div>
        </Section>

        {/* Env Vars */}
        <Section id="env-vars" title="Environment Variables">
          <p>Each app needs its own set of env vars. <Badge color="red">Never</Badge> commit <code className="text-[11px] bg-slate-100 px-1 rounded">.env.production</code> or keys to git.</p>

          <div className="mt-4 space-y-6">
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Auth App (auth.yesp.space)</p>
              <div className="border border-slate-200 rounded-lg bg-white divide-y divide-slate-100 px-4">
                <EnvRow name="NEXT_PUBLIC_AUTH_URL"    value="https://auth.yesp.space"     note="Canonical URL of this app (used in CORS / middleware)" />
                <EnvRow name="NEXT_PUBLIC_CONSOLE_URL" value="https://accounts.yesp.space" note="Used to build bridge redirect URLs after login" />
                <EnvRow name="NEXT_PUBLIC_ADMIN_URL"   value="https://admin.yesp.space"    note="Admin origin — for admin-role redirect after login" />
                <EnvRow name="BACKEND_URL"             value="http://api-internal:3100"    note="Internal URL of the Hono API (server-side proxy only)" />
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Accounts App (accounts.yesp.space)</p>
              <div className="border border-slate-200 rounded-lg bg-white divide-y divide-slate-100 px-4">
                <EnvRow name="NEXT_PUBLIC_AUTH_URL"    value="https://auth.yesp.space"     note="Used by toLogin() to redirect back to the auth app" />
                <EnvRow name="NEXT_PUBLIC_CONSOLE_URL" value="https://accounts.yesp.space" note="Self-reference — used in navigation helpers" />
                <EnvRow name="BACKEND_URL"             value="http://api-internal:3100"    note="Internal URL of the Hono API (server-side proxy only)" />
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Admin App (admin.yesp.space)</p>
              <div className="border border-slate-200 rounded-lg bg-white divide-y divide-slate-100 px-4">
                <EnvRow name="NEXT_PUBLIC_AUTH_URL"    value="https://auth.yesp.space"     note="Used by toLogin() to redirect to auth" />
                <EnvRow name="NEXT_PUBLIC_ADMIN_URL"   value="https://admin.yesp.space"    note="Self-reference — passed as next= param to login" />
                <EnvRow name="NEXT_PUBLIC_CONSOLE_URL" value="https://accounts.yesp.space" note="Fallback console URL for non-admin redirects" />
                <EnvRow name="BACKEND_URL"             value="http://api-internal:3100"    note="Internal URL of the Hono API (server-side proxy only)" />
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">API (Hono)</p>
              <div className="border border-slate-200 rounded-lg bg-white divide-y divide-slate-100 px-4">
                <EnvRow name="DATABASE_URL"         value="postgresql://user:pass@host/db" note="Postgres connection string — injected at runtime, never baked into image" />
                <EnvRow name="REDIS_URL"            value="redis://host:6379"              note="Used for rate-limiting" />
                <EnvRow name="JWT_PRIVATE_KEY"      value="-----BEGIN RSA PRIVATE KEY-----…" note="RS256 private key PEM (escape newlines as \\n in env)" />
                <EnvRow name="JWT_PUBLIC_KEY"       value="-----BEGIN PUBLIC KEY-----…"    note="RS256 public key PEM" />
                <EnvRow name="COOKIE_DOMAIN"        value=".yesp.space"                   note="Set to .yesp.space so the RT cookie is valid on all subdomains" />
                <EnvRow name="APP_URL"              value="https://api.yesp.space"         note="JWT issuer — must match what was used when tokens were originally signed" />
                <EnvRow name="ALLOWED_ORIGINS"      value="https://auth.yesp.space,https://accounts.yesp.space,https://admin.yesp.space" note="CORS allowed origins" />
                <EnvRow name="RESEND_API_KEY"       value="re_…"                          note="Resend key for transactional emails (verification, reset)" required={false} />
              </div>
            </div>
          </div>

          <Callout type="warn">
            Set <code>COOKIE_DOMAIN=.yesp.space</code> on the API. Without it the RT HttpOnly cookie is
            scoped to only one subdomain and silent token refresh will fail on other apps.
          </Callout>
        </Section>

        {/* API Proxy */}
        <Section id="api-proxy" title="API Proxy Route">
          <p>
            Each Next.js app exposes a catch-all API route that proxies requests to the Hono API.
            This keeps the API URL server-side and lets browsers make same-origin requests.
          </p>
          <Code lang="ts">{`// src/app/api/v1/[...path]/route.ts
import { type NextRequest, NextResponse } from "next/server";

const BACKEND = (process.env.BACKEND_URL ?? "http://localhost:3100").replace(/\\/$/, "");

async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const target = \`\${BACKEND}/api/v1/\${params.path.join("/")}\${req.nextUrl.search}\`;

  const headers = new Headers();
  req.headers.forEach((v, k) => {
    if (!["host", "connection", "transfer-encoding"].includes(k)) headers.set(k, v);
  });

  const body = !["GET", "HEAD"].includes(req.method)
    ? await req.arrayBuffer()
    : undefined;

  const upstream = await fetch(target, { method: req.method, headers, body, redirect: "manual" });

  const resHeaders = new Headers();
  upstream.headers.forEach((v, k) => {
    if (!["connection", "transfer-encoding"].includes(k)) resHeaders.set(k, v);
  });

  return new NextResponse(upstream.body, { status: upstream.status, headers: resHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;`}
          </Code>
          <Callout type="info">
            The proxy forwards all headers including <code>Authorization</code>, <code>Cookie</code>,
            and <code>Set-Cookie</code>. The RT HttpOnly cookie is set and rotated transparently.
          </Callout>
        </Section>

        {/* Token Store */}
        <Section id="token-store" title="In-Memory Token Store">
          <p>
            All apps share the same pattern: tokens live in module-level variables, never in
            localStorage or sessionStorage. They are lost on page refresh — that is intentional.
            The bridge re-delivers them on each fresh load.
          </p>
          <Code lang="ts">{`// src/lib/api.ts
const BASE = "/api/v1";

let _at: string | null = null;   // Access token (15 min)
let _rt: string | null = null;   // Refresh token (30 days)

export function isAuthenticated() { return _at !== null; }
export function getAccessToken()  { return _at; }

export function getStoredTokens() {
  return _at ? { at: _at, rt: _rt ?? "" } : null;
}

export function setTokens(access: string, refresh: string) {
  _at = access;
  _rt = refresh;
}

export function clearTokens() {
  _at = null;
  _rt = null;
}`}
          </Code>
          <Callout type="danger">
            Never write tokens to <code>localStorage</code>, <code>sessionStorage</code>, or any JS-accessible cookie.
            This is a hard security constraint for Yesp apps.
          </Callout>
        </Section>

        {/* Bridge */}
        <Section id="bridge" title="Bridge Pattern">
          <p>
            Because subdomains are different origins, you cannot share in-memory state between them.
            The <strong>bridge</strong> is a special page that reads tokens from the URL fragment,
            stores them in memory, then navigates to the real destination.
          </p>
          <Code lang="tsx">{`// src/app/bridge/page.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { setTokens, getStoredTokens } from "@/lib/api";

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? "https://auth.yesp.space";

export default function BridgePage() {
  const router = useRouter();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const params = new URLSearchParams(window.location.hash.slice(1));
    const at   = params.get("at");
    const rt   = params.get("rt") ?? "";
    const next = params.get("next") ?? "/console";

    if (at) {
      setTokens(at, rt);
      history.replaceState(null, "", "/bridge"); // clear tokens from URL
      router.replace(next);
      return;
    }

    // No token in fragment — try silent refresh via HttpOnly RT cookie
    if (getStoredTokens()) { router.replace(next); return; }

    fetch("/api/v1/auth/token/refresh", { method: "POST",
      headers: { "Content-Type": "application/json" } })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const { accessToken, refreshToken } = await res.json();
        setTokens(accessToken, refreshToken ?? "");
        router.replace(next);
      })
      .catch(() => { window.location.href = \`\${AUTH_URL}/auth/login\`; });
  }, [router]);

  return <div className="min-h-screen flex items-center justify-center">
    <span className="text-sm text-slate-400">Loading…</span>
  </div>;
}`}
          </Code>

          <p>On the <strong>sending side</strong> (the app that just authenticated the user), call <code>navigateToConsole()</code> which builds the bridge URL:</p>
          <Code lang="ts">{`// src/lib/navigation.ts
const CONSOLE_URL = process.env.NEXT_PUBLIC_CONSOLE_URL ?? "https://accounts.yesp.space";

export function navigateToConsole(targetPath = "/console") {
  const tokens = getStoredTokens();
  if (tokens) {
    const frag: Record<string, string> = { at: tokens.at, next: targetPath };
    if (tokens.rt) frag.rt = tokens.rt;   // include RT so the console can refresh
    window.location.href = \`\${CONSOLE_URL}/bridge#\${new URLSearchParams(frag)}\`;
  } else {
    window.location.href = \`\${CONSOLE_URL}\${targetPath}\`;
  }
}`}
          </Code>
        </Section>

        {/* Auth Guard */}
        <Section id="auth-guard" title="Auth Guard">
          <p>
            Wrap all protected layouts with an <code>AuthGuard</code> that checks for a valid session
            on mount. Show the page immediately (no blank flash) and redirect in the background.
          </p>
          <Code lang="tsx">{`// src/components/AuthGuard.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated, setTokens, clearTokens, getMe } from "@/lib/api";

// Pages where the user may be mid-flow — never redirect away
const MID_FLOW = ["/auth/mfa", "/auth/register", "/auth/forgot-password",
                  "/auth/verify-email", "/auth/oauth", "/auth/authorize"];

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? "https://auth.yesp.space";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (MID_FLOW.some((p) => pathname.startsWith(p))) return;

    const check = async () => {
      if (isAuthenticated()) {
        // Already have an AT — verify it is still accepted
        getMe()
          .then(() => router.replace("/console"))
          .catch(() => clearTokens());
        return;
      }

      // Try silent refresh via the RT HttpOnly cookie (or body RT)
      try {
        const res = await fetch("/api/v1/auth/token/refresh", {
          method: "POST", headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return;  // No session — stay on page (login/register)
        const { accessToken, refreshToken } = await res.json();
        setTokens(accessToken, refreshToken ?? "");
        getMe()
          .then(() => router.replace("/console"))
          .catch(() => clearTokens());
      } catch { /* network error — stay on page */ }
    };

    check();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;  // Render immediately — redirect is async
}`}
          </Code>

          <p>Wrap your <code>/auth</code> layout:</p>
          <Code lang="tsx">{`// src/app/auth/layout.tsx
import { Suspense } from "react";
import { AuthGuard } from "@/components/AuthGuard";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>  {/* required — AuthGuard uses useSearchParams */}
      <AuthGuard>{children}</AuthGuard>
    </Suspense>
  );
}`}
          </Code>
        </Section>

        {/* Login */}
        <Section id="login" title="Login Flow">
          <div className="space-y-2">
            <Step n={1} title="User submits email + password">
              <Code lang="ts">{`const res = await fetch("/api/v1/auth/password/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const { accessToken, refreshToken } = await res.json();`}
              </Code>
            </Step>
            <Step n={2} title="Store tokens in memory">
              <Code lang="ts">{`setTokens(accessToken, refreshToken);`}
              </Code>
            </Step>
            <Step n={3} title="Check for MFA before redirecting">
              <Code lang="ts">{`const methods = await fetch("/api/v1/mfa/methods",
  { headers: { Authorization: \`Bearer \${getAccessToken()}\` } }
).then(r => r.json());

const activeMfa = methods.find((m: { status: string }) => m.status === "active");

if (activeMfa) {
  // Redirect to MFA page — keep tokens in memory
  router.push("/auth/mfa");
} else {
  navigateToConsole("/console");
}`}
              </Code>
            </Step>
            <Step n={4} title="Bridge delivers tokens cross-domain">
              <p className="text-xs text-slate-500">
                <code>navigateToConsole()</code> redirects to <code>accounts.yesp.space/bridge#at=…&amp;rt=…</code>.
                The bridge page stores them in the accounts app's module memory, then navigates to <code>/console</code>.
              </p>
            </Step>
          </div>
        </Section>

        {/* Refresh */}
        <Section id="refresh" title="Token Refresh">
          <p>
            Access tokens expire after <strong>15 minutes</strong>. The refresh function is called
            automatically inside <code>authFetch</code> when a 401 is received.
          </p>
          <Code lang="ts">{`// called automatically on 401 — you rarely call this directly
async function tryRefresh(): Promise<boolean> {
  const body = _rt ? JSON.stringify({ refreshToken: _rt }) : undefined;
  try {
    const res = await fetch("/api/v1/auth/token/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,  // in-memory RT takes priority; HttpOnly cookie is the fallback
    });
    if (!res.ok) return false;
    const { accessToken, refreshToken } = await res.json();
    setTokens(accessToken, refreshToken ?? "");
    return true;
  } catch { return false; }
}`}
          </Code>
          <Callout type="info">
            The API accepts the refresh token in the <strong>request body</strong>{" "}
            (<code>{"{ refreshToken: \"…\" }"}</code>) OR as the <code>yesp_rt</code> HttpOnly cookie.
            Sending it in the body means refresh works across subdomains even without <code>COOKIE_DOMAIN</code>.
          </Callout>
        </Section>

        {/* Logout */}
        <Section id="logout" title="Logout">
          <Code lang="ts">{`async function handleLogout() {
  // Revoke the session server-side (clears the RT from the DB)
  await fetch("/api/v1/auth/logout", {
    method: "POST",
    headers: { Authorization: \`Bearer \${getAccessToken()}\` },
  }).catch(() => {});

  // Clear in-memory tokens
  clearTokens();

  // Redirect to auth login
  const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? "https://auth.yesp.space";
  window.location.href = \`\${AUTH_URL}/auth/login?logged_out=1\`;
}`}
          </Code>
          <Callout type="warn">
            Always call <code>/auth/logout</code> before clearing tokens. This revokes the RT in the
            database so it cannot be used to issue new access tokens even if someone has a copy.
          </Callout>
        </Section>

        {/* Admin Check */}
        <Section id="admin-check" title="Admin Access">
          <p>
            Admin pages verify the user is an admin by calling <code>GET /api/v1/admin/stats</code>
            after loading the user profile. A <code>403</code> response means the user is
            authenticated but not an admin.
          </p>
          <Code lang="ts">{`const adminCheck = await fetch("/api/v1/admin/stats", {
  headers: { Authorization: \`Bearer \${getAccessToken()}\` },
});

if (adminCheck.status === 403) {
  // User is authenticated but not admin — show access-denied screen
  setForbidden(true);
  return;
}
if (!adminCheck.ok) {
  // Network/server error — show retry screen
  setInitError(true);
  return;
}
// adminCheck.ok === true → user is an admin, proceed`}
          </Code>

          <p className="mt-4 font-semibold text-slate-700">Full protected layout pattern:</p>
          <Code lang="tsx">{`// Typical admin/console layout init sequence
const init = async () => {
  // 1. Ensure we have an AT
  if (!isAuthenticated()) {
    const res = await fetch("/api/v1/auth/token/refresh", {
      method: "POST", headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      res.status === 401 ? toLogin() : setInitError(true);
      return;
    }
    const { accessToken, refreshToken } = await res.json();
    setTokens(accessToken, refreshToken ?? "");
  }

  // 2. Load user profile
  let user;
  try { user = await getMe(); }
  catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      clearTokens(); setInitError(true);  // retry → refresh path → toLogin
    } else { setInitError(true); }
    return;
  }

  // 3. (Admin only) verify admin role
  const check = await fetch("/api/v1/admin/stats",
    { headers: { Authorization: \`Bearer \${getAccessToken()}\` } });
  if (check.status === 403) { setForbidden(true); setMe(user); return; }
  if (!check.ok) { setInitError(true); return; }

  setMe(user);
};`}
          </Code>

          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-green-600 mt-0.5 shrink-0" />
              <p className="text-xs text-green-800">
                <strong>You are ready.</strong> Your new Next.js Yesp app needs: the API proxy route,
                the token store module, a bridge page, an auth guard on the <code>/auth</code> layout,
                and the layout init pattern above. Set the four env vars per app and all flows
                will work end-to-end.
              </p>
            </div>
          </div>
        </Section>

      </article>
    </div>
  );
}
