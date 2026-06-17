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
  strategy: { color: "var(--color-mint)", label: "Strategy" },
  self: { color: "var(--color-amber)", label: "Self" },
  logistics: { color: "var(--color-white-45)", label: "Logistics" },
};

const phaseKeys: (keyof Plan)[] = ["t10", "observe", "orient", "act"];

const phaseNumbers: Record<string, string> = {
  t10: "T-10",
  observe: "01\u201330",
  orient: "31\u201360",
  act: "61\u201390",
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
          <div className="instrument text-[var(--color-teal)] generating">
            Loading flight plan...
          </div>
        </div>
      </div>
    );
  }

  const phase = plan[activePhase];

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <div className="flex-1 flex">
        {/* Phase sidebar */}
        <aside className="w-64 border-r border-[var(--color-border-subtle)] p-6 shrink-0">
          <p className="eyebrow mb-4">Mission phases</p>
          <div className="space-y-1">
            {phaseKeys.map((key) => (
              <button
                key={key}
                onClick={() => setActivePhase(key)}
                className={`w-full text-left px-3 py-2.5 rounded-[var(--radius)] transition-all text-sm ${
                  activePhase === key
                    ? "bg-[var(--color-teal-dim)] text-[var(--color-teal)]"
                    : "text-[var(--color-white-45)] hover:text-[var(--color-white-85)] hover:bg-[var(--color-teal-glow)]"
                }`}
              >
                <span className="instrument text-xs mr-2">
                  {phaseNumbers[key]}
                </span>
                {plan[key].title.split(": ")[1] || plan[key].title}
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-[var(--color-border-subtle)]">
            <p className="eyebrow mb-3">Legend</p>
            <div className="space-y-2">
              {Object.entries(categoryStyles).map(([key, style]) => (
                <div key={key} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: style.color }}
                  />
                  <span className="text-xs text-[var(--color-white-45)]">
                    {style.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Plan content */}
        <main className="flex-1 p-8 max-w-3xl">
          <div className="mb-8">
            <div className="phase-number text-2xl mb-2">
              {phaseNumbers[activePhase]}
            </div>
            <h1 className="text-3xl mb-3">{phase.title}</h1>
            <p className="text-sm text-[var(--color-white-60)] leading-relaxed max-w-xl">
              {phase.description}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3 mb-10">
            {phase.actions.map((action, i) => {
              const cat = categoryStyles[action.category] || categoryStyles.logistics;
              return (
                <div key={i} className="card">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div>
                      <div className="text-sm font-medium text-[var(--color-white-95)] mb-1">
                        {action.title}
                      </div>
                      <div className="text-[13px] text-[var(--color-white-45)] leading-relaxed">
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
            <p className="eyebrow mb-2" style={{ color: "var(--color-amber)" }}>
              Reflection
            </p>
            <p className="text-sm text-[var(--color-white-85)] italic leading-relaxed" style={{ fontFamily: "var(--font-heading)", fontSize: "1.1rem" }}>
              {phase.reflection}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
