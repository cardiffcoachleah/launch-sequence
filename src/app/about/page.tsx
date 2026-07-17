import Nav from "@/components/Nav";
import Link from "next/link";

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
              Most leadership transitions fail not because of competence, but because of context. You walk into a new role, a promotion, or an unfamiliar function — and no one gives you a real map. You are expected to figure it out, fast, while also performing and building trust and managing your own nervous system.
            </p>
            <p style={{ fontSize: "15px", lineHeight: "1.8", color: "var(--color-text-secondary)" }}>
              Launch Sequence is an AI-powered companion that gives you that map. It starts with a personalized briefing — what kind of transition you are in, what the stakes are, what you are most worried about. From that, it builds a plan tailored to your specific situation: a T-10 pre-launch phase, then 30, 60, and 90 days of Observe, Orient, and Act.
            </p>
            <p style={{ fontSize: "15px", lineHeight: "1.8", color: "var(--color-text-secondary)" }}>
              The plan is not a template. It knows whether you are stepping up or moving laterally, whether you are managing former peers, whether you are walking into a turnaround or a scaleup. It gives you a reading list for your T-10 window. And it stays with you — a place to track your actions, log what you are learning, check in on how you are holding up, and keep track of the people who matter to this transition.
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
              The instinct in any new role is to move fast, demonstrate value, and show everyone they made the right call. That instinct is usually wrong. The leaders who land well are the ones who listen first, form genuine relationships before forming opinions, and resist the urge to import solutions from wherever they came from.
            </p>
            <p style={{ fontSize: "15px", lineHeight: "1.8", color: "var(--color-text-secondary)" }}>
              This product is built around that belief. The phases are named for what they require of you, not what you are supposed to deliver. Observe. Orient. Act. In that order, on purpose.
            </p>
            <p style={{ fontSize: "15px", lineHeight: "1.8", color: "var(--color-text-secondary)" }}>
              It also takes seriously the fact that transitions are hard on the whole person, not just the professional one. Ground Control exists because how you are holding up matters. The plan adapts because reality never matches the briefing. The Captain's Log exists because writing things down is how most of us actually make sense of what is happening.
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
              I have been in technology for 25 years — at Amazon, Google, Expedia, Klarna, and a handful of Sequoia-backed startups. I have navigated six major leadership transitions personally: new companies, significant step-ups, lateral moves into unfamiliar functions. Some went well. Some did not. I learned more from the ones that did not.
            </p>
            <p style={{ fontSize: "15px", lineHeight: "1.8", color: "var(--color-text-secondary)" }}>
              I am an ICF PCC-certified executive coach with over 1,500 hours of coaching practice. I work with tech leaders — product managers, engineers, designers, and executives — on the things that are hard to name: imposter syndrome at a new altitude, the loneliness of senior leadership, the politics of organizations that do not run the way they look on paper.
            </p>
            <p style={{ fontSize: "15px", lineHeight: "1.8", color: "var(--color-text-secondary)" }}>
              I built Launch Sequence because the coaching frameworks I use with clients — the listening tour, the stakeholder map, the 30/60/90 structure — work, but most people do not have access to a coach during a transition. This product is my attempt to change that. It is not a replacement for real coaching. But it is a real tool, built by someone who has lived this.
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

        {/* CTA */}
        <div style={{ textAlign: "center", padding: "0.5rem 0 1rem" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", fontStyle: "italic", fontWeight: 400, color: "var(--color-text-secondary)", marginBottom: "1.5rem", lineHeight: "1.6" }}>
            Ready to build your plan?
          </p>
          <Link href="/briefing" className="btn-primary">
            Begin mission briefing
          </Link>
        </div>

      </div>
    </div>
  );
}
