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

export default function CaptainsLogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [currentPhase, setCurrentPhase] = useState("observe");
  const [activeTab, setActiveTab] = useState<"write" | "history">("write");
  const [entryText, setEntryText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Get start date from briefing to determine current phase
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

      // Load existing entries
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
        prompt: PHASE_PROMPTS[currentPhase],
        entry: entryText.trim(),
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
        <div style={{ display: "flex", gap: "4px", marginBottom: "2rem", borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: "0" }}>
          {(["write", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 500,
                color: activeTab === tab ? "var(--color-teal)" : "var(--color-text-tertiary)",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab ? "2px solid var(--color-teal)" : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s",
                marginBottom: "-1px",
                textTransform: "capitalize",
              }}
            >
              {tab === "write" ? "New entry" : `History${entries.length > 0 ? ` (${entries.length})` : ""}`}
            </button>
          ))}
        </div>

        {/* Write tab */}
        {activeTab === "write" && (
          <div>
            {/* Current phase indicator */}
            <div style={{ marginBottom: "1.5rem", padding: "12px 16px", background: "var(--color-bg-card)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="instrument" style={{ fontSize: "12px", color: "var(--color-teal)" }}>
                {phaseNumbers[currentPhase] || "T-10"}
              </span>
              <span style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>
                {PHASE_LABELS[currentPhase]}
              </span>
            </div>

            {/* Reflection prompt */}
            <div className="card-warm" style={{ marginBottom: "1.5rem" }}>
              <p className="eyebrow" style={{ color: "var(--color-amber)", marginBottom: "8px" }}>This phase prompt</p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem", fontWeight: 400, fontStyle: "italic", color: "var(--color-text-primary)", lineHeight: "1.6", margin: 0 }}>
                {PHASE_PROMPTS[currentPhase]}
              </p>
            </div>

            {/* Free text entry */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "14px", color: "var(--color-text-tertiary)", marginBottom: "8px", display: "block" }}>
                Your notes — respond to the prompt above, or write whatever is on your mind.
              </label>
              <textarea
                value={entryText}
                onChange={(e) => setEntryText(e.target.value)}
                placeholder="What's on your mind? What did you notice today? What are you learning about the role, the team, yourself?"
                rows={8}
                style={{ resize: "vertical", minHeight: "180px" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={handleSave}
                disabled={!entryText.trim() || saving}
                className="btn-primary"
              >
                {saving ? "Saving..." : "Save entry"}
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
                  const isActionNote = !!(entry as {action_title?: string}).action_title;
                  return (
                    <div key={entry.id} className="card">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="instrument" style={{ fontSize: "11px", color: isActionNote ? "var(--color-mint)" : "var(--color-teal)" }}>
                            {PHASE_LABELS[entry.phase] || entry.phase}
                          </span>
                          {isActionNote && (
                            <span style={{ fontSize: "11px", color: "var(--color-text-minimum)" }}>
                              · {(entry as {action_title?: string}).action_title}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "12px", color: "var(--color-text-minimum)" }}>{date}</span>
                      </div>
                      {!isActionNote && entry.prompt && (
                        <p style={{ fontSize: "12px", color: "var(--color-text-minimum)", fontStyle: "italic", marginBottom: "8px", lineHeight: "1.5" }}>
                          {entry.prompt}
                        </p>
                      )}
                      <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: "1.7", margin: 0, whiteSpace: "pre-wrap" }}>
                        {entry.entry}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

const phaseNumbers: Record<string, string> = {
  t10: "T-10",
  observe: "01\u201330",
  orient: "31\u201360",
  act: "61\u201390",
};
