const BASE = "/api/v1";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    public readonly detail?: unknown
  ) {
    super(code);
  }
}

// ─── In-memory token store ────────────────────────────────────────────────────
let _at: string | null = null;
let _rt: string | null = null;
let _mfaPendingUser: string | null = null;

function getToken(): string | null { return _at; }
function getRefreshToken(): string | null { return _rt; }
export function getAccessToken(): string | null { return _at; }

export function getStoredTokens(): { at: string; rt: string } | null {
  return _at ? { at: _at, rt: _rt ?? "" } : null;
}

export function setTokens(access: string, refresh: string) {
  _at = access;
  _rt = refresh;
}

export function clearTokens() {
  _at = null;
  _rt = null;
  _mfaPendingUser = null;
}

export function getMfaPendingUser(): string | null { return _mfaPendingUser; }
export function setMfaPendingUser(userId: string) { _mfaPendingUser = userId; }
export function clearMfaPendingUser() { _mfaPendingUser = null; }

let refreshing: Promise<void> | null = null;

async function tryRefresh(): Promise<boolean> {

  try {
    const res = await fetch(`${BASE}/auth/token/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // refresh token sent automatically via HttpOnly cookie
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function requestForm<T>(path: string, form: FormData, retry = true): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (res.status === 401 && retry) {
    if (!refreshing) {
      refreshing = tryRefresh().then(() => { refreshing = null; });
    }
    await refreshing;
    if (getToken()) return requestForm<T>(path, form, false);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "unknown_error" }));
    throw new ApiError(body.error ?? "unknown_error", res.status, body);
  }
  return res.json() as T;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  retry = true
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401 && retry) {
    if (!refreshing) {
      refreshing = tryRefresh().then(() => { refreshing = null; });
    }
    await refreshing;
    if (getToken()) return request<T>(path, init, false);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "unknown_error" }));
    throw new ApiError(body.error ?? "unknown_error", res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as T;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return request("/auth/password/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export interface RegisterResponse {
  message: string;
}

export async function register(data: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<RegisterResponse> {
  return request("/auth/register", { method: "POST", body: JSON.stringify(data) });
}

export async function forgotPassword(email: string) {
  return request("/auth/password/reset/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, password: string) {
  return request("/auth/password/reset/confirm", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export async function verifyEmail(token: string) {
  return request("/auth/email/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function logout() {
  const body = _rt ? JSON.stringify({ refreshToken: _rt }) : undefined;
  await fetch("/api/v1/auth/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(_at ? { Authorization: `Bearer ${_at}` } : {}),
    },
    body,
  }).catch(() => {});
  clearTokens();
}

export async function logoutAll() {
  await request("/auth/logout-all", { method: "POST" }).catch(() => {});
  clearTokens();
}

// ─── Identity ────────────────────────────────────────────────────────────────

export interface Me {
  id: string;
  email: string;
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  status: string;
  createdAt: string;
}

export async function getMe(): Promise<Me> {
  return request("/me");
}

// ─── MFA ────────────────────────────────────────────────────────────────────

export interface MfaMethod {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  verifiedAt: string | null;
}

export async function getMfaMethods(): Promise<MfaMethod[]> {
  return request("/mfa/methods");
}

export async function setupTotp(): Promise<{
  methodId: string;
  secret: string;
  otpauthUrl: string;
}> {
  return request("/mfa/totp/setup", { method: "POST" });
}

export async function verifyTotp(methodId: string, code: string): Promise<{ success: boolean; recoveryCodes: string[] }> {
  return request("/mfa/totp/verify", {
    method: "POST",
    body: JSON.stringify({ methodId, code }),
  });
}

export async function challengeTotp(userId: string, code: string): Promise<{ success: boolean }> {
  return request("/mfa/totp/challenge", {
    method: "POST",
    body: JSON.stringify({ userId, code }),
  });
}

export async function disableMfa(): Promise<{ success: boolean }> {
  return request("/mfa/disable", { method: "POST" });
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export interface Session {
  id: string;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  riskStatus: string;
  device: { id: string; name: string | null; userAgent: string | null } | null;
}

export async function getSessions(): Promise<Session[]> {
  return request("/sessions");
}

export async function revokeSession(id: string): Promise<{ success: boolean }> {
  return request(`/sessions/${id}`, { method: "DELETE" });
}

export async function revokeAllSessions(): Promise<{ success: boolean }> {
  return request("/sessions/revoke-all", { method: "POST" });
}

// ─── Security ────────────────────────────────────────────────────────────────

export interface SecuritySummary {
  activeSessions: number;
  activeDevices: number;
  mfaEnabled: boolean;
  mfaMethods: string[];
  last30Days: { loginSuccess: number; loginFailures: number };
}

export async function getSecuritySummary(): Promise<SecuritySummary> {
  return request("/security/summary");
}

export interface SecurityEvent {
  id: string;
  eventType: string;
  ipAddress: string | null;
  userAgent: string | null;
  occurredAt: string;
  metadata: Record<string, unknown>;
}

export async function getSecurityEvents(): Promise<SecurityEvent[]> {
  return request("/security/events?limit=20");
}

// ─── Passkeys ────────────────────────────────────────────────────────────────

export interface PasskeyItem {
  id: string;
  deviceName: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

export async function getPasskeys(): Promise<PasskeyItem[]> {
  return request("/passkeys");
}

export async function deletePasskey(id: string): Promise<{ success: boolean }> {
  return request(`/passkeys/${id}`, { method: "DELETE" });
}

// ─── Organizations ────────────────────────────────────────────────────────────

export interface OrgItem {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  role: string;
  memberCount?: number;
}

export async function getOrganizations(): Promise<OrgItem[]> {
  return request("/organizations");
}

export async function createOrganization(data: { name: string; slug: string }): Promise<OrgItem> {
  return request("/organizations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function updateProfile(fields: {
  firstName?: string;
  lastName?: string;
  displayName?: string;
}): Promise<Me> {
  return request("/me", { method: "PATCH", body: JSON.stringify(fields) });
}

export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const form = new FormData();
  form.append("avatar", file);
  return requestForm("/account/avatar", form);
}

// ─── Activity ────────────────────────────────────────────────────────────────

export interface ActivityEvent {
  id: string;
  eventType: string;
  ipAddress: string | null;
  occurredAt: string;
  metadata: Record<string, unknown> | null;
}

export async function getActivityEvents(limit = 100): Promise<ActivityEvent[]> {
  return request(`/account/activity?limit=${limit}`);
}
