"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { setTokens, getStoredTokens } from "@/lib/api";
import { Spinner } from "@/components/Spinner";

const AUTH_URL = (process.env.NEXT_PUBLIC_AUTH_URL ?? "https://auth.yesp.space").replace(/\/$/, "");
const ADMIN_URL = (process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.yesp.space").replace(/\/$/, "");

export default function BridgePage() {
  const router = useRouter();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const at = params.get("at");
    const rt = params.get("rt") ?? "";
    const next = params.get("next") ?? "/admin";

    if (at) {
      setTokens(at, rt);
      history.replaceState(null, "", "/bridge");
      router.replace(next);
      return;
    }

    if (getStoredTokens()) {
      router.replace(next);
      return;
    }

    // No access token — try silent refresh via HttpOnly RT cookie
    fetch("/api/v1/auth/token/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("refresh_failed");
        const data = await res.json() as { accessToken: string; refreshToken?: string };
        setTokens(data.accessToken, data.refreshToken ?? "");
        router.replace(next);
      })
      .catch(() => {
        window.location.href = `${AUTH_URL}/auth/login?next=${encodeURIComponent(ADMIN_URL + "/admin")}`;
      });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Spinner className="w-7 h-7 text-blue-600" />
    </div>
  );
}
