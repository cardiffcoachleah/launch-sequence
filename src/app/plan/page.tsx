"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";

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

const categoryStyles: Record<string, { color: string; label: string }> = {
  relationships: { color: "var(--color-teal)", label: "Relationships" },
  strategy:      { color: "var(--color-mint)", label: "Strategy" },
  self:          { color: "var(--color-amber)", label: "Self" },
  logistics:     { color: "var(--color-text-tertiary)", label: "Logistics" },
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
  }, [router]);

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
                <div key={i} className="card">
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
