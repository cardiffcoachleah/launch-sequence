"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import VoiceInput from "@/components/VoiceInput";
import CoachingCTA from "@/components/CoachingCTA";

interface CheckIn {
  id: string;
  energy_level: number;
  weighing_on_you: string;
  went_well: string;
  ai_response: string;
  created_at: string;
}

const ENERGY_LEVELS = [
  { value: 1, label: "Running on fumes", color: "var(--color-amber)" },
  { value: 2, label: "Getting by", color: "#c8a45a" },
  { value: 3, label: "Holding steady", color: "var(--color-teal)" },
  { value: 4, label: "Firing on all cylinders", color: "var(--color-mint)" },
];

const ENERGY_COLORS = ["", "#F5A623", "#c8a45a", "#0EB2CD", "#6AE8A4"];

function EnergyTrendChart({ data }: { data: CheckIn[] }) {
  if (data.length < 2) return null;

  const sorted = [...data].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const W = 600;
  const H = 120;
  const padX = 32;
  const padY = 20;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;

  const xStep = sorted.length > 1 ? chartW / (sorted.length - 1) : chartW;

  function xPos(i: number) {
    return padX + (sorted.length > 1 ? i * xStep : chartW / 2);
  }

  function yPos(level: number) {
    return padY + chartH - ((level - 1) / 3) * chartH;
  }

  const points = sorted.map((d, i) => `${xPos(i)},${yPos(d.energy_level)}`).join(" ");

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <p className="eyebrow" style={{ marginBottom: "12px" }}>Energy trend</p>
      <div style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "var(--radius)",
        padding: "1rem",
        overflowX: "auto",
      }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          aria-label="Energy level trend chart"
          role="img"
        >
          {/* Y axis grid lines + labels */}
          {[1, 2, 3, 4].map((level) => (
            <g key={level}>
              <line
                x1={padX} y1={yPos(level)}
                x2={W - padX} y2={yPos(level)}
                stroke="rgba(14,178,205,0.1)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padX - 6}
                y={yPos(level) + 4}
                textAnchor="end"
                fontSize="10"
                fill={ENERGY_COLORS[level]}
                fontFamily="var(--font-mono)"
              >
                {level}
              </text>
            </g>
          ))}

          {/* Filled area under line */}
          <polygon
            points={`${xPos(0)},${padY + chartH} ${points} ${xPos(sorted.length - 1)},${padY + chartH}`}
            fill="rgba(14,178,205,0.06)"
          />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke="#0EB2CD"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {sorted.map((d, i) => {
            const cx = xPos(i);
            const cy = yPos(d.energy_level);
            const color = ENERGY_COLORS[d.energy_level];
            const date = new Date(d.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return (
              <g key={d.id}>
                <circle cx={cx} cy={cy} r="5" fill={color} stroke="#00001A" strokeWidth="2" />
                {/* Date label below chart */}
                <text
                  x={cx}
                  y={H - 4}
                  textAnchor="middle"
                  fontSize="9"
                  fill="rgba(255,255,255,0.3)"
                  fontFamily="var(--font-mono)"
                >
                  {date}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "6px 16px",
          marginTop: "8px",
          paddingTop: "8px",
          borderTop: "1px solid var(--color-border-subtle)"
        }}>
          {ENERGY_LEVELS.map((l) => (
            <div key={l.value} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: l.color, flexShrink: 0 }} />
              <span style={{ fontSize: "11px", color: "var(--color-text-minimum)", fontFamily: "var(--font-mono)" }}>
                {l.value} — {l.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GroundControlPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "response" | "history">("form");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<CheckIn[]>([]);
  const [energy, setEnergy] = useState<number | null>(null);
  const [weighing, setWeighing] = useState("");
  const [wentWell, setWentWell] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  // Add to flight plan state
  const [showAddToPlan, setShowAddToPlan] = useState(false);
  const [addActionTitle, setAddActionTitle] = useState("");
  const [addPhase, setAddPhase] = useState("observe");
  const [addingToPlan, setAddingToPlan] = useState(false);
  const [addedToPlan, setAddedToPlan] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("systems_checks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) setHistory(data);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSubmit() {
    if (!energy || !weighing.trim() || !wentWell.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/ground-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ energy_level: energy, weighing_on_you: weighing, went_well: wentWell }),
      });
      const result = await res.json();
      const response = result.response || "Thank you for checking in.";
      setAiResponse(response);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: newEntry } = await supabase
          .from("systems_checks")
          .insert({
            user_id: user.id,
            energy_level: energy,
            weighing_on_you: weighing,
            went_well: wentWell,
            ai_response: response,
          })
          .select()
          .single();

        if (newEntry) {
          setHistory((prev) => [newEntry, ...prev]);
        }
      }

      setStep("response");
    } catch (err) {
      console.error("Ground control error:", err);
    } finally {
      setSubmitting(false);
    }
  }

  function handleNewCheckIn() {
    setEnergy(null);
    setWeighing("");
    setWentWell("");
    setAiResponse("");
    setShowAddToPlan(false);
    setAddActionTitle("");
    setAddedToPlan(false);
    setStep("form");
  }

  async function handleAddToPlan() {
    if (!addActionTitle.trim()) return;
    setAddingToPlan(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current plan
      const { data: planRow } = await supabase
        .from("plans")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_current", true)
        .single();

      if (!planRow) return;

      const updatedPlan = { ...planRow.plan_data } as Record<string, { actions: { title: string; description: string; category: string }[] }>;
      const phaseData = updatedPlan[addPhase];
      if (phaseData) {
        phaseData.actions = [
          ...phaseData.actions,
          {
            title: addActionTitle,
            description: `Added from Ground Control check-in: ${weighing.slice(0, 120)}${weighing.length > 120 ? "..." : ""}`,
            category: "self",
          },
        ];
      }

      await supabase
        .from("plans")
        .update({ plan_data: updatedPlan })
        .eq("id", planRow.id);

      localStorage.setItem("launchsequence_plan", JSON.stringify(updatedPlan));
      setAddedToPlan(true);
      setShowAddToPlan(false);
    } catch (err) {
      console.error("Add to plan error:", err);
    } finally {
      setAddingToPlan(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <div className="generating">Loading ground control...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <div style={{ flex: 1, maxWidth: "680px", margin: "0 auto", width: "100%", padding: "2.5rem 2rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: "6px" }}>Ground control</p>
              <h1 style={{ fontSize: "2rem", marginBottom: "4px" }}>Systems check</h1>
              <p style={{ fontSize: "14px", color: "var(--color-text-tertiary)" }}>
                How are you actually holding up?
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              {history.length > 0 && (
                <button
                  onClick={() => setStep(step === "history" ? "form" : "history")}
                  className="btn-secondary"
                  style={{ fontSize: "13px", padding: "8px 14px" }}
                >
                  {step === "history" ? "New check-in" : `History (${history.length})`}
                </button>
              )}
              <Link href="/dashboard" className="back-link" style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Check-in form */}
        {step === "form" && (
          <div>
            {/* Mini sparkline if history exists */}
            {history.length >= 2 && (
              <EnergyTrendChart data={history} />
            )}

            {/* Energy level */}
            <div style={{ marginBottom: "2rem" }}>
              <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "12px" }}>
                How are your energy levels this week?
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                {ENERGY_LEVELS.map((level) => (
                  <div
                    key={level.value}
                    onClick={() => setEnergy(level.value)}
                    role="radio"
                    aria-checked={energy === level.value}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setEnergy(level.value)}
                    style={{
                      padding: "14px 16px",
                      borderRadius: "var(--radius)",
                      border: energy === level.value
                        ? `1px solid ${level.color}`
                        : "1px solid var(--color-border-subtle)",
                      background: energy === level.value
                        ? `${level.color}18`
                        : "var(--color-bg-card)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: level.color, marginBottom: "2px" }}>
                        {level.value} / 4
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)" }}>
                        {level.label}
                      </div>
                    </div>
                    {energy === level.value && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={level.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Weighing on you */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label htmlFor="weighing" style={{ fontSize: "15px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "10px", display: "block" }}>
                What's weighing on you right now?
              </label>
              <div style={{ position: "relative" }}>
                <textarea
                  id="weighing"
                  value={weighing}
                  onChange={(e) => setWeighing(e.target.value)}
                  placeholder="e.g., I have a difficult conversation coming up with a direct report who is underperforming. I keep putting it off..."
                  rows={4}
                  style={{ resize: "none", paddingRight: "44px" }}
                />
                <div style={{ position: "absolute", bottom: "10px", right: "10px" }}>
                  <VoiceInput onTranscript={(t) => setWeighing((prev) => (prev ? prev + " " : "") + t)} />
                </div>
              </div>
            </div>

            {/* Went well */}
            <div style={{ marginBottom: "2rem" }}>
              <label htmlFor="wentWell" style={{ fontSize: "15px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "10px", display: "block" }}>
                What's one thing that went well this week?
              </label>
              <div style={{ position: "relative" }}>
                <textarea
                  id="wentWell"
                  value={wentWell}
                  onChange={(e) => setWentWell(e.target.value)}
                  placeholder="e.g., I finally had the 1:1 with my skip-level that I had been nervous about. It went better than expected..."
                  rows={3}
                  style={{ resize: "none", paddingRight: "44px" }}
                />
                <div style={{ position: "absolute", bottom: "10px", right: "10px" }}>
                  <VoiceInput onTranscript={(t) => setWentWell((prev) => (prev ? prev + " " : "") + t)} />
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!energy || !weighing.trim() || !wentWell.trim() || submitting}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              {submitting ? "Running systems check..." : "Submit check-in"}
            </button>
          </div>
        )}

        {/* AI Response */}
        {step === "response" && (
          <div>
            <div style={{ marginBottom: "1.5rem", padding: "14px 16px", background: "var(--color-bg-card)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", color: ENERGY_LEVELS[(energy || 1) - 1].color }}>
                {energy} / 4
              </div>
              <div style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
                {ENERGY_LEVELS[(energy || 1) - 1].label}
              </div>
            </div>

            <div className="card-warm" style={{ marginBottom: "1.5rem" }}>
              <p className="eyebrow" style={{ color: "var(--color-amber)", marginBottom: "12px" }}>
                Ground control responds
              </p>
              <p style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.15rem",
                fontWeight: 400,
                fontStyle: "italic",
                color: "var(--color-text-primary)",
                lineHeight: "1.7",
                margin: 0,
              }}>
                {aiResponse}
              </p>
            </div>

            {/* Add to flight plan */}
            {!addedToPlan && !showAddToPlan && (
              <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <button
                  onClick={() => {
                    setShowAddToPlan(true);
                    setAddActionTitle(weighing.split(".")[0].slice(0, 80).trim());
                  }}
                  style={{
                    fontSize: "13px",
                    color: "var(--color-teal)",
                    background: "none",
                    border: "1px solid rgba(14,178,205,0.3)",
                    borderRadius: "var(--radius)",
                    padding: "8px 14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Add to flight plan
                </button>
                <CoachingCTA trigger="link" label="Talk to Leah about this" context="ground-control" />
              </div>
            )}

            {showAddToPlan && (
              <div style={{ marginBottom: "1.5rem", padding: "16px", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)" }}>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "12px" }}>
                  Add an action to your flight plan
                </p>
                <div style={{ marginBottom: "10px" }}>
                  <label style={{ fontSize: "12px", color: "var(--color-text-tertiary)", display: "block", marginBottom: "6px" }}>Action title</label>
                  <input
                    type="text"
                    value={addActionTitle}
                    onChange={(e) => setAddActionTitle(e.target.value)}
                    placeholder="e.g., Schedule the difficult conversation with my direct report"
                    style={{ fontSize: "13px", padding: "8px 12px" }}
                  />
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "12px", color: "var(--color-text-tertiary)", display: "block", marginBottom: "6px" }}>Add to phase</label>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {[
                      { key: "t10", label: "T-10" },
                      { key: "observe", label: "Observe" },
                      { key: "orient", label: "Orient" },
                      { key: "act", label: "Act" },
                    ].map((p) => (
                      <button
                        key={p.key}
                        onClick={() => setAddPhase(p.key)}
                        style={{
                          fontSize: "12px",
                          padding: "5px 12px",
                          borderRadius: "var(--radius)",
                          border: `1px solid ${addPhase === p.key ? "var(--color-teal)" : "var(--color-border-subtle)"}`,
                          background: addPhase === p.key ? "rgba(14,178,205,0.1)" : "transparent",
                          color: addPhase === p.key ? "var(--color-teal)" : "var(--color-text-tertiary)",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={handleAddToPlan}
                    disabled={!addActionTitle.trim() || addingToPlan}
                    className="btn-primary"
                    style={{ fontSize: "12px", padding: "7px 16px" }}
                  >
                    {addingToPlan ? "Adding..." : "Add to plan"}
                  </button>
                  <button
                    onClick={() => setShowAddToPlan(false)}
                    className="back-link"
                    style={{ fontSize: "12px" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {addedToPlan && (
              <div style={{ marginBottom: "1.5rem", padding: "10px 14px", background: "rgba(106,232,164,0.08)", border: "1px solid rgba(106,232,164,0.25)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", gap: "8px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-mint)", flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span style={{ fontSize: "13px", color: "var(--color-mint)" }}>Added to your flight plan.</span>
                <Link href="/plan" style={{ fontSize: "13px", color: "var(--color-teal)", marginLeft: "auto" }}>View plan</Link>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleNewCheckIn} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>
                New check-in
              </button>
              <Link href="/dashboard" className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                Back to dashboard
              </Link>
            </div>
          </div>
        )}

        {/* History */}
        {step === "history" && (
          <div>
            {history.length === 0 ? (
              <p style={{ color: "var(--color-text-tertiary)", fontSize: "14px" }}>No check-ins yet.</p>
            ) : (
              <>
                <EnergyTrendChart data={history} />
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {history.map((item) => {
                    const energyInfo = ENERGY_LEVELS[(item.energy_level || 1) - 1];
                    const date = new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                    return (
                      <div key={item.id} className="card">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: energyInfo.color }} />
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: energyInfo.color }}>
                              {item.energy_level} / 4 — {energyInfo.label}
                            </div>
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--color-text-minimum)" }}>{date}</div>
                        </div>
                        {item.ai_response && (
                          <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)", lineHeight: "1.6", fontStyle: "italic", margin: 0 }}>
                            {item.ai_response}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
