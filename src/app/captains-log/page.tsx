"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface LogEntry {
  id: string;
  phase: string;
  prompt: string;
  entry: string;
  created_at: string;
  action_title?: string;
  action_key?: string;
}

interface Insight {
  theme: string;
  observation: string;
  entries_referenced: number;
}

interface InsightResult {
  insights: Insight[];
  summary: string;
  generated_at: string;
}

function getCurrentPhase(startDate: string): string {
  const start = new Date(startDate);
  const today = new Date();
  const days = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "t10";
  if (days <= 30) return "observe";
  if (days <= 60) return "orient";
  return "act";
}

const PHASE_PROMPTS: Record<string, string> = {
  t10: "What assumptions are you carrying into this role? What would it mean to set them aside for the first 30 days?",
  observe: "What has surprised you most so far? What did you expect that turned out to be wrong?",
  orient: "What are you starting to think differently about? Where is your point of view beginning to form?",
  act: "What would you do differently if you were starting this transition over? What do you know now that you wish you had known on day one?",
};

const PHASE_LABELS: Record<string, string> = {
  t10: "T-10 — Pre-launch",
  observe: "Days 1 to 30 — Observe",
  orient: "Days 31 to 60 — Orient",
  act: "Days 61 to 90 — Act",
};

const phaseNumbers: Record<string, string> = {
  t10: "T-10",
  observe: "01\u201330",
  orient: "31\u201360",
  act: "61\u201390",
};

const THEME_COLORS = [
  "var(--color-teal)",
  "var(--color-mint)",
  "var(--color-amber)",
  "#a78bfa",
  "#f472b6",
];

export default function CaptainsLogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [currentPhase, setCurrentPhase] = useState("observe");
  const [activeTab, setActiveTab] = useState<"write" | "history" | "insights">("write");
  const [entryText, setEntryText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [writeMode, setWriteMode] = useState<"reflection" | "note">("reflection");

  // Insights state
  const [insights, setInsights] = useState<InsightResult | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: briefing } = await supabase
        .from("briefings")
        .select("start_date")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (briefing?.start_date) {
        setCurrentPhase(getCurrentPhase(briefing.start_date));
      }

      const { data: logData } = await supabase
        .from("captains_log")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (logData) setEntries(logData);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSave() {
    if (!entryText.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("captains_log")
      .insert({
        user_id: user.id,
        phase: currentPhase,
        prompt: writeMode === "reflection" ? PHASE_PROMPTS[currentPhase] : null,
        entry: entryText.trim(),
        action_key: writeMode === "reflection" ? "reflection" : null,
        action_title: writeMode === "reflection" ? `Phase reflection — ${PHASE_LABELS[currentPhase]}` : null,
      })
      .select()
      .single();

    if (data) {
      setEntries((prev) => [data, ...prev]);
      setEntryText("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }

    setSaving(false);
  }

  async function generateInsights() {
    if (entries.length < 3) return;
    setInsightsLoading(true);
    setInsightsError("");

    try {
      const res = await fetch("/api/captains-log-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || "Failed");
      setInsights({ ...result, generated_at: new Date().toISOString() });
    } catch (err) {
      console.error(err);
      setInsightsError("Something went wrong generating insights. Please try again.");
    } finally {
      setInsightsLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <div className="generating">Loading captain's log...</div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "write", label: "New entry" },
    { id: "history", label: `History${entries.length > 0 ? ` (${entries.length})` : ""}` },
    { id: "insights", label: "Insights" },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <div style={{ flex: 1, maxWidth: "720px", margin: "0 auto", width: "100%", padding: "2.5rem 2rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: "6px" }}>Captain's log</p>
              <h1 style={{ fontSize: "2rem", marginBottom: "4px" }}>Your transition record</h1>
              <p style={{ fontSize: "14px", color: "var(--color-text-tertiary)" }}>
                Notes, observations, and reflections as you go.
              </p>
            </div>
            <Link href="/dashboard" className="back-link" style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Dashboard
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "2rem", borderBottom: "1px solid var(--color-border-subtle)" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 500,
                color: activeTab === tab.id ? "var(--color-teal)" : "var(--color-text-tertiary)",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid var(--color-teal)" : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s",
                marginBottom: "-1px",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Write tab */}
        {activeTab === "write" && (
          <div>
            {/* Mode toggle */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "1.5rem" }}>
              {(["reflection", "note"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setWriteMode(mode)}
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    padding: "6px 16px",
                    borderRadius: "20px",
                    border: `1px solid ${writeMode === mode ? "var(--color-teal)" : "var(--color-border-subtle)"}`,
                    background: writeMode === mode ? "rgba(14,178,205,0.1)" : "transparent",
                    color: writeMode === mode ? "var(--color-teal)" : "var(--color-text-tertiary)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    textTransform: "capitalize",
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Current phase indicator */}
            <div style={{ marginBottom: "1.25rem", padding: "10px 14px", background: "var(--color-bg-card)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="instrument" style={{ fontSize: "12px", color: "var(--color-teal)" }}>
                {phaseNumbers[currentPhase] || "T-10"}
              </span>
              <span style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>
                {PHASE_LABELS[currentPhase]}
              </span>
            </div>

            {/* Reflection mode — structured, prompted */}
            {writeMode === "reflection" && (
              <div className="card-warm" style={{ marginBottom: "1.5rem" }}>
                <p className="eyebrow" style={{ color: "var(--color-amber)", marginBottom: "8px" }}>Phase reflection</p>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 400, fontStyle: "italic", color: "var(--color-text-primary)", lineHeight: "1.6", margin: 0 }}>
                  {PHASE_PROMPTS[currentPhase]}
                </p>
              </div>
            )}

            {/* Note mode — freeform */}
            {writeMode === "note" && (
              <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)", marginBottom: "1rem", lineHeight: "1.5" }}>
                Capture whatever is on your mind — observations, things you noticed, conversations, questions. No prompt needed.
              </p>
            )}

            <div style={{ marginBottom: "1rem" }}>
              <textarea
                value={entryText}
                onChange={(e) => setEntryText(e.target.value)}
                placeholder={writeMode === "reflection"
                  ? "Take your time with this one. What is true for you right now?"
                  : "What are you noticing? What happened today? What do you want to remember?"}
                rows={writeMode === "reflection" ? 8 : 6}
                style={{ resize: "vertical", minHeight: "160px" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button onClick={handleSave} disabled={!entryText.trim() || saving} className="btn-primary">
                {saving ? "Saving..." : writeMode === "reflection" ? "Save reflection" : "Save note"}
              </button>
              {saved && (
                <span style={{ fontSize: "13px", color: "var(--color-mint)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Saved
                </span>
              )}
            </div>
          </div>
        )}

        {/* History tab */}
        {activeTab === "history" && (
          <div>
            {entries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <p style={{ color: "var(--color-text-tertiary)", fontSize: "15px", marginBottom: "16px" }}>
                  No entries yet. Start writing to build your transition record.
                </p>
                <button onClick={() => setActiveTab("write")} className="btn-secondary">
                  Write your first entry
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {entries.map((entry) => {
                  const date = new Date(entry.created_at).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric"
                  });
                  const isActionNote = !!entry.action_title && entry.action_key !== "reflection";
                  const isReflection = entry.action_key === "reflection";
                  return (
                    <div key={entry.id} className={isReflection ? "card-warm" : "card"}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {isReflection && (
                            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--color-amber)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                              Reflection
                            </span>
                          )}
                          <span className="instrument" style={{ fontSize: "11px", color: isReflection ? "var(--color-amber)" : isActionNote ? "var(--color-mint)" : "var(--color-teal)" }}>
                            {PHASE_LABELS[entry.phase] || entry.phase}
                          </span>
                          {isActionNote && (
                            <span style={{ fontSize: "11px", color: "var(--color-text-minimum)" }}>
                              · {entry.action_title}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "12px", color: "var(--color-text-minimum)" }}>{date}</span>
                      </div>
                      {isReflection && entry.prompt && (
                        <p style={{ fontFamily: "var(--font-heading)", fontSize: "13px", fontStyle: "italic", color: "var(--color-text-tertiary)", marginBottom: "8px", lineHeight: "1.5" }}>
                          {entry.prompt}
                        </p>
                      )}
                      <p style={{
                        color: "var(--color-text-secondary)",
                        lineHeight: "1.7",
                        margin: 0,
                        whiteSpace: "pre-wrap",
                        fontFamily: isReflection ? "var(--font-heading)" : "var(--font-body)",
                        fontStyle: isReflection ? "italic" : "normal",
                        fontSize: isReflection ? "1rem" : "14px",
                      }}>
                        {entry.entry}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Insights tab */}
        {activeTab === "insights" && (
          <div>
            {entries.length < 3 ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <p style={{ color: "var(--color-text-tertiary)", fontSize: "15px", marginBottom: "8px" }}>
                  You need at least 3 log entries before patterns start to emerge.
                </p>
                <p style={{ color: "var(--color-text-minimum)", fontSize: "13px", marginBottom: "24px" }}>
                  You have {entries.length} {entries.length === 1 ? "entry" : "entries"} so far.
                </p>
                <button onClick={() => setActiveTab("write")} className="btn-secondary">
                  Add an entry
                </button>
              </div>
            ) : (
              <div>
                {/* Generate button */}
                {!insights && !insightsLoading && (
                  <div style={{ marginBottom: "2rem" }}>
                    <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
                      <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "8px" }}>
                        Ready to synthesize {entries.length} {entries.length === 1 ? "entry" : "entries"}
                      </p>
                      <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)", lineHeight: "1.6", marginBottom: "20px" }}>
                        Your log will be analyzed for recurring themes, patterns, and observations you might not have noticed yourself.
                      </p>
                      <button onClick={generateInsights} className="btn-primary">
                        Synthesize my log
                      </button>
                    </div>
                  </div>
                )}

                {/* Loading */}
                {insightsLoading && (
                  <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                    <div className="generating" style={{ marginBottom: "12px" }}>Reading your log...</div>
                    <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>
                      Analyzing {entries.length} entries for themes and patterns. This takes about 15 seconds.
                    </p>
                  </div>
                )}

                {/* Error */}
                {insightsError && (
                  <div style={{ padding: "12px 16px", background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.35)", borderRadius: "var(--radius)", fontSize: "14px", color: "var(--color-amber)", marginBottom: "16px" }}>
                    {insightsError}
                  </div>
                )}

                {/* Results */}
                {insights && !insightsLoading && (
                  <div>
                    {/* Summary */}
                    <div className="card-warm" style={{ marginBottom: "1.5rem" }}>
                      <p className="eyebrow" style={{ color: "var(--color-amber)", marginBottom: "10px" }}>Overall picture</p>
                      <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 400, fontStyle: "italic", color: "var(--color-text-primary)", lineHeight: "1.7", margin: 0 }}>
                        {insights.summary}
                      </p>
                    </div>

                    {/* Themes */}
                    <div style={{ marginBottom: "1.5rem" }}>
                      <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)", marginBottom: "12px" }}>
                        {insights.insights.length} pattern{insights.insights.length !== 1 ? "s" : ""} identified across your entries
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {insights.insights.map((insight, i) => (
                          <div key={i} className="card" style={{ borderLeft: `3px solid ${THEME_COLORS[i % THEME_COLORS.length]}` }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: `${THEME_COLORS[i % THEME_COLORS.length]}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: THEME_COLORS[i % THEME_COLORS.length], fontWeight: 700 }}>
                                  {i + 1}
                                </span>
                              </div>
                              <div>
                                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "4px" }}>
                                  {insight.theme}
                                </div>
                                <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
                                  {insight.observation}
                                </div>
                                <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--color-text-minimum)", fontFamily: "var(--font-mono)" }}>
                                  Referenced in {insight.entries_referenced} {insight.entries_referenced === 1 ? "entry" : "entries"}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Regenerate */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <p style={{ fontSize: "12px", color: "var(--color-text-minimum)" }}>
                        Generated {new Date(insights.generated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <button
                        onClick={generateInsights}
                        className="btn-secondary"
                        style={{ fontSize: "12px", padding: "6px 14px" }}
                      >
                        Refresh insights
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
