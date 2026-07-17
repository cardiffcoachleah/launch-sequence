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
      padding: "14px 20px",
      borderBottom: "1px solid var(--color-border)",
      background: "var(--color-bg)",
      gap: "8px",
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", flexShrink: 0 }}>
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "26px",
          height: "26px",
          border: "1px solid rgba(14,178,205,0.4)",
          borderRadius: "4px",
          overflow: "hidden",
          flexShrink: 0,
        }}>
          <span className="instrument" style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "var(--color-teal)",
            display: "inline-block",
            transform: "skewX(-30deg)",
          }}>LS</span>
        </span>
        {/* Hide wordmark on very small screens */}
        <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}
          className="nav-wordmark">
          Launch Sequence
        </span>
      </Link>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        <ThemeToggle />
        {isLoggedIn ? (
          <>
            <Link href="/dashboard" className="btn-primary" style={{ fontSize: "13px", padding: "8px 14px", whiteSpace: "nowrap" }}>
              My mission
            </Link>
            <button onClick={handleSignOut} className="back-link" style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" style={{ fontSize: "13px", color: "var(--color-text-tertiary)", whiteSpace: "nowrap" }}>
              Sign in
            </Link>
            <Link href="/briefing" className="btn-primary" style={{ fontSize: "13px", padding: "8px 14px", whiteSpace: "nowrap" }}>
              Start
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
