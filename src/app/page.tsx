import Link from "next/link";
import Nav from "@/components/Nav";

const phases = [
  {
    number: "T-10",
    title: "Pre-launch",
    description: "Set intentions, map the org, ground yourself before you walk in.",
  },
  {
    number: "01\u201330",
    title: "Observe",
    description: "Listen deeply. Build relationships. Learn the real landscape.",
  },
  {
    number: "31\u201360",
    title: "Orient",
    description: "Form your point of view. Score early wins. Build credibility.",
  },
  {
    number: "61\u201390",
    title: "Act",
    description: "Make your move. Shape the team. Place your first big bet.",
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
    description: "AI-generated plan personalized to your role, team, and context.",
    color: "teal",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19.5 12.572l-7.5 7.428l-7.5-7.428A5 5 0 1112 6.006a5 5 0 117.5 6.572" />
      </svg>
    ),
    title: "Ground control",
    description: "Wellbeing check-ins that ask how you are holding up, not just what you are doing.",
    color: "amber",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    title: "Captain's log",
    description: "Weekly reflections tied to your current phase. Private, structured, yours.",
    color: "mint",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <Nav />

      <section style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center", padding: "5rem 1.5rem 4rem" }}>
        <p className="eyebrow" style={{ marginBottom: "1.5rem" }}>For leaders in transition</p>
        <h1 className="heading-display" style={{ fontSize: "2.8rem", marginBottom: "1.5rem" }}>
          Your first 90 days,
          <br />
          <em style={{ color: "var(--color-teal)" }}>planned before day one.</em>
        </h1>
        <p style={{ fontSize: "15px", lineHeight: "1.7", color: "var(--color-text-tertiary)", maxWidth: "460px", margin: "0 auto 2.5rem" }}>
          A personalized transition companion for leaders stepping into something new. New job, promotion, or career pivot. From T-10 to stable orbit.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <Link href="/briefing" className="btn-primary">Begin mission briefing</Link>
          <a href="#phases" className="btn-secondary">See how it works</a>
        </div>
      </section>

      <div style={{ padding: "0 2rem" }}><div className="divider" /></div>

      <section id="phases" style={{ padding: "2.5rem 2rem" }}>
        <p className="eyebrow" style={{ textAlign: "center", marginBottom: "2rem" }}>Mission phases</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", maxWidth: "900px", margin: "0 auto" }}>
          {phases.map((phase) => (
            <div key={phase.number} className="card">
              <div className="phase-number" style={{ marginBottom: "8px" }}>{phase.number}</div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "6px" }}>{phase.title}</div>
              <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", lineHeight: "1.5" }}>{phase.description}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ padding: "0 2rem" }}><div className="divider" /></div>

      <section style={{ padding: "2.5rem 2rem" }}>
        <p className="eyebrow" style={{ textAlign: "center", marginBottom: "2rem" }}>Onboard systems</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", maxWidth: "800px", margin: "0 auto" }}>
          {systems.map((system) => {
            const iconColor = system.color === "teal" ? "var(--color-teal)" : system.color === "amber" ? "var(--color-amber)" : "var(--color-mint)";
            const borderColor = system.color === "teal" ? "rgba(14,178,205,0.3)" : system.color === "amber" ? "rgba(245,166,35,0.3)" : "rgba(106,232,164,0.3)";
            return (
              <div key={system.title} style={{ textAlign: "center", padding: "1.25rem 1rem" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: `1px solid ${borderColor}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: iconColor }}>
                  {system.icon}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "4px" }}>{system.title}</div>
                <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", lineHeight: "1.5" }}>{system.description}</div>
              </div>
            );
          })}
        </div>
      </section>

      <footer style={{ textAlign: "center", padding: "2rem", borderTop: "1px solid var(--color-border-subtle)" }}>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", fontWeight: 300, fontStyle: "italic", color: "var(--color-text-tertiary)", marginBottom: "8px" }}>
          Built by a coach who has lived this transition six times.
        </p>
        <p style={{ fontSize: "12px", color: "var(--color-text-minimum)" }}>
          A project by Leah Farmer &middot;{" "}
          <a href="https://leahfarmer.com" style={{ color: "var(--color-text-minimum)" }}>leahfarmer.com</a>
        </p>
      </footer>
    </div>
  );
}
