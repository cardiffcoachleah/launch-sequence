"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
        .limit(10);

      if (data) setHistory(data);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSubmit() {
    if (!energy || !weighing.trim() || !wentWell.trim()) return;
    setSubmitting(true);

    try {
      // Get AI response
      const res = await fetch("/api/ground-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ energy_level: energy, weighing_on_you: weighing, went_well: wentWell }),
      });
      const result = await res.json();
      const response = result.response || "Thank you for checking in.";
      setAiResponse(response);

      // Save to Supabase
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("systems_checks").insert({
          user_id: user.id,
          energy_level: energy,
          weighing_on_you: weighing,
          went_well: wentWell,
          ai_response: response,
        });
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
    setStep("form");
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
                  {step === "history" ? "New check-in" : "View history"}
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
              <textarea
                id="weighing"
                value={weighing}
                onChange={(e) => setWeighing(e.target.value)}
                placeholder="e.g., I have a difficult conversation coming up with a direct report who is underperforming. I keep putting it off..."
                rows={4}
                style={{ resize: "none" }}
              />
            </div>

            {/* Went well */}
            <div style={{ marginBottom: "2rem" }}>
              <label htmlFor="wentWell" style={{ fontSize: "15px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "10px", display: "block" }}>
                What's one thing that went well this week?
              </label>
              <textarea
                id="wentWell"
                value={wentWell}
                onChange={(e) => setWentWell(e.target.value)}
                placeholder="e.g., I finally had the 1:1 with my skip-level that I had been nervous about. It went better than expected..."
                rows={3}
                style={{ resize: "none" }}
              />
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
            {/* Energy display */}
            <div style={{ marginBottom: "1.5rem", padding: "14px 16px", background: "var(--color-bg-card)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", color: ENERGY_LEVELS[(energy || 1) - 1].color }}>
                {energy} / 4
              </div>
              <div style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
                {ENERGY_LEVELS[(energy || 1) - 1].label}
              </div>
            </div>

            {/* AI reflection */}
            <div className="card-warm" style={{ marginBottom: "2rem" }}>
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
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {history.map((item) => {
                  const energyInfo = ENERGY_LEVELS[(item.energy_level || 1) - 1];
                  const date = new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                  return (
                    <div key={item.id} className="card">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: energyInfo.color }}>
                          {item.energy_level} / 4 — {energyInfo.label}
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
            )}
          </div>
        )}

      </div>
    </div>
  );
}
