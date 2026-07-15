"use client";

import { useEffect, useState, useCallback } from "react";
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

type ActionStatus = "not_started" | "in_progress" | "done" | "not_applicable";

interface StatusMap {
  [key: string]: ActionStatus;
}

interface Note {
  id: string;
  entry: string;
  created_at: string;
}

interface NotesMap {
  [key: string]: Note[];
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
    color: "var(--color-text-tertiary)",
    label: "Logistics",
    bg: "var(--color-bg-card)",
    border: "var(--color-border-subtle)",
  },
};

const phaseKeys: (keyof Plan)[] = ["t10", "observe", "orient", "act"];

const phaseNumbers: Record<string, string> = {
  t10: "T-10",
  observe: "01\u201330",
  orient: "31\u201360",
  act: "61\u201390",
};

const STATUS_CONFIG: Record<ActionStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  not_started: {
    label: "Not started",
    color: "var(--color-text-minimum)",
    bg: "transparent",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
      </svg>
    ),
  },
  in_progress: {
    label: "In progress",
    color: "var(--color-teal)",
    bg: "rgba(14,178,205,0.1)",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
    ),
  },
  done: {
    label: "Done",
    color: "var(--color-mint)",
    bg: "rgba(106,232,164,0.1)",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  },
  not_applicable: {
    label: "N/A",
    color: "var(--color-text-minimum)",
    bg: "transparent",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    ),
  },
};

const STATUS_CYCLE: ActionStatus[] = ["not_started", "in_progress", "done", "not_applicable"];

function getStatusKey(phase: string, index: number) {
  return `${phase}__${index}`;
}

function getPhaseProgress(phase: PlanPhase, phaseKey: string, statusMap: StatusMap) {
  const total = phase.actions.length;
  if (total === 0) return { done: 0, total: 0, percent: 0 };
  const done = phase.actions.filter((_, i) => {
    const s = statusMap[getStatusKey(phaseKey, i)];
    return s === "done" || s === "not_applicable";
  }).length;
  return { done, total, percent: Math.round((done / total) * 100) };
}

export default function PlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState<keyof Plan>("t10");
  const [statusMap, setStatusMap] = useState<StatusMap>({});
  const [notesMap, setNotesMap] = useState<NotesMap>({});
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<string | null>(null);
  const [saveEmail, setSaveEmail] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [saveError, setSaveError] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function loadPlan() {
      const stored = localStorage.getItem("launchsequence_plan");
      if (stored) {
        try {
          setPlan(JSON.parse(stored));
          setLoading(false);
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setIsLoggedIn(true);
            // Try to get the plan ID for status loading
            const { data: planRow } = await supabase
              .from("plans")
              .select("id")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();
            if (planRow) {
              setPlanId(planRow.id);
              loadStatuses(user.id, planRow.id);
              loadNotes(user.id, planRow.id);
            }
          }
          return;
        } catch { /* fall through */ }
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        const { data: planRow } = await supabase
          .from("plans")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (planRow?.plan_data) {
          setPlan(planRow.plan_data);
          setPlanId(planRow.id);
          loadStatuses(user.id, planRow.id);
          loadNotes(user.id, planRow.id);
          setLoading(false);
          return;
        }
      }

      router.push("/briefing");
    }

    loadPlan();
  }, [router]);

  async function loadStatuses(userId: string, planId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("action_status")
      .select("*")
      .eq("user_id", userId)
      .eq("plan_id", planId);

    if (data) {
      const map: StatusMap = {};
      data.forEach((row) => {
        map[getStatusKey(row.phase, row.action_index)] = row.status;
      });
      setStatusMap(map);
    }
  }

  async function loadNotes(userId: string, planId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("captains_log")
      .select("*")
      .eq("user_id", userId)
      .eq("plan_id", planId)
      .order("created_at", { ascending: true });

    if (data) {
      const map: NotesMap = {};
      data.forEach((row) => {
        const key = row.action_key;
        if (key) {
          if (!map[key]) map[key] = [];
          map[key].push({ id: row.id, entry: row.entry, created_at: row.created_at });
        }
      });
      setNotesMap(map);
    }
  }

  async function saveNote(phase: string, index: number, actionTitle: string) {
    const key = getStatusKey(phase, index);
    const text = noteText[key];
    if (!text?.trim() || !planId) return;

    setSavingNote(key);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("captains_log")
      .insert({
        user_id: user.id,
        plan_id: planId,
        phase,
        action_key: key,
        action_title: actionTitle,
        prompt: null,
        entry: text.trim(),
      })
      .select()
      .single();

    if (data) {
      setNotesMap((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), { id: data.id, entry: data.entry, created_at: data.created_at }],
      }));
      setNoteText((prev) => ({ ...prev, [key]: "" }));
    }

    setSavingNote(null);
  }

  const cycleStatus = useCallback(async (phase: string, index: number) => {
    if (!planId || !isLoggedIn) return;

    const key = getStatusKey(phase, index);
    const current = statusMap[key] || "not_started";
    const currentIndex = STATUS_CYCLE.indexOf(current);
    const next = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];

    // Optimistic update
    setStatusMap((prev) => ({ ...prev, [key]: next }));

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("action_status").upsert({
      user_id: user.id,
      plan_id: planId,
      phase,
      action_index: index,
      status: next,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,plan_id,phase,action_index" });
  }, [planId, isLoggedIn, statusMap]);

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
      console.error("Supabase OTP error:", error.message);
      setSaveStatus("error");
      setSaveError(error.message);
      return;
    }

    setSaveStatus("sent");
  }

  if (loading || !plan) {
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
  const progress = getPhaseProgress(phase, activePhase, statusMap);

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      {/* Save banner */}
      {!isLoggedIn && saveStatus !== "sent" && (
        <div style={{ background: "rgba(14,178,205,0.06)", borderBottom: "1px solid rgba(14,178,205,0.2)", padding: "12px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
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
            <button onClick={handleSavePlan} disabled={!saveEmail.trim() || saveStatus === "sending"} className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px" }}>
              {saveStatus === "sending" ? "Sending..." : "Save plan"}
            </button>
          </div>
          {saveStatus === "error" && (
            <p style={{ fontSize: "13px", color: "var(--color-amber)", margin: 0, width: "100%" }}>{saveError || "Something went wrong. Please try again."}</p>
          )}
        </div>
      )}

      {saveStatus === "sent" && (
        <div style={{ background: "rgba(106,232,164,0.06)", borderBottom: "1px solid rgba(106,232,164,0.2)", padding: "12px 32px", display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-mint)", flexShrink: 0 }}>
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <p style={{ fontSize: "13px", color: "var(--color-mint)", margin: 0 }}>
            Check your email for a sign-in link. Click it to save your plan and access your mission dashboard.
          </p>
        </div>
      )}

      <div style={{ flex: 1, display: "flex" }}>

        {/* Sidebar */}
        <aside style={{ width: "240px", borderRight: "1px solid var(--color-border-subtle)", padding: "1.5rem", flexShrink: 0 }}>
          <p className="eyebrow" style={{ marginBottom: "16px" }}>Mission phases</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {phaseKeys.map((key) => {
              const phaseProgress = getPhaseProgress(plan[key], key, statusMap);
              return (
                <button
                  key={key}
                  onClick={() => setActivePhase(key)}
                  className={`sidebar-item ${activePhase === key ? "active" : ""}`}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <span>
                      <span className="instrument" style={{ fontSize: "12px", marginRight: "8px", opacity: 0.7 }}>
                        {phaseNumbers[key]}
                      </span>
                      {plan[key].title.split(": ")[1] || plan[key].title}
                    </span>
                    {phaseProgress.done > 0 && (
                      <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: phaseProgress.percent === 100 ? "var(--color-mint)" : "var(--color-teal)", marginLeft: "8px", flexShrink: 0 }}>
                        {phaseProgress.done}/{phaseProgress.total}
                      </span>
                    )}
                  </div>
                  {/* Phase progress bar */}
                  {phaseProgress.total > 0 && (
                    <div style={{ height: "2px", background: "var(--color-border-subtle)", borderRadius: "1px", marginTop: "6px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${phaseProgress.percent}%`, background: phaseProgress.percent === 100 ? "var(--color-mint)" : "var(--color-teal)", transition: "width 0.3s ease" }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border-subtle)" }}>
            <p className="eyebrow" style={{ marginBottom: "12px" }}>Legend</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.entries(categoryStyles).map(([key, style]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: style.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>{style.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status legend */}
          <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border-subtle)" }}>
            <p className="eyebrow" style={{ marginBottom: "12px" }}>Status</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(Object.entries(STATUS_CONFIG) as [ActionStatus, typeof STATUS_CONFIG[ActionStatus]][]).map(([key, config]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: "8px", color: config.color }}>
                  {config.icon}
                  <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>{config.label}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: "11px", color: "var(--color-text-minimum)", marginTop: "10px", lineHeight: "1.5" }}>
              Click any action to cycle its status.
            </p>
          </div>

          {/* Refresh plan */}
          {isLoggedIn && (
            <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border-subtle)" }}>
              <a
                href="/plan-refresh"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: "var(--color-text-tertiary)",
                  textDecoration: "none",
                  padding: "8px 0",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-teal)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-tertiary)")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
                </svg>
                Refresh flight plan
              </a>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: "2rem 2.5rem", maxWidth: "760px" }}>

          {/* Phase header */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div className="phase-number" style={{ fontSize: "1.5rem", marginBottom: "8px" }}>
              {phaseNumbers[activePhase]}
            </div>
            <h1 style={{ fontSize: "2rem", marginBottom: "12px" }}>{phase.title}</h1>
            <p style={{ fontSize: "15px", lineHeight: "1.7", color: "var(--color-text-secondary)", maxWidth: "560px" }}>
              {phase.description}
            </p>
          </div>

          {/* Phase progress */}
          {progress.total > 0 && (
            <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1, height: "4px", background: "var(--color-border-subtle)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progress.percent}%`, background: progress.percent === 100 ? "var(--color-mint)" : "var(--color-teal)", transition: "width 0.3s ease" }} />
              </div>
              <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: progress.percent === 100 ? "var(--color-mint)" : "var(--color-text-tertiary)", flexShrink: 0 }}>
                {progress.done} / {progress.total} complete
              </span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "2.5rem" }}>
            {phase.actions.map((action, i) => {
              const cat = categoryStyles[action.category] || categoryStyles.logistics;
              const statusKey = getStatusKey(activePhase, i);
              const status = statusMap[statusKey] || "not_started";
              const statusConfig = STATUS_CONFIG[status];
              const isDone = status === "done";
              const isNA = status === "not_applicable";
              const isDimmed = isDone || isNA;

              return (
                <div
                  key={i}
                  onClick={() => cycleStatus(activePhase, i)}
                  style={{
                    background: cat.bg,
                    border: `1px solid ${isDone ? "rgba(106,232,164,0.3)" : isNA ? "var(--color-border-subtle)" : cat.border}`,
                    borderRadius: "var(--radius)",
                    padding: "1rem",
                    cursor: isLoggedIn ? "pointer" : "default",
                    transition: "all 0.2s",
                    opacity: isNA ? 0.4 : 1,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    {/* Status indicator */}
                    {isLoggedIn && (
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          border: `1px solid ${isDone ? "var(--color-mint)" : "var(--color-border)"}`,
                          background: statusConfig.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: statusConfig.color,
                          flexShrink: 0,
                          marginTop: "2px",
                          transition: "all 0.2s",
                        }}
                        title={`Status: ${statusConfig.label}. Click to change.`}
                      >
                        {statusConfig.icon}
                      </div>
                    )}

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
                        <div style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: isDimmed ? "var(--color-text-tertiary)" : "var(--color-text-primary)",
                          textDecoration: isDone ? "line-through" : "none",
                          transition: "all 0.2s",
                        }}>
                          {action.title}
                        </div>
                        {isLoggedIn && (
                          <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: statusConfig.color, flexShrink: 0, marginTop: "2px" }}>
                            {statusConfig.label}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "13px", color: isDimmed ? "var(--color-text-minimum)" : "var(--color-text-secondary)", lineHeight: "1.6", transition: "color 0.2s" }}>
                        {action.description}
                      </div>
                      <div className="action-category-label" style={{ color: cat.color }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: cat.color, flexShrink: 0 }} />
                        {cat.label}
                      </div>
                    </div>
                  </div>

                  {/* Inline notes — shown when in progress or done */}
                  {isLoggedIn && (status === "in_progress" || status === "done") && (
                    <div
                      style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--color-border-subtle)" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Existing notes */}
                      {(notesMap[statusKey] || []).map((note) => (
                        <div key={note.id} style={{ marginBottom: "8px", padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius)", borderLeft: `2px solid ${cat.color}` }}>
                          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: "1.6", margin: "0 0 4px", whiteSpace: "pre-wrap" }}>
                            {note.entry}
                          </p>
                          <span style={{ fontSize: "11px", color: "var(--color-text-minimum)" }}>
                            {new Date(note.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      ))}

                      {/* Note toggle */}
                      {expandedNote !== statusKey ? (
                        <button
                          onClick={() => setExpandedNote(statusKey)}
                          style={{ fontSize: "12px", color: "var(--color-text-tertiary)", background: "none", border: "none", cursor: "pointer", padding: "4px 0", display: "flex", alignItems: "center", gap: "5px" }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12h14"/>
                          </svg>
                          Add note
                        </button>
                      ) : (
                        <div style={{ marginTop: "4px" }}>
                          <textarea
                            value={noteText[statusKey] || ""}
                            onChange={(e) => setNoteText((prev) => ({ ...prev, [statusKey]: e.target.value }))}
                            placeholder="What are you learning? What's happening with this action?"
                            rows={3}
                            autoFocus
                            style={{ fontSize: "13px", marginBottom: "8px", resize: "none" }}
                          />
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => saveNote(activePhase, i, action.title)}
                              disabled={!noteText[statusKey]?.trim() || savingNote === statusKey}
                              className="btn-primary"
                              style={{ padding: "6px 14px", fontSize: "12px" }}
                            >
                              {savingNote === statusKey ? "Saving..." : "Save note"}
                            </button>
                            <button
                              onClick={() => setExpandedNote(null)}
                              className="back-link"
                              style={{ fontSize: "12px" }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reflection prompt */}
          <div className="card-warm">
            <p className="eyebrow" style={{ color: "var(--color-amber)", marginBottom: "8px" }}>Reflection</p>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 400, fontStyle: "italic", color: "var(--color-text-primary)", lineHeight: "1.6", margin: 0 }}>
              {phase.reflection}
            </p>
          </div>

        </main>
      </div>
    </div>
  );
}
