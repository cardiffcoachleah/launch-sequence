"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Nav() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "20px 32px",
      borderBottom: "1px solid var(--color-border)",
    }}>
      <Link href={isLoggedIn ? "/dashboard" : "/"} style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
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

      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        {isLoggedIn ? (
          <Link href="/dashboard" className="btn-primary" style={{ fontSize: "14px" }}>
            My mission
          </Link>
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
