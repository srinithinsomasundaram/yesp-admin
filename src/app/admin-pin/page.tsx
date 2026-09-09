"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/Spinner";

function PinContent() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/admin";

  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  async function verify(pin: string) {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        // Use hard navigation so the middleware re-reads the cookie
        window.location.href = next.startsWith("/admin") ? next : "/admin";
      } else {
        setError(true);
        const cleared = Array(6).fill("");
        setDigits(cleared);
        setTimeout(() => refs.current[0]?.focus(), 0);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(i: number, raw: string) {
    const char = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = char;
    setDigits(next);
    setError(false);

    if (char && i < 5) refs.current[i + 1]?.focus();
    if (next.every(Boolean)) verify(next.join(""));
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = [...Array(6).fill("")];
    text.split("").forEach((c, i) => { next[i] = c; });
    setDigits(next);
    if (text.length === 6) {
      verify(text);
    } else {
      refs.current[text.length]?.focus();
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-[14px] font-bold text-slate-900 tracking-tight">Yesp Identity</p>
          <p className="text-[10px] text-red-500 font-semibold uppercase tracking-widest mt-0.5">Admin Console</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-slate-100 mb-4">
              <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-[18px] font-semibold text-slate-900 leading-tight">Admin access</h1>
            <p className="text-sm text-slate-500 mt-1.5">Enter the 6-digit PIN to continue</p>
          </div>

          <div className="flex gap-2 justify-center mb-5" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => { refs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                autoFocus={i === 0}
                disabled={loading}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={[
                  "w-10 h-12 text-center text-lg font-semibold rounded-lg border-2 transition-all outline-none",
                  "disabled:opacity-50",
                  error
                    ? "border-red-400 bg-red-50 text-red-700 focus:border-red-500"
                    : "border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-50",
                ].join(" ")}
              />
            ))}
          </div>

          {error && (
            <p className="text-[13px] text-red-600 text-center font-medium mb-4">
              Incorrect PIN — try again
            </p>
          )}

          {loading && (
            <div className="flex justify-center">
              <Spinner className="w-5 h-5 text-blue-600" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPinPage() {
  return <Suspense><PinContent /></Suspense>;
}
