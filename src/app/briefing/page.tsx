"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";

interface BriefingData {
  email: string;
  function_area: string;
  level: string;
  company_stage: string;
  team_situation: string;
  reporting_to: string;
  team_size: string;
  start_date: string;
  biggest_concern: string;
  what_success_looks_like: string;
}

const STEPS = [
  {
    id: "email",
    label: "First, where do we send your plan?",
    sublabel: "Your email is how you access your mission dashboard and save your progress. No password needed.",
    type: "email" as const,
    field: "email" as keyof BriefingData,
  },
  {
    id: "function_area",
    label: "What do you do?",
    sublabel: "The discipline or function you work in.",
    type: "cards" as const,
    options: [
      { value: "Product", description: "" },
      { value: "Engineering", description: "" },
      { value: "Design", description: "" },
      { value: "Marketing", description: "" },
      { value: "Sales", description: "" },
      { value: "Operations", description: "" },
      { value: "HR / People", description: "" },
      { value: "Finance", description: "" },
      { value: "Data / Analytics", description: "" },
      { value: "Founder / CEO", description: "" },
      { value: "Other", description: "" },
    ],
    field: "function_area" as keyof BriefingData,
  },
  {
    id: "level",
    label: "What level is the role?",
    sublabel: "This helps us calibrate the scope and stakes of your transition.",
    type: "cards" as const,
    options: [
      { value: "Manager / Lead", description: "" },
      { value: "Senior Manager", description: "" },
      { value: "Director", description: "" },
      { value: "Senior Director", description: "" },
      { value: "VP", description: "" },
      { value: "SVP / EVP", description: "" },
      { value: "C-suite (CTO, CPO, CMO, etc.)", description: "" },
      { value: "General Manager", description: "" },
      { value: "Founder / CEO", description: "" },
      { value: "Other", description: "" },
    ],
    field: "level" as keyof BriefingData,
  },
  {
    id: "company_stage",
    label: "What stage is the company?",
    sublabel: "This shapes how aggressive your first moves should be.",
    type: "cards" as const,
    options: [
      {
        value: "Early-stage startup (pre-product-market fit)",
        description: "Still finding the path. Speed and scrappiness matter most.",
      },
      {
        value: "Growth-stage startup (post-PMF, scaling)",
        description: "You found the thing. Now you need to scale it without breaking it.",
      },
      {
        value: "Scaleup (hundreds of people, finding structure)",
        description: "Growing fast, adding process. The org is outrunning its systems.",
      },
      {
        value: "Corporate (large, established organization)",
        description: "Complex org, deep history. Alignment and politics are real.",
      },
      {
        value: "Turnaround (something needs fixing)",
        description: "Performance issues, cultural debt, or strategic misalignment. You were hired to change things.",
      },
      {
        value: "Post-acquisition or merger",
        description: "Two worlds colliding. Your job is to make sense of the overlap.",
      },
    ],
    field: "company_stage" as keyof BriefingData,
  },
  {
    id: "team_situation",
    label: "What is the team situation?",
    sublabel: "This determines whether your early focus is people or process.",
    type: "cards" as const,
    options: [
      {
        value: "Building from scratch",
        description: "No team yet. You are hiring and defining the function.",
      },
      {
        value: "Inheriting an existing team",
        description: "People are in place. You need to learn them and earn trust.",
      },
      {
        value: "Restructuring",
        description: "The team exists but needs reshaping. Hard conversations ahead.",
      },
      {
        value: "Joining as a peer leader (individual contributor)",
        description: "You are not managing a team directly. Influence over authority.",
      },
    ],
    field: "team_situation" as keyof BriefingData,
  },
  {
    id: "reporting_to",
    label: "Who will you report to?",
    sublabel: "Your manager relationship shapes everything in the first 90 days.",
    type: "select" as const,
    options: [
      "Team Lead / Senior IC",
      "Manager",
      "Senior Manager",
      "Director",
      "Senior Director",
      "VP",
      "SVP / EVP",
      "C-suite (CEO, CTO, COO, etc.)",
      "Founder",
      "Board / Investors",
      "Other",
    ],
    field: "reporting_to" as keyof BriefingData,
  },
  {
    id: "team_size",
    label: "How large is your org?",
    sublabel: "Direct and indirect reports combined.",
    type: "cards" as const,
    options: [
      { value: "Solo (just me for now)", description: "" },
      { value: "Small (2 to 5 people)", description: "" },
      { value: "Medium (6 to 20 people)", description: "" },
      { value: "Large (21 to 50 people)", description: "" },
      { value: "Very large (50+ people)", description: "" },
    ],
    field: "team_size" as keyof BriefingData,
  },
  {
    id: "start_date",
    label: "When do you start?",
    sublabel: "This anchors your T-10 pre-launch countdown and your 90-day timeline.",
    type: "date" as const,
    field: "start_date" as keyof BriefingData,
  },
  {
    id: "biggest_concern",
    label: "What are you most nervous about?",
    sublabel:
      "Be honest. This is private and it helps us personalize your plan to what actually matters to you.",
    type: "textarea" as const,
    placeholder:
      "e.g., I have never managed a team this large before. I am worried about earning credibility with people who have been there longer than me...",
    field: "biggest_concern" as keyof BriefingData,
  },
  {
    id: "what_success_looks_like",
    label: "What does success look like at 90 days?",
    sublabel:
      "If you could fast-forward, what would make you feel like you landed well?",
    type: "textarea" as const,
    placeholder:
      "e.g., I want to have a clear strategy that the team believes in, strong relationships with my peers, and at least one visible win...",
    field: "what_success_looks_like" as keyof BriefingData,
  },
];

export default function BriefingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BriefingData>({
    email: "",
    function_area: "",
    level: "",
    company_stage: "",
    team_situation: "",
    reporting_to: "",
    team_size: "",
    start_date: "",
    biggest_concern: "",
    what_success_looks_like: "",
  });

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;
  const canProceed = data[currentStep.field]?.trim().length > 0;
  const progress = ((step + 1) / STEPS.length) * 100;

  function updateField(value: string) {
    setData((prev) => ({ ...prev, [currentStep.field]: value }));
  }

  async function handleNext() {
    if (isLastStep) {
      setIsGenerating(true);
      setError(null);
      try {
        // Generate the plan
        const res = await fetch("/api/generate-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!res.ok || result.error) {
          throw new Error(result.error || `Server error ${res.status}`);
        }

        // Store in sessionStorage as fallback
        sessionStorage.setItem("launchsequence_plan", JSON.stringify(result));
        sessionStorage.setItem("launchsequence_briefing", JSON.stringify(data));

        // Sign in / create account with magic link, then save to Supabase
        const supabase = createClient();

        // Sign user in with OTP (creates account if first time)
        await supabase.auth.signInWithOtp({
          email: data.email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        });

        // Try to save immediately if user already has a session
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: briefingRow } = await supabase
            .from("briefings")
            .insert({
              user_id: user.id,
              role: `${data.function_area} — ${data.level}`,
              company_stage: data.company_stage,
              team_situation: data.team_situation,
              reporting_to: data.reporting_to,
              team_size: data.team_size,
              start_date: data.start_date,
              biggest_concern: data.biggest_concern,
              what_success_looks_like: data.what_success_looks_like,
            })
            .select()
            .single();

          if (briefingRow) {
            await supabase.from("plans").insert({
              user_id: user.id,
              briefing_id: briefingRow.id,
              plan_data: result,
            });
          }
        }

        router.push("/plan");
      } catch (err) {
        console.error("Plan generation failed:", err);
        setIsGenerating(false);
        setError("Something went wrong generating your plan. Please try again.");
      }
    } else {
      setStep((s) => s + 1);
    }
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="generating mb-4">Generating your flight plan...</div>
            <p style={{ color: "var(--color-text-tertiary)", fontSize: "14px", lineHeight: "1.6" }}>
              Building your personalized transition plan. This usually takes
              under a minute. Worth the wait.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      {/* Progress bar */}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg">

          {/* Step counter */}
          <div className="step-counter mb-6">
            {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
          </div>

          {/* Question */}
          <h2 style={{ fontSize: "1.75rem", marginBottom: "8px" }}>
            {currentStep.label}
          </h2>
          <p style={{ fontSize: "14px", color: "var(--color-text-tertiary)", marginBottom: "32px" }}>
            {currentStep.sublabel}
          </p>

          {/* Email */}
          {currentStep.type === "email" && (
            <input
              type="email"
              value={data[currentStep.field]}
              onChange={(e) => updateField(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canProceed && handleNext()}
              placeholder="you@company.com"
              autoFocus
              style={{ marginBottom: "32px" }}
            />
          )}

          {/* Select */}
          {currentStep.type === "select" && (
            <select
              value={data[currentStep.field]}
              onChange={(e) => updateField(e.target.value)}
              style={{ marginBottom: "32px" }}
            >
              <option value="">Select one...</option>
              {(currentStep.options as string[]).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}

          {/* Cards */}
          {currentStep.type === "cards" && (
            <div style={{ display: "grid", gridTemplateColumns: (currentStep.id === "function_area" || currentStep.id === "level" || currentStep.id === "team_size") ? "repeat(2, 1fr)" : "1fr", gap: "8px", marginBottom: "32px" }}>
              {(currentStep.options as { value: string; description: string }[]).map((opt) => (
                <div
                  key={opt.value}
                  className={`selection-card ${data[currentStep.field] === opt.value ? "selected" : ""}`}
                  onClick={() => updateField(opt.value)}
                  role="radio"
                  aria-checked={data[currentStep.field] === opt.value}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && updateField(opt.value)}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <div className="card-title">{opt.value}</div>
                    {data[currentStep.field] === opt.value && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-teal)", flexShrink: 0 }} aria-hidden="true">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                  {opt.description && (
                    <div className="card-desc">{opt.description}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Date */}
          {currentStep.type === "date" && (
            <input
              type="date"
              value={data[currentStep.field]}
              onChange={(e) => updateField(e.target.value)}
              style={{ marginBottom: "32px" }}
            />
          )}

          {/* Textarea */}
          {currentStep.type === "textarea" && (
            <textarea
              value={data[currentStep.field]}
              onChange={(e) => updateField(e.target.value)}
              placeholder={"placeholder" in currentStep ? currentStep.placeholder : ""}
              rows={5}
              style={{ marginBottom: "32px", resize: "none" }}
            />
          )}

          {/* Error message */}
          {error && (
            <div style={{
              marginBottom: "20px",
              padding: "12px 16px",
              background: "rgba(245, 166, 35, 0.08)",
              border: "1px solid rgba(245, 166, 35, 0.35)",
              borderRadius: "var(--radius)",
              fontSize: "14px",
              color: "var(--color-amber)",
            }}>
              {error}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="back-link"
              style={{ visibility: step === 0 ? "hidden" : "visible", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="btn-primary"
            >
              {isLastStep ? "Generate flight plan" : "Continue"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
