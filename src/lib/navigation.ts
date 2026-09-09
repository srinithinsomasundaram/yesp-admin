import { getStoredTokens } from "./api";

export const AUTH_URL    = process.env.NEXT_PUBLIC_AUTH_URL    || "";
export const CONSOLE_URL = process.env.NEXT_PUBLIC_CONSOLE_URL || "";

// Canonical fallbacks so navigation works even when env vars are missing
export const CONSOLE_BASE = CONSOLE_URL || "https://accounts.yesp.space";

/**
 * Navigates to console domain (accounts.yesp.space).
 * Always cross-domain from admin, so passes tokens via /bridge URL fragment.
 */
export function navigateToConsole(
  targetPath: string = "/console",
  router?: { push: (url: string) => void; replace: (url: string) => void }
) {
  if (typeof window === "undefined") return;

  try {
    const isCrossDomain = window.location.origin !== new URL(CONSOLE_BASE).origin;
    if (isCrossDomain) {
      const tokens = getStoredTokens();
      if (tokens && tokens.at) {
        const frag: Record<string, string> = { at: tokens.at, next: targetPath };
        if (tokens.rt) frag.rt = tokens.rt;
        window.location.href = `${CONSOLE_BASE}/bridge#${new URLSearchParams(frag).toString()}`;
      } else {
        window.location.href = `${CONSOLE_BASE}${targetPath}`;
      }
      return;
    }
  } catch { /* URL parse error — fall through to same-domain nav */ }

  if (router) router.push(targetPath);
  else window.location.href = targetPath;
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
