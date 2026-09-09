import { getStoredTokens } from "./api";

export const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || "";
export const CONSOLE_URL = process.env.NEXT_PUBLIC_CONSOLE_URL || "";

export function getAuthHost(): string {
  if (!AUTH_URL) return typeof window !== "undefined" ? window.location.hostname : "";
  try {
    return new URL(AUTH_URL).hostname;
  } catch {
    return "";
  }
}

export function getConsoleHost(): string {
  if (!CONSOLE_URL) return typeof window !== "undefined" ? window.location.hostname : "";
  try {
    return new URL(CONSOLE_URL).hostname;
  } catch {
    return "";
  }
}

/**
 * Navigates to console domain (accounts.yesp.space).
 * If caller is on another origin (e.g. auth.yesp.space), passes tokens via /bridge URL fragment.
 */
export function navigateToConsole(
  targetPath: string = "/console",
  router?: { push: (url: string) => void; replace: (url: string) => void }
) {
  if (typeof window === "undefined") return;

  const targetHost = getConsoleHost();
  const currentHost = window.location.hostname;
  const isCrossDomain = Boolean(targetHost && currentHost !== targetHost && CONSOLE_URL);

  if (isCrossDomain) {
    const tokens = getStoredTokens();
    if (tokens && tokens.at && tokens.rt) {
      const frag = new URLSearchParams({ at: tokens.at, rt: tokens.rt, next: targetPath });
      window.location.href = `${CONSOLE_URL}/bridge#${frag.toString()}`;
    } else {
      window.location.href = `${CONSOLE_URL}${targetPath}`;
    }
  } else {
    if (router) {
      router.push(targetPath);
    } else {
      window.location.href = targetPath;
    }
  }
}

/**
 * Navigates to auth domain (auth.yesp.space).
 */
export function navigateToAuth(
  targetPath: string = "/auth/login",
  router?: { push: (url: string) => void; replace: (url: string) => void }
) {
  if (typeof window === "undefined") return;

  const targetHost = getAuthHost();
  const currentHost = window.location.hostname;
  const isCrossDomain = Boolean(targetHost && currentHost !== targetHost && AUTH_URL);

  if (isCrossDomain) {
    window.location.href = `${AUTH_URL}${targetPath}`;
  } else {
    if (router) {
      router.push(targetPath);
    } else {
      window.location.href = targetPath;
    }
  }
}
