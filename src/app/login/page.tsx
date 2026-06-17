"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Nav from "@/components/Nav";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          {sent ? (
            <div className="text-center">
              <div className="instrument text-[var(--color-teal)] text-lg mb-4">
                Check your inbox
              </div>
              <p style={{ color: "var(--color-text-tertiary)", fontSize: "14px", lineHeight: "1.7" }}>
                We sent a sign-in link to <strong style={{ color: "var(--color-text-primary)" }}>{email}</strong>.
                Click it and you will land straight on your mission dashboard.
                You can close this tab.
              </p>
            </div>
          ) : (
            <>
              <p className="eyebrow mb-6">Mission access</p>
              <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>
                Sign in to Launch Sequence
              </h1>
              <p style={{ color: "var(--color-text-tertiary)", fontSize: "14px", marginBottom: "32px", lineHeight: "1.6" }}>
                Enter your email and we will send you a sign-in link.
                No password needed.
              </p>

              <div style={{ marginBottom: "16px" }}>
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="you@company.com"
                  autoFocus
                />
              </div>

              {error && (
                <div style={{
                  marginBottom: "16px",
                  padding: "12px 16px",
                  background: "rgba(245, 166, 35, 0.08)",
                  border: "1px solid rgba(245, 166, 35, 0.35)",
                  borderRadius: "var(--radius)",
                  fontSize: "14px",
                  color: "var(--color-amber)",
                }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!email.trim() || loading}
                className="btn-primary w-full"
                style={{ width: "100%", justifyContent: "center" }}
              >
                {loading ? "Sending..." : "Send sign-in link"}
              </button>

              <p style={{ marginTop: "24px", fontSize: "13px", color: "var(--color-text-tertiary)", textAlign: "center" }}>
                No account yet?{" "}
                <a href="/briefing" style={{ color: "var(--color-teal)" }}>
                  Start your mission briefing
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
