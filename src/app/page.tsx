import Link from "next/link";
import Nav from "@/components/Nav";

const phases = [
  {
    number: "T-10",
    title: "Pre-launch",
    description:
      "Set intentions, map the org, ground yourself before you walk in.",
  },
  {
    number: "01\u201330",
    title: "Observe",
    description:
      "Listen deeply. Build relationships. Learn the real landscape.",
  },
  {
    number: "31\u201360",
    title: "Orient",
    description:
      "Form your point of view. Score early wins. Build credibility.",
  },
  {
    number: "61\u201390",
    title: "Act",
    description:
      "Make your move. Shape the team. Place your first big bet.",
  },
];

const systems = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3V7z" />
        <path d="M9 4v13" />
        <path d="M15 7v13" />
      </svg>
    ),
    title: "Flight plan",
    description:
      "AI-generated plan personalized to your role, team, and context.",
    color: "teal",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19.5 12.572l-7.5 7.428l-7.5-7.428A5 5 0 1112 6.006a5 5 0 117.5 6.572" />
      </svg>
    ),
    title: "Ground control",
    description:
      "Wellbeing check-ins that ask how you are holding up, not just what you are doing.",
    color: "amber",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20v-6M6 20v-4M18 20V10" />
        <path d="M12 4v2M6 10v2M18 4v2" />
      </svg>
    ),
    title: "Mission reports",
    description:
      "Structured feedback from your key people at 30, 60, and 90 days.",
    color: "mint",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <Nav />

      {/* Hero */}
      <section className="max-w-[600px] mx-auto text-center px-6 pt-20 pb-16">
        <p className="eyebrow mb-6">For leaders in transition</p>
        <h1 className="text-5xl leading-tight mb-6">
          Your first 90 days,
          <br />
          <em className="text-[var(--color-teal)]">
            planned before day one.
          </em>
        </h1>
        <p className="text-[15px] leading-relaxed text-[var(--color-white-60)] max-w-[460px] mx-auto mb-10">
          A personalized transition companion that helps you land well in your
          new leadership role. From T-10 to stable orbit.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/briefing" className="btn-primary">
            Begin mission briefing
          </Link>
          <a href="#phases" className="btn-secondary">
            See how it works
          </a>
        </div>
      </section>

      <div className="px-8">
        <div className="divider" />
      </div>

      {/* Phases */}
      <section id="phases" className="px-8 py-10">
        <p className="eyebrow text-center mb-8">Mission phases</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
          {phases.map((phase) => (
            <div key={phase.number} className="card">
              <div className="phase-number mb-2">{phase.number}</div>
              <div className="text-[13px] font-medium text-[var(--color-white-95)] mb-1.5">
                {phase.title}
              </div>
              <div className="text-xs text-[var(--color-white-45)] leading-relaxed">
                {phase.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="px-8">
        <div className="divider" />
      </div>

      {/* Systems */}
      <section className="px-8 py-10">
        <p className="eyebrow text-center mb-8">Onboard systems</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto">
          {systems.map((system) => {
            const borderColor =
              system.color === "teal"
                ? "rgba(14, 178, 205, 0.3)"
                : system.color === "amber"
                  ? "rgba(245, 166, 35, 0.3)"
                  : "rgba(106, 232, 164, 0.3)";
            const iconColor =
              system.color === "teal"
                ? "var(--color-teal)"
                : system.color === "amber"
                  ? "var(--color-amber)"
                  : "var(--color-mint)";

            return (
              <div key={system.title} className="text-center px-4 py-5">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{
                    border: `1px solid ${borderColor}`,
                    color: iconColor,
                  }}
                >
                  {system.icon}
                </div>
                <div className="text-[13px] font-medium text-[var(--color-white-95)] mb-1">
                  {system.title}
                </div>
                <div className="text-xs text-[var(--color-white-45)] leading-relaxed">
                  {system.description}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-[var(--color-border-subtle)]">
        <p className="text-[1.3rem] font-[300] italic text-[var(--color-white-45)] mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          Built by a coach who has lived this transition six times.
        </p>
        <p className="text-xs text-[var(--color-white-30)]">
          A project by Leah Farmer &middot;{" "}
          <a
            href="https://leahfarmer.com"
            className="text-[var(--color-white-30)] hover:text-[var(--color-teal)]"
          >
            leahfarmer.com
          </a>
        </p>
      </footer>
    </div>
  );
}
