"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";

interface BriefingData {
  function_area: string;
  transition_type: string;
  seniority_change: string;
  level: string;
  company_stage: string;
  company_stage_detail: string;
  team_situation: string;
  team_situation_detail: string;
  reporting_to: string;
  team_size: string;
  start_date: string;
  biggest_concern: string;
  what_success_looks_like: string;
}

const STEPS = [
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
    showAlways: true,
  },
  {
    id: "transition_type",
    label: "What type of transition is this?",
    sublabel: "This shapes everything that follows — your plan will be built around your specific situation.",
    type: "cards" as const,
    options: [
      {
        value: "Joining a new company",
        description: "Starting fresh somewhere new. Clean slate, new culture, everything to learn.",
      },
      {
        value: "Promotion or internal move",
        description: "New role, same company. You carry history, relationships, and reputation — for better and worse.",
      },
      {
        value: "New career path or function",
        description: "Stepping into a discipline or field that is largely new territory for you.",
      },
    ],
    field: "transition_type" as keyof BriefingData,
    showAlways: true,
  },
  {
    id: "seniority_change",
    label: "Is this a step up or a lateral move?",
    sublabelFn: (data: BriefingData) =>
      data.transition_type === "Promotion or internal move"
        ? "Knowing whether you are moving up a level or across at the same level changes what we will tell you to focus on."
        : "Taking on more seniority at a new company is a double transition — new culture and new altitude at the same time. We need to know.",
    type: "cards" as const,
    options: [
      {
        value: "Stepping up — this is a more senior role than my last one",
        description: "More scope, more visibility, higher stakes. You are operating at a new altitude.",
      },
      {
        value: "Lateral — similar level to my previous role",
        description: "Same seniority, different context. You are applying proven skills in a new environment.",
      },
    ],
    field: "seniority_change" as keyof BriefingData,
    showWhen: (data: BriefingData) =>
      data.transition_type === "Joining a new company" ||
      data.transition_type === "Promotion or internal move",
  },
  {
    id: "level",
    label: "What level is the role?",
    sublabel: "This helps us calibrate the scope and stakes of your transition.",
    type: "cards" as const,
    options: [
      { value: "IC — Junior (early career, 0 to 3 years)", description: "" },
      { value: "IC — Mid-level (3 to 7 years)", description: "" },
      { value: "IC — Senior / Staff / Principal", description: "" },
      { value: "Manager / Lead (first-time or returning people manager)", description: "" },
      { value: "Senior Manager", description: "" },
      { value: "Director", description: "" },
      { value: "Senior Director", description: "" },
      { value: "VP", description: "" },
      { value: "SVP / EVP", description: "" },
      { value: "C-suite (CTO, CPO, CMO, etc.)", description: "" },
      { value: "General Manager", description: "" },
      { value: "Founder / CEO", description: "" },
    ],
    field: "level" as keyof BriefingData,
    showAlways: true,
  },
  {
    id: "company_stage",
    label: "What stage is the company?",
    sublabel: "This shapes how aggressive your first moves should be.",
    type: "cards" as const,
    options: [
      { value: "Early-stage startup (pre-product-market fit)", description: "Still finding the path. Speed and scrappiness matter most." },
      { value: "Growth-stage startup (post-PMF, scaling)", description: "You found the thing. Now you need to scale it without breaking it." },
      { value: "Scaleup (hundreds of people, finding structure)", description: "Growing fast, adding process. The org is outrunning its systems." },
      { value: "Corporate (large, established organization)", description: "Complex org, deep history. Alignment and politics are real." },
      { value: "Turnaround (something needs fixing)", description: "Performance issues, cultural debt, or strategic misalignment. You were hired to change things." },
      { value: "Post-acquisition or merger", description: "Two worlds colliding. Your job is to make sense of the overlap." },
    ],
    field: "company_stage" as keyof BriefingData,
    showAlways: true,
  },
  {
    id: "company_stage_detail",
    label: "Anything else about the company we should know?",
    sublabel: "Optional — but the more context you give us, the more specific your plan will be. Skip if nothing comes to mind.",
    type: "textarea-optional" as const,
    placeholder: "e.g., The company just raised a Series B and is under pressure to hit aggressive growth targets. The team is distributed across 3 time zones...",
    field: "company_stage_detail" as keyof BriefingData,
    showAlways: true,
  },
  {
    id: "team_situation",
    label: "What is the team situation?",
    sublabel: "This determines whether your early focus is people or process.",
    type: "cards" as const,
    options: [
      { value: "Building from scratch", description: "No team yet. You are hiring and defining the function." },
      { value: "Inheriting an existing team", description: "People are in place. You need to learn them and earn trust." },
      { value: "Former peers are now my direct reports", description: "You have been promoted above people you worked alongside. One of the hardest transitions there is." },
      { value: "Restructuring", description: "The team exists but needs reshaping. Hard conversations ahead." },
      { value: "No direct reports (IC or peer leader)", description: "You are not managing a team directly. Influence over authority." },
    ],
    field: "team_situation" as keyof BriefingData,
    showAlways: true,
  },
  {
    id: "team_situation_detail",
    label: "Anything else about the team situation we should know?",
    sublabel: "Optional — team dynamics are often where transitions succeed or fail. Any context helps.",
    type: "textarea-optional" as const,
    placeholder: "e.g., Two of my direct reports applied for my role and did not get it. The team has been through three managers in two years...",
    field: "team_situation_detail" as keyof BriefingData,
    showAlways: true,
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
    showAlways: true,
  },
  {
    id: "team_size",
    label: "How large is your org relative to the company?",
    sublabel: "We ask it this way because 50 people at a startup is enormous, while 50 people at a large enterprise is a normal mid-size team.",
    type: "cards" as const,
    options: [
      { value: "Just me — no team yet", description: "" },
      { value: "Small relative to the company (2 to 5 people)", description: "" },
      { value: "Average size for this company", description: "" },
      { value: "Larger than most teams here", description: "" },
      { value: "One of the largest orgs in the company", description: "" },
    ],
    field: "team_size" as keyof BriefingData,
    showAlways: true,
  },
  {
    id: "start_date",
    label: "When does the new role begin?",
    sublabel: "This anchors your T-10 pre-launch countdown and your 90-day timeline.",
    type: "date" as const,
    field: "start_date" as keyof BriefingData,
    showAlways: true,
  },
  {
    id: "biggest_concern",
    label: "What are you most nervous about?",
    sublabel: "Be honest. This is private and it helps us personalize your plan to what actually matters to you.",
    type: "textarea" as const,
    placeholder: "e.g., I have never managed a team this large before. I am worried about earning credibility with people who have been there longer than me...",
    field: "biggest_concern" as keyof BriefingData,
    showAlways: true,
  },
  {
    id: "what_success_looks_like",
    label: "What does success look like at 90 days?",
    sublabel: "If you could fast-forward, what would make you feel like you landed well?",
    type: "textarea" as const,
    placeholder: "e.g., I want to have a clear strategy that the team believes in, strong relationships with my peers, and at least one visible win...",
    field: "what_success_looks_like" as keyof BriefingData,
    showAlways: true,
  },
];

export default function BriefingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BriefingData>({
    function_area: "",
    transition_type: "",
    seniority_change: "",
    level: "",
    company_stage: "",
    company_stage_detail: "",
    team_situation: "",
    team_situation_detail: "",
    reporting_to: "",
    team_size: "",
    start_date: "",
    biggest_concern: "",
    what_success_looks_like: "",
  });

  // Filter steps based on showWhen conditions
  const visibleSteps = STEPS.filter((s) => {
    if ("showAlways" in s && s.showAlways) return true;
    if ("showWhen" in s && s.showWhen) return s.showWhen(data);
    return true;
  });

  const currentStep = visibleSteps[step];
  const isLastStep = step === visibleSteps.length - 1;
  const isOptional = currentStep.type === "textarea-optional";
  const canProceed = isOptional || data[currentStep.field]?.trim().length > 0;
  const progress = ((step + 1) / visibleSteps.length) * 100;

  // Get sublabel — either static string or function
  const sublabel = "sublabelFn" in currentStep && typeof currentStep.sublabelFn === "function"
    ? currentStep.sublabelFn(data)
    : "sublabel" in currentStep ? currentStep.sublabel : "";

  function updateField(value: string) {
    setData((prev) => ({ ...prev, [currentStep.field]: value }));
  }

  function handleBack() {
    if (step === 0) return;
    // Step back through visible steps
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleNext() {
    if (isLastStep) {
      setIsGenerating(true);
      setError(null);
      try {
        const res = await fetch("/api/generate-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!res.ok || result.error) {
          throw new Error(result.error || `Server error ${res.status}`);
        }
        localStorage.setItem("launchsequence_plan", JSON.stringify(result));
        localStorage.setItem("launchsequence_briefing", JSON.stringify(data));
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
              Building your personalized transition plan. This usually takes under a minute. Worth the wait.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg">

          <div className="step-counter mb-6">
            {String(step + 1).padStart(2, "0")} / {String(visibleSteps.length).padStart(2, "0")}
          </div>

          <h2 style={{ fontSize: "1.75rem", marginBottom: "8px" }}>{currentStep.label}</h2>
          <p style={{ fontSize: "14px", color: "var(--color-text-tertiary)", marginBottom: "32px" }}>
            {sublabel}
            {isOptional && (
              <span style={{ color: "var(--color-text-minimum)", marginLeft: "6px" }}>(optional)</span>
            )}
          </p>

          {/* Select */}
          {currentStep.type === "select" && (
            <select value={data[currentStep.field]} onChange={(e) => updateField(e.target.value)} style={{ marginBottom: "32px" }}>
              <option value="">Select one...</option>
              {(currentStep.options as string[]).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}

          {/* Cards */}
          {currentStep.type === "cards" && (
            <div style={{
              display: "grid",
              gridTemplateColumns: ["function_area", "level", "team_size"].includes(currentStep.id) ? "repeat(2, 1fr)" : "1fr",
              gap: "8px",
              marginBottom: "32px",
            }}>
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
                  {opt.description && <div className="card-desc">{opt.description}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Date */}
          {currentStep.type === "date" && (
            <input type="date" value={data[currentStep.field]} onChange={(e) => updateField(e.target.value)} style={{ marginBottom: "32px" }} />
          )}

          {/* Textarea (required) */}
          {currentStep.type === "textarea" && (
            <textarea
              value={data[currentStep.field]}
              onChange={(e) => updateField(e.target.value)}
              placeholder={"placeholder" in currentStep ? currentStep.placeholder : ""}
              rows={5}
              style={{ marginBottom: "32px", resize: "none" }}
            />
          )}

          {/* Textarea (optional) */}
          {currentStep.type === "textarea-optional" && (
            <textarea
              value={data[currentStep.field]}
              onChange={(e) => updateField(e.target.value)}
              placeholder={"placeholder" in currentStep ? currentStep.placeholder : ""}
              rows={4}
              style={{ marginBottom: "32px", resize: "none" }}
            />
          )}

          {error && (
            <div style={{ marginBottom: "20px", padding: "12px 16px", background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.35)", borderRadius: "var(--radius)", fontSize: "14px", color: "var(--color-amber)" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              onClick={handleBack}
              className="back-link"
              style={{ visibility: step === 0 ? "hidden" : "visible", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back
            </button>
            <button onClick={handleNext} disabled={!canProceed} className="btn-primary">
              {isLastStep ? "Generate flight plan" : isOptional && !data[currentStep.field] ? "Skip" : "Continue"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
