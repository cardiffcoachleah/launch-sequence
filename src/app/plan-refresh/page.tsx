"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type RefreshMode = null | "add" | "edit" | "rethink";
type RethinkStep = "briefing" | "generating";

interface BriefingData {
  function_area: string;
  transition_type: string;
  seniority_change: string;
  level: string;
  company_stage: string;
  company_stage_detail: string;
  team_situation: string;
  team_situation_detail: string;
  team_size_detail: string;
  reporting_to: string;
  team_size: string;
  start_date: string;
  biggest_concern: string;
  what_success_looks_like: string;
}

const RETHINK_QUESTIONS = [
  { id: "biggest_concern", label: "What are you most concerned about now?", sublabel: "This may have changed since you started.", type: "textarea", field: "biggest_concern" as keyof BriefingData },
  { id: "what_success_looks_like", label: "What does success look like from here?", sublabel: "Update this based on what you have learned.", type: "textarea", field: "what_success_looks_like" as keyof BriefingData },
  { id: "company_stage_detail", label: "Anything new about the company context?", sublabel: "Optional — what have you learned about the company that changes the picture?", type: "textarea-optional", field: "company_stage_detail" as keyof BriefingData },
  { id: "team_situation_detail", label: "Anything new about the team situation?", sublabel: "Optional — what have you discovered about the team that was not in your original briefing?", type: "textarea-optional", field: "team_situation_detail" as keyof BriefingData },
];

export default function PlanRefreshPage() {
  const router = useRouter();
  const [mode, setMode] = useState<RefreshMode>(null);
  const [loading, setLoading] = useState(true);
  const [planId, setPlanId] = useState<string | null>(null);
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Record<string, unknown> | null>(null);
  const [currentPhase, setCurrentPhase] = useState("observe");

  // Add mode state
  const [addContext, setAddContext] = useState("");
  const [addPhase, setAddPhase] = useState("observe");
  const [addGenerating, setAddGenerating] = useState(false);
  const [addError, setAddError] = useState("");

  // Rethink mode state
  const [rethinkStep, setRethinkStep] = useState<RethinkStep>("briefing");
  const [rethinkQStep, setRethinkQStep] = useState(0);
  const [rethinkData, setRethinkData] = useState<Partial<BriefingData>>({});
  const [rethinkGenerating, setRethinkGenerating] = useState(false);
  const [rethinkError, setRethinkError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: planRow } = await supabase
        .from("plans")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_current", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!planRow) {
        router.push("/briefing");
        return;
      }

      setPlanId(planRow.id);
      setCurrentPlan(planRow.plan_data);

      const { data: briefingRow } = await supabase
        .from("briefings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (briefingRow) {
        setBriefing(briefingRow as BriefingData);
        setRethinkData({
          biggest_concern: briefingRow.biggest_concern || "",
          what_success_looks_like: briefingRow.what_success_looks_like || "",
          company_stage_detail: briefingRow.company_stage_detail || "",
          team_situation_detail: briefingRow.team_situation_detail || "",
        });

        // Determine current phase from start date
        const start = new Date(briefingRow.start_date);
        const days = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (days < 0) setCurrentPhase("t10");
        else if (days <= 30) setCurrentPhase("observe");
        else if (days <= 60) setCurrentPhase("orient");
        else { setCurrentPhase("act"); setAddPhase("act"); }
      }

      setLoading(false);
    }
    load();
  }, [router]);

  // ADD: generate targeted new actions
  async function handleAdd() {
    if (!addContext.trim() || !planId || !briefing) return;
    setAddGenerating(true);
    setAddError("");

    try {
      const res = await fetch("/api/refresh-plan/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: addContext,
          phase: addPhase,
          briefing,
          existing_plan: currentPlan,
        }),
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || "Failed");

      // Merge new actions into the current plan
      const supabase = createClient();
      const updatedPlan = { ...(currentPlan as Record<string, unknown>) };
      const phaseData = updatedPlan[addPhase] as { actions: unknown[] } | undefined;
      if (phaseData) {
        phaseData.actions = [...(phaseData.actions || []), ...result.new_actions];
      }

      await supabase
        .from("plans")
        .update({
          plan_data: updatedPlan,
          refresh_type: "add",
          refresh_context: addContext,
        })
        .eq("id", planId);

      // Update localStorage
      localStorage.setItem("launchsequence_plan", JSON.stringify(updatedPlan));
      router.push("/plan");
    } catch (err) {
      console.error(err);
      setAddError("Something went wrong. Please try again.");
      setAddGenerating(false);
    }
  }

  // RETHINK: full regeneration
  async function handleRethink() {
    if (!briefing || !planId) return;
    setRethinkGenerating(true);
    setRethinkError("");

    const mergedBriefing = { ...briefing, ...rethinkData };

    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mergedBriefing),
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || "Failed");

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Archive current plan
      await supabase
        .from("plans")
        .update({ is_current: false })
        .eq("id", planId);

      // Create new plan
      const { data: briefingRow } = await supabase
        .from("briefings")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      await supabase.from("plans").insert({
        user_id: user.id,
        briefing_id: briefingRow?.id,
        plan_data: result,
        version: 2,
        is_current: true,
        refresh_type: "rethink",
        refresh_context: JSON.stringify(rethinkData),
        parent_plan_id: planId,
      });

      // Update briefing with new answers
      await supabase
        .from("briefings")
        .update({
          biggest_concern: rethinkData.biggest_concern,
          what_success_looks_like: rethinkData.what_success_looks_like,
          company_stage_detail: rethinkData.company_stage_detail,
          team_situation_detail: rethinkData.team_situation_detail,
        })
        .eq("user_id", user.id);

      localStorage.setItem("launchsequence_plan", JSON.stringify(result));
      router.push("/plan");
    } catch (err) {
      console.error(err);
      setRethinkError("Something went wrong. Please try again.");
      setRethinkGenerating(false);
    }
  }

  const phaseLabels: Record<string, string> = {
    t10: "T-10 — Pre-launch",
    observe: "Days 1 to 30 — Observe",
    orient: "Days 31 to 60 — Orient",
    act: "Days 61 to 90 — Act",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <div className="generating">Loading your plan...</div>
        </div>
      </div>
    );
  }

  if (addGenerating || rethinkGenerating) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="generating mb-4">
              {addGenerating ? "Adding new actions to your plan..." : "Regenerating your flight plan..."}
            </div>
            <p style={{ color: "var(--color-text-tertiary)", fontSize: "14px", lineHeight: "1.6" }}>
              {addGenerating
                ? "Building targeted actions based on what you shared."
                : "Taking everything you have learned into account. This takes about a minute."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <div style={{ flex: 1, maxWidth: "640px", margin: "0 auto", width: "100%", padding: "2.5rem 2rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }}>
            <p className="eyebrow">Refresh flight plan</p>
            <Link href="/plan" className="back-link" style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to plan
            </Link>
          </div>
          <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>What needs to change?</h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-tertiary)", lineHeight: "1.6" }}>
            Choose how you want to update your flight plan. Nothing is lost — previous versions are archived.
          </p>
        </div>

        {/* Mode selection */}
        {mode === null && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

            <div
              onClick={() => setMode("add")}
              className="selection-card"
              style={{ cursor: "pointer" }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setMode("add")}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1px solid rgba(14,178,205,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-teal)", flexShrink: 0, marginTop: "2px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "4px" }}>
                    Add something new
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--color-text-tertiary)", lineHeight: "1.5" }}>
                    You have learned something that needs to go into your plan. Add targeted new actions to a specific phase without touching the rest.
                  </div>
                </div>
              </div>
            </div>

            <div
              onClick={() => router.push("/plan?edit=true")}
              className="selection-card"
              style={{ cursor: "pointer" }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && router.push("/plan?edit=true")}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1px solid rgba(106,232,164,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-mint)", flexShrink: 0, marginTop: "2px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 1 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "4px" }}>
                    Edit or remove specific items
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--color-text-tertiary)", lineHeight: "1.5" }}>
                    Something in your plan is no longer relevant or needs to be reworded. Go back to the plan and mark items N/A or edit them directly.
                  </div>
                </div>
              </div>
            </div>

            <div
              onClick={() => setMode("rethink")}
              className="selection-card"
              style={{ cursor: "pointer" }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setMode("rethink")}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1px solid rgba(245,166,35,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-amber)", flexShrink: 0, marginTop: "2px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10"/>
                    <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "4px" }}>
                    Rethink the whole plan
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--color-text-tertiary)", lineHeight: "1.5" }}>
                    Something fundamental has changed — a reorg, a new boss, a major strategic shift. Answer a few updated questions and get a fully regenerated plan.
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ADD MODE */}
        {mode === "add" && (
          <div>
            <button onClick={() => setMode(null)} className="back-link" style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back
            </button>

            <h2 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>What have you learned?</h2>
            <p style={{ fontSize: "14px", color: "var(--color-text-tertiary)", marginBottom: "28px", lineHeight: "1.6" }}>
              Describe what is new — something you discovered, a challenge that emerged, a gap in your current plan. We will generate targeted actions to address it.
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "14px", color: "var(--color-text-tertiary)", marginBottom: "8px", display: "block" }}>
                What's new or what's changed?
              </label>
              <textarea
                value={addContext}
                onChange={(e) => setAddContext(e.target.value)}
                placeholder="e.g., I found out that two of my senior engineers have been actively interviewing elsewhere. Morale is lower than anyone mentioned in my briefings. I need to prioritize retention conversations..."
                rows={5}
                style={{ resize: "none", marginBottom: "0" }}
              />
            </div>

            <div style={{ marginBottom: "28px" }}>
              <label style={{ fontSize: "14px", color: "var(--color-text-tertiary)", marginBottom: "8px", display: "block" }}>
                Which phase should these actions go into?
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {Object.entries(phaseLabels).map(([key, label]) => (
                  <div
                    key={key}
                    onClick={() => setAddPhase(key)}
                    className={`selection-card ${addPhase === key ? "selected" : ""}`}
                    style={{ cursor: "pointer", padding: "10px 14px" }}
                    role="radio"
                    aria-checked={addPhase === key}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setAddPhase(key)}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div className="card-title" style={{ fontSize: "13px" }}>{label}</div>
                      {addPhase === key && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-teal)" }}>
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {addError && (
              <div style={{ marginBottom: "16px", padding: "12px 16px", background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.35)", borderRadius: "var(--radius)", fontSize: "14px", color: "var(--color-amber)" }}>
                {addError}
              </div>
            )}

            <button
              onClick={handleAdd}
              disabled={!addContext.trim()}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Generate new actions
            </button>
          </div>
        )}

        {/* RETHINK MODE */}
        {mode === "rethink" && (
          <div>
            <button onClick={() => setMode(null)} className="back-link" style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back
            </button>

            {rethinkStep === "briefing" && (
              <div>
                <div className="step-counter" style={{ marginBottom: "16px" }}>
                  {String(rethinkQStep + 1).padStart(2, "0")} / {String(RETHINK_QUESTIONS.length).padStart(2, "0")}
                </div>

                <div style={{ marginBottom: "8px", padding: "8px 12px", background: "var(--color-bg-card)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius)", display: "inline-block" }}>
                  <p style={{ fontSize: "12px", color: "var(--color-text-minimum)", margin: 0 }}>
                    Your original answer is pre-filled. Update anything that has changed.
                  </p>
                </div>

                <h2 style={{ fontSize: "1.5rem", margin: "16px 0 8px" }}>
                  {RETHINK_QUESTIONS[rethinkQStep].label}
                </h2>
                <p style={{ fontSize: "14px", color: "var(--color-text-tertiary)", marginBottom: "24px" }}>
                  {RETHINK_QUESTIONS[rethinkQStep].sublabel}
                </p>

                <textarea
                  key={rethinkQStep}
                  value={(rethinkData[RETHINK_QUESTIONS[rethinkQStep].field] as string) || ""}
                  onChange={(e) => setRethinkData((prev) => ({
                    ...prev,
                    [RETHINK_QUESTIONS[rethinkQStep].field]: e.target.value,
                  }))}
                  rows={5}
                  style={{ resize: "none", marginBottom: "24px" }}
                  placeholder={RETHINK_QUESTIONS[rethinkQStep].type === "textarea-optional" ? "Optional — skip if nothing has changed" : ""}
                />

                {rethinkError && (
                  <div style={{ marginBottom: "16px", padding: "12px 16px", background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.35)", borderRadius: "var(--radius)", fontSize: "14px", color: "var(--color-amber)" }}>
                    {rethinkError}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <button
                    onClick={() => setRethinkQStep((s) => Math.max(0, s - 1))}
                    className="back-link"
                    style={{ visibility: rethinkQStep === 0 ? "hidden" : "visible", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back
                  </button>

                  {rethinkQStep < RETHINK_QUESTIONS.length - 1 ? (
                    <button
                      onClick={() => setRethinkQStep((s) => s + 1)}
                      className="btn-primary"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      onClick={handleRethink}
                      className="btn-primary"
                    >
                      Regenerate flight plan
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
