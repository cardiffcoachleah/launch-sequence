"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";
import CoachingCTA from "@/components/CoachingCTA";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <div style={{ flex: 1, maxWidth: "680px", margin: "0 auto", width: "100%", padding: "3.5rem 2rem" }}>

        {/* What is Launch Sequence */}
        <div style={{ marginBottom: "3.5rem" }}>
          <p className="eyebrow" style={{ marginBottom: "12px" }}>What this is</p>
          <h1 style={{ fontSize: "clamp(1.8rem, 5vw, 2.4rem)", marginBottom: "1.25rem", lineHeight: "1.2" }}>
            A companion for the hardest part of any leadership role.
          </h1>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ fontSize: "15px", lineHeight: "1.8", color: "var(--color-text-secondary)" }}>
              Most leadership transitions fail not because of competence, but because of context. You walk into a new role, a promotion, or an unfamiliar function with no real map. You are expected to figure it out fast, while also performing and building trust and managing your own nervous system.
            </p>
            <p style={{ fontSize: "15px", lineHeight: "1.8", color: "var(--color-text-secondary)" }}>
              Launch Sequence gives you that map. It starts with a briefing: what kind of transition you are in, what the stakes are, what you are most worried about. From that it builds a plan for your specific situation. A T-10 pre-launch phase, then 30, 60, and 90 days of Observe, Orient, and Act.
            </p>
            <p style={{ fontSize: "15px", lineHeight: "1.8", color: "var(--color-text-secondary)" }}>
              The plan is not a template. It knows whether you are stepping up or moving laterally, whether you are managing former peers, whether you are walking into a turnaround or a scaleup. It gives you a reading list for the days before you start. And it stays with you: a place to track your actions, log what you are learning, check in on how you are holding up, and keep track of the people who matter to this transition.
            </p>
          </div>
        </div>

        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, var(--color-border), transparent)", marginBottom: "3.5rem" }} />

        {/* Philosophy */}
        <div style={{ marginBottom: "3.5rem" }}>
          <p className="eyebrow" style={{ marginBottom: "12px" }}>The philosophy</p>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 400, marginBottom: "1.25rem" }}>
            The first 90 days are not about proving yourself.
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ fontSize: "15px", lineHeight: "1.8", color: "var(--color-text-secondary)" }}>
              The instinct in any new role is to move fast, demonstrate value, show everyone they made the right call. That instinct is usually wrong. The leaders who land well are the ones who listen before they form opinions. Who build real relationships before they start making moves. Who resist the urge to import solutions from wherever they just came from.
            </p>
            <p style={{ fontSize: "15px", lineHeight: "1.8", color: "var(--color-text-secondary)" }}>
              The phases in this product are named for what they require of you, not what you are supposed to deliver. Observe. Orient. Act. In that order, on purpose.
            </p>
            <p style={{ fontSize: "15px", lineHeight: "1.8", color: "var(--color-text-secondary)" }}>
              Transitions are hard on the whole person, not just the professional one. Ground Control exists because how you are holding up matters. The plan can be updated because reality never matches the briefing. The Captain's Log exists because writing things down is how most people actually make sense of what is happening.
            </p>
          </div>
        </div>

        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, var(--color-border), transparent)", marginBottom: "3.5rem" }} />

        {/* About Leah */}
        <div style={{ marginBottom: "3.5rem" }}>
          <p className="eyebrow" style={{ marginBottom: "12px" }}>Built by</p>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 400, marginBottom: "1.25rem" }}>
            Leah Farmer
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ fontSize: "15px", lineHeight: "1.8", color: "var(--color-text-secondary)" }}>
              I have been in technology for 25 years. Amazon, Google, Expedia, Klarna, a handful of Sequoia-backed startups. I have navigated six major leadership transitions personally: new companies, significant step-ups, lateral moves into unfamiliar functions. Some went well. Some did not. I learned more from the ones that did not.
            </p>
            <p style={{ fontSize: "15px", lineHeight: "1.8", color: "var(--color-text-secondary)" }}>
              I am an ICF PCC-certified executive coach with over 1,500 hours of coaching practice. I work with tech leaders on the things that are hard to name: imposter syndrome at a new altitude, the loneliness of senior leadership, the politics of organizations that do not run the way they look on paper.
            </p>
            <p style={{ fontSize: "15px", lineHeight: "1.8", color: "var(--color-text-secondary)" }}>
              I built Launch Sequence because the frameworks I use with coaching clients work, but most people do not have access to a coach when a transition starts. The listening tour, the stakeholder map, the 30/60/90 structure. These things help. This product is my attempt to make them available to more people. It is not a replacement for real coaching. But it is a real tool, built by someone who has been in the room.
            </p>
            <p style={{ fontSize: "15px", lineHeight: "1.8", color: "var(--color-text-secondary)" }}>
              I am based in Cardiff, Wales. I also run a fractional CPO practice, a community called The Product Room, and a Substack called Notes in the Margins.
            </p>
          </div>

          {/* Links */}
          <div style={{ marginTop: "1.75rem", display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {[
              { label: "leahfarmer.com", href: "https://leahfarmer.com" },
              { label: "Notes in the Margins", href: "https://leahfarmer.substack.com" },
              { label: "One Question podcast", href: "https://open.spotify.com/show/5E8h0h6ksFjHrIgSujT6oK" },
              { label: "LinkedIn", href: "https://linkedin.com/in/leahfarmer" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "13px",
                  color: "var(--color-teal)",
                  textDecoration: "none",
                  padding: "6px 14px",
                  border: "1px solid rgba(14,178,205,0.3)",
                  borderRadius: "20px",
                  transition: "all 0.2s",
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, var(--color-border), transparent)", marginBottom: "3rem" }} />

        {/* Coaching CTA */}
        <div style={{ marginBottom: "3rem" }}>
          <p className="eyebrow" style={{ marginBottom: "12px" }}>Work with Leah</p>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 400, marginBottom: "1rem" }}>
            Want support beyond the plan?
          </h2>
          <p style={{ fontSize: "15px", lineHeight: "1.8", color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>
            Launch Sequence is designed to be useful on its own. But sometimes you need a real person. If you want to work with Leah directly, there are two ways in.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "460px" }}>
            <a
              href="https://calendly.com/lfcoaching/free-discovery-call"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "16px",
                background: "var(--color-bg-card)",
                border: "1px solid var(--color-border-card)",
                borderRadius: "var(--radius)",
                textDecoration: "none",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-teal)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border-card)")}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>New client</span>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--color-teal)" }}>20 min</span>
              </div>
              <span style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>
                Free discovery call. We figure out if working together makes sense.
              </span>
            </a>
            <a
              href="https://calendly.com/lfcoaching/coaching-session-60-mins"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "16px",
                background: "var(--color-bg-card)",
                border: "1px solid var(--color-border-card)",
                borderRadius: "var(--radius)",
                textDecoration: "none",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-teal)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border-card)")}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>Existing client</span>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--color-teal)" }}>60 min</span>
              </div>
              <span style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>
                Book your next coaching session.
              </span>
            </a>
          </div>
        </div>

        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, var(--color-border), transparent)", marginBottom: "3rem" }} />
        <div style={{ textAlign: "center", padding: "0.5rem 0 1rem" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", fontStyle: "italic", fontWeight: 400, color: "var(--color-text-secondary)", marginBottom: "1.5rem", lineHeight: "1.6" }}>
            Ready to build your plan?
          </p>
          <Link href="/briefing" className="btn-primary">
            Begin mission briefing
          </Link>
        </div>

      </div>
      <Footer />
    </div>
  );
}
