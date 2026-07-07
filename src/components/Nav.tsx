"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";

export default function Nav() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.removeItem("launchsequence_plan");
    localStorage.removeItem("launchsequence_briefing");
    router.push("/");
  }

  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "20px 32px",
      borderBottom: "1px solid var(--color-border)",
      background: "var(--color-bg)",
    }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
        <span className="instrument" style={{
          fontSize: "11px",
          letterSpacing: "0.12em",
          color: "var(--color-teal)",
          border: "1px solid rgba(14,178,205,0.4)",
          padding: "4px 8px",
          borderRadius: "var(--radius)",
        }}>LS</span>
        <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>
          Launch Sequence
        </span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <ThemeToggle />
        {isLoggedIn ? (
          <>
            <Link href="/dashboard" style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>
              My mission
            </Link>
            <button onClick={handleSignOut} className="back-link" style={{ fontSize: "13px" }}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>
              Sign in
            </Link>
            <Link href="/briefing" className="btn-primary" style={{ fontSize: "14px" }}>
              Start your mission
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
