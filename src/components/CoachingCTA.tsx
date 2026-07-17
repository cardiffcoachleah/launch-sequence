"use client";

import { useState } from "react";

interface CoachingCTAProps {
  trigger?: "link" | "button";
  label?: string;
  context?: "dashboard" | "plan" | "ground-control" | "about";
}

const DISCOVERY_URL = "https://calendly.com/lfcoaching/free-discovery-call";
const SESSION_URL = "https://calendly.com/lfcoaching/coaching-session-60-mins";

export default function CoachingCTA({
  trigger = "link",
  label = "Work with Leah",
  context = "dashboard",
}: CoachingCTAProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger */}
      {trigger === "button" ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            fontSize: "13px",
            color: "var(--color-teal)",
            background: "none",
            border: "1px solid rgba(14,178,205,0.3)",
            borderRadius: "var(--radius)",
            padding: "8px 16px",
            cursor: "pointer",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          style={{
            fontSize: "13px",
            color: "var(--color-teal)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            textDecoration: "underline",
            textUnderlineOffset: "3px",
            textDecorationColor: "rgba(14,178,205,0.4)",
          }}
        >
          {label}
        </button>
      )}

      {/* Modal */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: "1.5rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius)",
              padding: "2rem",
              maxWidth: "460px",
              width: "100%",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: "6px" }}>Work with Leah</p>
                <h2 style={{ fontSize: "1.4rem", margin: 0 }}>
                  {context === "ground-control"
                    ? "Want to talk this through?"
                    : "Want support with this transition?"}
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-minimum)", fontSize: "20px", lineHeight: 1, padding: "2px", flexShrink: 0 }}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: "14px", color: "var(--color-text-tertiary)", lineHeight: "1.6", marginBottom: "1.5rem" }}>
              {context === "ground-control"
                ? "Sometimes a check-in surfaces something worth exploring with a real person. Leah is an ICF PCC-certified executive coach with 25 years in tech."
                : "Leah is an ICF PCC-certified executive coach with 25 years in tech. She built this product because the frameworks she uses with clients work. She is also available to work with you directly."}
            </p>

            {/* Two options */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a
                href={DISCOVERY_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
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
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>
                    New client
                  </span>
                  <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--color-teal)" }}>
                    20 min
                  </span>
                </div>
                <span style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>
                  Free discovery call. We figure out if working together makes sense.
                </span>
              </a>

              <a
                href={SESSION_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
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
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>
                    Existing client
                  </span>
                  <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--color-teal)" }}>
                    60 min
                  </span>
                </div>
                <span style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>
                  Book your next coaching session.
                </span>
              </a>
            </div>

            <p style={{ fontSize: "12px", color: "var(--color-text-minimum)", marginTop: "1rem", textAlign: "center" }}>
              Or email{" "}
              <a href="mailto:leah@leahfarmer.com" style={{ color: "var(--color-teal)" }}>
                leah@leahfarmer.com
              </a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
