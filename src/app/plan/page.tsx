"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";

interface PlanAction {
  title: string;
  description: string;
  category: "relationships" | "strategy" | "self" | "logistics";
}

interface PlanPhase {
  title: string;
  description: string;
  actions: PlanAction[];
  reflection: string;
}

interface Plan {
  t10: PlanPhase;
  observe: PlanPhase;
  orient: PlanPhase;
  act: PlanPhase;
}

const categoryStyles: Record<string, { color: string; label: string; bg: string; border: string }> = {
  relationships: {
    color: "var(--color-teal)",
    label: "Relationships",
    bg: "rgba(14, 178, 205, 0.08)",
    border: "rgba(14, 178, 205, 0.25)",
  },
  strategy: {
    color: "var(--color-mint)",
    label: "Strategy",
    bg: "rgba(106, 232, 164, 0.08)",
    border: "rgba(106, 232, 164, 0.25)",
  },
  self: {
    color: "var(--color-amber)",
    label: "Self",
    bg: "rgba(245, 166, 35, 0.08)",
    border: "rgba(245, 166, 35, 0.25)",
  },
  logistics: {
    color: "rgba(255,255,255,0.55)",
    label: "Logistics",
    bg: "rgba(255, 255, 255, 0.03)",
    border: "rgba(255, 255, 255, 0.1)",
  },
};

const phaseKeys: (keyof Plan)[] = ["t10", "observe", "orient", "act"];

const phaseNumbers: Record<string, string> = {
  t10:     "T-10",
  observe: "01\u201330",
  orient:  "31\u201360",
  act:     "61\u201390",
};

export default function PlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [activePhase, setActivePhase] = useState<keyof Plan>("t10");
  const [saveEmail, setSaveEmail] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [saveError, setSaveError] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("launchsequence_plan");
    if (stored) {
      try {
        setPlan(JSON.parse(stored));
      } catch {
        router.push("/briefing");
      }
    } else {
      router.push("/briefing");
    }

    // Check if already logged in
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setIsLoggedIn(true);
    });
  }, [router]);

  async function handleSavePlan() {
    if (!saveEmail.trim() || !plan) return;
    setSaveStatus("sending");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email: saveEmail.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      console.error("Supabase OTP error:", error.message, error.status, error);
      setSaveStatus("error");
      setSaveError(error.message);
      return;
    }

    setSaveStatus("sent");
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <div className="generating">Loading flight plan...</div>
        </div>
      </div>
    );
  }

  const phase = plan[activePhase];

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      {/* Save banner — shown until logged in or sent */}
      {!isLoggedIn && saveStatus !== "sent" && (
        <div style={{
          background: "rgba(14,178,205,0.06)",
          borderBottom: "1px solid rgba(14,178,205,0.2)",
          padding: "12px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}>
          <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)", margin: 0 }}>
            Your plan is ready. Save it so you can come back any time.
          </p>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
            <input
              type="email"
              value={saveEmail}
              onChange={(e) => setSaveEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSavePlan()}
              placeholder="your@email.com"
              style={{ width: "220px", padding: "8px 12px", fontSize: "13px", marginBottom: 0 }}
            />
            <button
              onClick={handleSavePlan}
              disabled={!saveEmail.trim() || saveStatus === "sending"}
              className="btn-primary"
              style={{ padding: "8px 16px", fontSize: "13px" }}
            >
              {saveStatus === "sending" ? "Sending..." : "Save plan"}
            </button>
          </div>
          {saveStatus === "error" && (
            <p style={{ fontSize: "13px", color: "var(--color-amber)", margin: 0, width: "100%" }}>
              {saveError || "Something went wrong. Check the email address and try again."}
            </p>
          )}
        </div>
      )}

      {/* Sent confirmation */}
      {saveStatus === "sent" && (
        <div style={{
          background: "rgba(106,232,164,0.06)",
          borderBottom: "1px solid rgba(106,232,164,0.2)",
          padding: "12px 32px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-mint)", flexShrink: 0 }} aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <p style={{ fontSize: "13px", color: "var(--color-mint)", margin: 0 }}>
            Check your email for a sign-in link. Click it to save your plan and access your mission dashboard.
          </p>
        </div>
      )}

      <div style={{ flex: 1, display: "flex" }}>

        {/* Sidebar */}
        <aside style={{
          width: "240px",
          borderRight: "1px solid var(--color-border-subtle)",
          padding: "1.5rem",
          flexShrink: 0,
        }}>
          <p className="eyebrow" style={{ marginBottom: "16px" }}>Mission phases</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {phaseKeys.map((key) => (
              <button
                key={key}
                onClick={() => setActivePhase(key)}
                className={`sidebar-item ${activePhase === key ? "active" : ""}`}
              >
                <span className="instrument" style={{ fontSize: "12px", marginRight: "8px", opacity: 0.7 }}>
                  {phaseNumbers[key]}
                </span>
                {plan[key].title.split(": ")[1] || plan[key].title}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border-subtle)" }}>
            <p className="eyebrow" style={{ marginBottom: "12px" }}>Legend</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.entries(categoryStyles).map(([key, style]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: style.color,
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>
                    {style.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: "2rem 2.5rem", maxWidth: "760px" }}>

          {/* Phase header */}
          <div style={{ marginBottom: "2rem" }}>
            <div className="phase-number" style={{ fontSize: "1.5rem", marginBottom: "8px" }}>
              {phaseNumbers[activePhase]}
            </div>
            <h1 style={{ fontSize: "2rem", marginBottom: "12px" }}>{phase.title}</h1>
            <p style={{ fontSize: "15px", lineHeight: "1.7", color: "var(--color-text-secondary)", maxWidth: "560px" }}>
              {phase.description}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "2.5rem" }}>
            {phase.actions.map((action, i) => {
              const cat = categoryStyles[action.category] || categoryStyles.logistics;
              return (
                <div key={i} style={{
                  background: cat.bg,
                  border: `1px solid ${cat.border}`,
                  borderRadius: "var(--radius)",
                  padding: "1.1rem 1rem",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: cat.color,
                      marginTop: "6px",
                      flexShrink: 0,
                    }} />
                    <div>
                      <div style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "var(--color-text-primary)",
                        marginBottom: "4px",
                      }}>
                        {action.title}
                      </div>
                      <div style={{
                        fontSize: "14px",
                        color: "var(--color-text-secondary)",
                        lineHeight: "1.6",
                      }}>
                        {action.description}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reflection prompt */}
          <div className="card-warm">
            <p className="eyebrow" style={{ color: "var(--color-amber)", marginBottom: "8px" }}>
              Reflection
            </p>
            <p style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.15rem",
              fontWeight: 300,
              fontStyle: "italic",
              color: "var(--color-text-primary)",
              lineHeight: "1.6",
              margin: 0,
            }}>
              {phase.reflection}
            </p>
          </div>

        </main>
      </div>
    </div>
  );
}
