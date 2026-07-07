"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Nav from "@/components/Nav";
import Link from "next/link";

interface PlanPhase {
  title: string;
  description: string;
  actions: { title: string; description: string; category: string }[];
  reflection: string;
}

interface Plan {
  t10: PlanPhase;
  observe: PlanPhase;
  orient: PlanPhase;
  act: PlanPhase;
}

interface BriefingRow {
  id: string;
  start_date: string;
  role: string;
  company_stage: string;
}

interface PlanRow {
  id: string;
  plan_data: Plan;
  created_at: string;
  briefing_id: string;
}

function getDaysFromStart(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function getCurrentPhase(days: number): string {
  if (days < 0) return "T-10";
  if (days <= 30) return "Observe";
  if (days <= 60) return "Orient";
  return "Act";
}

function getPhaseProgress(days: number): number {
  if (days < 0) return Math.max(0, ((10 + days) / 10) * 25);
  if (days <= 30) return 25 + (days / 30) * 25;
  if (days <= 60) return 50 + ((days - 30) / 30) * 25;
  return 75 + Math.min((days - 60) / 30, 1) * 25;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<BriefingRow | null>(null);
  const [plan, setPlan] = useState<PlanRow | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserEmail(user.email || "");

      // Check if we have a pending plan in sessionStorage to save
      const sessionPlan = sessionStorage.getItem("launchsequence_plan");
      const sessionBriefing = sessionStorage.getItem("launchsequence_briefing");

      if (sessionPlan && sessionBriefing) {
        try {
          const briefingData = JSON.parse(sessionBriefing);
          const planData = JSON.parse(sessionPlan);

          // Check if already saved (avoid duplicates)
          const { data: existingPlans } = await supabase
            .from("plans")
            .select("id")
            .eq("user_id", user.id)
            .limit(1);

          if (!existingPlans || existingPlans.length === 0) {
            // Save briefing
            const { data: briefingRow } = await supabase
              .from("briefings")
              .insert({
                user_id: user.id,
                role: `${briefingData.function_area} — ${briefingData.level}`,
                company_stage: briefingData.company_stage,
                team_situation: briefingData.team_situation,
                reporting_to: briefingData.reporting_to,
                team_size: briefingData.team_size,
                start_date: briefingData.start_date,
                biggest_concern: briefingData.biggest_concern,
                what_success_looks_like: briefingData.what_success_looks_like,
              })
              .select()
              .single();

            if (briefingRow) {
              await supabase.from("plans").insert({
                user_id: user.id,
                briefing_id: briefingRow.id,
                plan_data: planData,
              });
            }
          }

          // Clear sessionStorage now that it's saved
          sessionStorage.removeItem("launchsequence_plan");
          sessionStorage.removeItem("launchsequence_briefing");
        } catch (e) {
          console.error("Failed to save session data:", e);
        }
      }

      // Load from Supabase
      const { data: briefingRow } = await supabase
        .from("briefings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!briefingRow) {
        // No plan yet — show the dashboard with a CTA to start, don't redirect
        setLoading(false);
        return;
      }

      setBriefing(briefingRow);

      const { data: planRow } = await supabase
        .from("plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (planRow) setPlan(planRow);
      setLoading(false);
    }

    load();
  }, [router]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    sessionStorage.clear();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <div className="generating">Loading mission data...</div>
        </div>
      </div>
    );
  }

  if (!plan || !briefing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center px-6 text-center">
          <div>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "12px" }}>No mission found</h2>
            <p style={{ color: "var(--color-text-tertiary)", marginBottom: "24px" }}>
              Let us build your personalized flight plan.
            </p>
            <Link href="/briefing" className="btn-primary">Begin mission briefing</Link>
          </div>
        </div>
      </div>
    );
  }

  const days = getDaysFromStart(briefing.start_date);
  const phase = getCurrentPhase(days);
  const progress = getPhaseProgress(days);
  const daysLabel = days < 0
    ? `T${days} — ${Math.abs(days)} days to launch`
    : `Day ${days} of 90`;

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <div style={{ flex: 1, maxWidth: "900px", margin: "0 auto", width: "100%", padding: "2.5rem 2rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <p className="eyebrow" style={{ marginBottom: "8px" }}>Mission dashboard</p>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: "2rem", marginBottom: "4px" }}>{briefing.role}</h1>
              <p style={{ color: "var(--color-text-tertiary)", fontSize: "14px" }}>{briefing.company_stage}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="instrument" style={{ fontSize: "1.5rem", color: "var(--color-teal)" }}>{daysLabel}</div>
              <div style={{ fontSize: "13px", color: "var(--color-text-tertiary)", marginTop: "2px" }}>Current phase: {phase}</div>
            </div>
          </div>
        </div>

        {/* Progress track */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            {["T-10", "Observe", "Orient", "Act"].map((p) => (
              <span key={p} style={{
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                color: p === phase ? "var(--color-teal)" : "var(--color-text-tertiary)",
                fontWeight: p === phase ? 700 : 400,
              }}>{p}</span>
            ))}
          </div>
          <div className="progress-track" style={{ height: "4px" }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Action cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginBottom: "2.5rem" }}>

          {/* Flight Plan */}
          <Link href="/plan" style={{ textDecoration: "none" }}>
            <div className="card" style={{ cursor: "pointer", transition: "all 0.2s", height: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid rgba(14,178,205,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-teal)", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3V7z"/><path d="M9 4v13"/><path d="M15 7v13"/></svg>
                </div>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>Flight plan</div>
              </div>
              <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)", lineHeight: "1.5", margin: 0 }}>
                Your personalized 90-day transition plan. Review your actions and reflection prompts for each phase.
              </p>
            </div>
          </Link>

          {/* Ground Control — Phase 2 */}
          <div className="card" style={{ opacity: 0.5, cursor: "not-allowed" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid rgba(245,166,35,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-amber)", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19.5 12.572l-7.5 7.428l-7.5-7.428A5 5 0 1112 6.006a5 5 0 117.5 6.566"/></svg>
              </div>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>Ground control</div>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--color-amber)", marginLeft: "auto" }}>Soon</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)", lineHeight: "1.5", margin: 0 }}>
              Weekly wellbeing check-ins. How are you actually holding up?
            </p>
          </div>

          {/* Captain's Log — Phase 2 */}
          <div className="card" style={{ opacity: 0.5, cursor: "not-allowed" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid rgba(106,232,164,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-mint)", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>Captain's log</div>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--color-mint)", marginLeft: "auto" }}>Soon</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)", lineHeight: "1.5", margin: 0 }}>
              Weekly reflections tied to your current phase.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border-subtle)" }}>
          <span style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>{userEmail}</span>
          <button onClick={handleSignOut} className="back-link" style={{ fontSize: "13px" }}>
            Sign out
          </button>
        </div>

      </div>
    </div>
  );
}
