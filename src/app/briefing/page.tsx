"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";

interface BriefingData {
  role: string;
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
    id: "role",
    label: "What role are you stepping into?",
    sublabel: "Select the closest match.",
    type: "select" as const,
    options: [
      "Head of Product",
      "VP of Product",
      "Chief Product Officer",
      "Director of Product",
      "Head of Engineering",
      "VP of Engineering",
      "CTO",
      "Director of Engineering",
      "Head of Design",
      "VP of Design",
      "General Manager",
      "Chief of Staff",
      "Other leadership role",
    ],
    field: "role" as keyof BriefingData,
  },
  {
    id: "company_stage",
    label: "What stage is the company?",
    sublabel: "This shapes how aggressive your first moves should be.",
    type: "cards" as const,
    options: [
      {
        value: "Startup (pre-product-market fit)",
        description: "Still finding the path. Speed and scrappiness matter.",
      },
      {
        value: "Scaleup (growing fast)",
        description: "The machine is running. Your job is to keep up and shape it.",
      },
      {
        value: "Enterprise (established)",
        description: "Big org, deep history. Politics and alignment are real.",
      },
      {
        value: "Turnaround (in trouble)",
        description: "Something is broken. You were hired to fix it.",
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
        value: "Joining as a peer leader",
        description: "You are not managing the team directly. Influence over authority.",
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
      "CEO / Founder",
      "CTO",
      "COO",
      "SVP / EVP",
      "VP (another VP)",
      "Board / Investors",
      "Other",
    ],
    field: "reporting_to" as keyof BriefingData,
  },
  {
    id: "team_size",
    label: "How large is your org / team?",
    sublabel: "Direct and indirect reports combined.",
    type: "cards" as const,
    options: [
      { value: "Solo (just me for now)", description: "" },
      { value: "Small (2-5 people)", description: "" },
      { value: "Medium (6-20 people)", description: "" },
      { value: "Large (21-50 people)", description: "" },
      { value: "Very large (50+)", description: "" },
    ],
    field: "team_size" as keyof BriefingData,
  },
  {
    id: "start_date",
    label: "When do you start?",
    sublabel:
      "This anchors your T-10 pre-launch countdown and your 90-day timeline.",
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
      "e.g., I want to have a clear product strategy that the team believes in, strong relationships with my peers, and at least one visible win...",
    field: "what_success_looks_like" as keyof BriefingData,
  },
];

export default function BriefingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [data, setData] = useState<BriefingData>({
    role: "",
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
      try {
        const res = await fetch("/api/generate-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        // Store plan in sessionStorage for the plan page to read
        sessionStorage.setItem("launchsequence_plan", JSON.stringify(result));
        sessionStorage.setItem("launchsequence_briefing", JSON.stringify(data));
        router.push("/plan");
      } catch (err) {
        console.error("Plan generation failed:", err);
        setIsGenerating(false);
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
          <div className="text-center max-w-md">
            <div className="instrument text-[var(--color-teal)] generating text-lg mb-4">
              Generating your flight plan...
            </div>
            <p className="text-sm text-[var(--color-white-45)]">
              Analyzing your mission parameters and building a personalized
              transition plan. This takes about 15 seconds.
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
      <div className="h-[2px] bg-[var(--color-border-subtle)]">
        <div
          className="h-full bg-[var(--color-teal)] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-lg">
          {/* Step counter */}
          <div className="instrument text-xs text-[var(--color-white-30)] mb-6">
            {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
          </div>

          {/* Question */}
          <h2 className="text-2xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            {currentStep.label}
          </h2>
          <p className="text-sm text-[var(--color-white-45)] mb-8">
            {currentStep.sublabel}
          </p>

          {/* Input based on type */}
          {currentStep.type === "select" && (
            <select
              value={data[currentStep.field]}
              onChange={(e) => updateField(e.target.value)}
              className="mb-8"
            >
              <option value="">Select one...</option>
              {currentStep.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}

          {currentStep.type === "cards" && (
            <div className="grid gap-2 mb-8">
              {currentStep.options.map((opt) => (
                <div
                  key={opt.value}
                  className={`selection-card ${data[currentStep.field] === opt.value ? "selected" : ""}`}
                  onClick={() => updateField(opt.value)}
                >
                  <div className="text-sm font-medium text-[var(--color-white-95)]">
                    {opt.value}
                  </div>
                  {opt.description && (
                    <div className="text-xs text-[var(--color-white-45)] mt-1">
                      {opt.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {currentStep.type === "date" && (
            <input
              type="date"
              value={data[currentStep.field]}
              onChange={(e) => updateField(e.target.value)}
              className="mb-8"
            />
          )}

          {currentStep.type === "textarea" && (
            <textarea
              value={data[currentStep.field]}
              onChange={(e) => updateField(e.target.value)}
              placeholder={currentStep.placeholder}
              rows={4}
              className="mb-8 resize-none"
            />
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="text-sm text-[var(--color-white-30)] hover:text-[var(--color-white-60)] transition-colors"
              style={{ visibility: step === 0 ? "hidden" : "visible" }}
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="btn-primary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isLastStep ? "Generate flight plan" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
