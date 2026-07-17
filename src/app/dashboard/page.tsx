"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Nav from "@/components/Nav";
import Link from "next/link";
import CoachingCTA from "@/components/CoachingCTA";

interface BriefingRow {
  id: string;
  start_date: string;
  role: string;
  company_stage: string;
  transition_type?: string;
  created_at: string;
}

interface PlanRow {
  id: string;
  plan_data: Record<string, unknown>;
  created_at: string;
  briefing_id: string;
  is_current: boolean;
}

interface CheckIn {
  id: string;
  energy_level: number;
  created_at: string;
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

const ENERGY_COLORS = ["", "#F5A623", "#c8a45a", "#0EB2CD", "#6AE8A4"];

function MiniSparkline({ data }: { data: CheckIn[] }) {
  if (data.length < 2) {
    // Just show the last energy level as a colored dot
    const last = data[0];
    if (!last) return null;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "6px" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: ENERGY_COLORS[last.energy_level], flexShrink: 0 }} />
        <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: ENERGY_COLORS[last.energy_level] }}>
          {last.energy_level}/4 last check-in
        </span>
      </div>
    );
  }

  const W = 120;
  const H = 32;
  const padX = 4;
  const padY = 4;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;
  const xStep = chartW / (data.length - 1);

  const points = data.map((d, i) => {
    const x = padX + i * xStep;
    const y = padY + chartH - ((d.energy_level - 1) / 3) * chartH;
    return `${x},${y}`;
  }).join(" ");

  const last = data[data.length - 1];

  return (
    <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-label="Energy trend sparkline">
        <polyline
          points={points}
          fill="none"
          stroke="var(--color-teal)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
        />
        {data.map((d, i) => (
          <circle
            key={d.id}
            cx={padX + i * xStep}
            cy={padY + chartH - ((d.energy_level - 1) / 3) * chartH}
            r="2.5"
            fill={ENERGY_COLORS[d.energy_level]}
          />
        ))}
      </svg>
      <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: ENERGY_COLORS[last.energy_level] }}>
        {last.energy_level}/4
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<BriefingRow | null>(null);
  const [plan, setPlan] = useState<PlanRow | null>(null);
  const [pastMissions, setPastMissions] = useState<BriefingRow[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [showNewMissionConfirm, setShowNewMissionConfirm] = useState(false);
  const [startingNew, setStartingNew] = useState(false);
  const [showPastMissions, setShowPastMissions] = useState(false);
  const [recentCheckins, setRecentCheckins] = useState<CheckIn[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserEmail(user.email || "");

      // Check for pending plan in localStorage
      const sessionPlan = localStorage.getItem("launchsequence_plan");
      const sessionBriefing = localStorage.getItem("launchsequence_briefing");

      if (sessionPlan && sessionBriefing) {
        try {
          const briefingData = JSON.parse(sessionBriefing);
          const planData = JSON.parse(sessionPlan);

          // Archive any existing current plan first
          await supabase
            .from("plans")
            .update({ is_current: false })
            .eq("user_id", user.id)
            .eq("is_current", true);

          const { data: briefingRow } = await supabase
            .from("briefings")
            .insert({
              user_id: user.id,
              role: `${briefingData.function_area} — ${briefingData.level || "Entry level"}`,
              transition_type: briefingData.transition_type,
              seniority_change: briefingData.seniority_change,
              company_stage: briefingData.company_stage,
              company_stage_detail: briefingData.company_stage_detail,
              team_situation: briefingData.team_situation,
              team_situation_detail: briefingData.team_situation_detail,
              reporting_to: briefingData.reporting_to,
              team_size: briefingData.team_size,
              team_size_detail: briefingData.team_size_detail,
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
              is_current: true,
              version: 1,
            });
          }

          localStorage.removeItem("launchsequence_plan");
          localStorage.removeItem("launchsequence_briefing");
        } catch (e) {
          console.error("Failed to save session data:", e);
        }
      }

      // Load current mission
      const { data: briefingRow } = await supabase
        .from("briefings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!briefingRow) {
        setLoading(false);
        return;
      }

      setBriefing(briefingRow);

      const { data: planRow } = await supabase
        .from("plans")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_current", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (planRow) setPlan(planRow);

      // Load recent Ground Control check-ins for sparkline
      const { data: checkinsData } = await supabase
        .from("systems_checks")
        .select("id, energy_level, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(8);

      if (checkinsData) setRecentCheckins(checkinsData);

      // Load past missions (all but the most recent)
      const { data: allBriefings } = await supabase
        .from("briefings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (allBriefings && allBriefings.length > 1) {
        setPastMissions(allBriefings.slice(1));
      }

      setLoading(false);
    }

    load();
  }, [router]);

  async function handleConfirmNewMission() {
    setStartingNew(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Archive current plan
    await supabase
      .from("plans")
      .update({ is_current: false })
      .eq("user_id", user.id)
      .eq("is_current", true);

    // Clear localStorage and go to briefing
    localStorage.removeItem("launchsequence_plan");
    localStorage.removeItem("launchsequence_briefing");
    router.push("/briefing");
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.clear();
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
    : days > 90
    ? `Day ${days} — Mission complete`
    : `Day ${days} of 90`;

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <div style={{ flex: 1, maxWidth: "900px", margin: "0 auto", width: "100%", padding: "2.5rem 2rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <p className="eyebrow" style={{ marginBottom: "8px" }}>Mission dashboard</p>
          <div style={{ marginBottom: "8px" }}>
            <h1 style={{ fontSize: "clamp(1.4rem, 5vw, 2rem)", marginBottom: "4px" }}>{briefing.role}</h1>
            <p style={{ color: "var(--color-text-tertiary)", fontSize: "14px" }}>{briefing.company_stage}</p>
          </div>
          <div>
            <div className="instrument" style={{ fontSize: "clamp(1rem, 4vw, 1.5rem)", color: "var(--color-teal)" }}>{daysLabel}</div>
            <div style={{ fontSize: "13px", color: "var(--color-text-tertiary)", marginTop: "2px" }}>Current phase: {phase}</div>
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

        {/* Action cards — 2x2 grid */}
        <div style={{ marginBottom: "2.5rem" }}>
          {/* Row 1: Flight Plan + Ground Control */}
          <div className="dashboard-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "16px" }}>

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

            <Link href="/ground-control" style={{ textDecoration: "none" }}>
              <div className="card" style={{ cursor: "pointer", transition: "all 0.2s", height: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid rgba(245,166,35,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-amber)", flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19.5 12.572l-7.5 7.428l-7.5-7.428A5 5 0 1112 6.006a5 5 0 117.5 6.566"/></svg>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>Ground control</div>
                </div>
                <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)", lineHeight: "1.5", margin: 0 }}>
                  Weekly wellbeing check-ins. How are you actually holding up?
                </p>
                {recentCheckins.length > 0 && (
                  <MiniSparkline data={recentCheckins} />
                )}
              </div>
            </Link>

          </div>

          {/* Row 2: Captain's Log + Flight Crew */}
          <div className="dashboard-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>

            <Link href="/captains-log" style={{ textDecoration: "none" }}>
              <div className="card" style={{ cursor: "pointer", transition: "all 0.2s", height: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid rgba(106,232,164,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-mint)", flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>Captain's log</div>
                </div>
                <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)", lineHeight: "1.5", margin: 0 }}>
                  Notes, observations, and reflections as you go.
                </p>
              </div>
            </Link>

            <Link href="/flight-crew" style={{ textDecoration: "none" }}>
              <div className="card" style={{ cursor: "pointer", transition: "all 0.2s", height: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid rgba(167,139,250,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a78bfa", flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>Flight crew</div>
                </div>
                <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)", lineHeight: "1.5", margin: 0 }}>
                  The people who matter to this transition. Track who to meet and what you are learning.
                </p>
              </div>
            </Link>

          </div>
        </div>

        {/* Coaching CTA */}
        <div style={{
          padding: "16px 20px",
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border-subtle)",
          borderRadius: "var(--radius)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "2rem",
        }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "2px" }}>
              Want support with this transition?
            </p>
            <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)", margin: 0 }}>
              Leah is available to work with you directly.
            </p>
          </div>
          <CoachingCTA trigger="button" label="Work with Leah" context="dashboard" />
        </div>

        {/* Past missions */}
        {pastMissions.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
            <button
              onClick={() => setShowPastMissions(!showPastMissions)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                color: "var(--color-text-tertiary)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0",
                marginBottom: showPastMissions ? "12px" : "0",
              }}
            >
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: showPastMissions ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}
              >
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              Past missions ({pastMissions.length})
            </button>

            {showPastMissions && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {pastMissions.map((m) => {
                  const mDays = getDaysFromStart(m.start_date);
                  const mDate = new Date(m.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" });
                  return (
                    <div key={m.id} style={{
                      padding: "12px 16px",
                      background: "var(--color-bg-card)",
                      border: "1px solid var(--color-border-subtle)",
                      borderRadius: "var(--radius)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "2px" }}>
                          {m.role}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--color-text-minimum)" }}>
                          {mDate} · {mDays > 90 ? "Completed" : mDays < 0 ? "Archived before launch" : `Day ${mDays}`}
                        </div>
                      </div>
                      <Link
                        href={`/plan?briefing=${m.id}`}
                        style={{
                          fontSize: "12px",
                          color: "var(--color-teal)",
                          textDecoration: "none",
                          flexShrink: 0,
                          padding: "4px 10px",
                          border: "1px solid rgba(14,178,205,0.3)",
                          borderRadius: "var(--radius)",
                        }}
                      >
                        View plan
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* New mission confirmation dialog */}
        {showNewMissionConfirm && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "1.5rem",
          }}>
            <div style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius)",
              padding: "2rem",
              maxWidth: "440px",
              width: "100%",
            }}>
              <h2 style={{ fontSize: "1.3rem", marginBottom: "12px" }}>Start a new mission?</h2>
              <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: "1.7", marginBottom: "8px" }}>
                Your current mission — <strong style={{ color: "var(--color-text-primary)" }}>{briefing.role}</strong> — will be archived. You can still view it under "Past missions" on your dashboard.
              </p>
              <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: "1.7", marginBottom: "24px" }}>
                Your Captain's Log entries and Ground Control check-ins are saved and will remain accessible.
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={handleConfirmNewMission}
                  disabled={startingNew}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  {startingNew ? "Archiving..." : "Yes, start new mission"}
                </button>
                <button
                  onClick={() => setShowNewMissionConfirm(false)}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border-subtle)", flexWrap: "wrap", gap: "12px" }}>
          <span style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>{userEmail}</span>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <button
              onClick={() => setShowNewMissionConfirm(true)}
              style={{
                fontSize: "13px",
                color: "var(--color-teal)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              New mission
            </button>
            <button onClick={handleSignOut} className="back-link" style={{ fontSize: "13px" }}>
              Sign out
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
