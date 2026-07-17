"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface CrewMember {
  id: string;
  name: string;
  role: string;
  context: string;
  referred_by: string;
  status: "to_meet" | "connected" | "ongoing";
  notes: string;
  feedback_requested: boolean;
  feedback_received: boolean;
  created_at: string;
}

const CONTEXT_OPTIONS = [
  { value: "strategy", label: "Strategy", color: "var(--color-mint)" },
  { value: "team", label: "Team", color: "var(--color-teal)" },
  { value: "cross-functional", label: "Cross-functional", color: "#a78bfa" },
  { value: "external", label: "External", color: "var(--color-amber)" },
  { value: "skip-level", label: "Skip-level", color: "#f472b6" },
  { value: "mentor", label: "Mentor", color: "var(--color-mint)" },
  { value: "peer", label: "Peer", color: "var(--color-teal)" },
];

const STATUS_OPTIONS = [
  { value: "to_meet", label: "To meet", color: "var(--color-text-minimum)" },
  { value: "connected", label: "Connected", color: "var(--color-teal)" },
  { value: "ongoing", label: "Ongoing", color: "var(--color-mint)" },
];

function getContextStyle(context: string) {
  return CONTEXT_OPTIONS.find((c) => c.value === context) || { label: context, color: "var(--color-text-tertiary)" };
}

function getStatusStyle(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status) || { label: status, color: "var(--color-text-minimum)" };
}

const EMPTY_FORM = {
  name: "",
  role: "",
  context: "team",
  referred_by: "",
  status: "to_meet" as const,
  notes: "",
};

export default function FlightCrewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: planRow } = await supabase
        .from("plans")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_current", true)
        .single();

      if (planRow) setPlanId(planRow.id);

      const { data: crewData } = await supabase
        .from("flight_crew")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (crewData) setCrew(crewData);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingId) {
      const { data } = await supabase
        .from("flight_crew")
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq("id", editingId)
        .select()
        .single();

      if (data) {
        setCrew((prev) => prev.map((m) => m.id === editingId ? data : m));
      }
      setEditingId(null);
    } else {
      const { data } = await supabase
        .from("flight_crew")
        .insert({ ...form, user_id: user.id, plan_id: planId })
        .select()
        .single();

      if (data) setCrew((prev) => [data, ...prev]);
    }

    setForm(EMPTY_FORM);
    setShowAddForm(false);
    setSaving(false);
  }

  async function handleStatusCycle(member: CrewMember) {
    const cycle: CrewMember["status"][] = ["to_meet", "connected", "ongoing"];
    const next = cycle[(cycle.indexOf(member.status) + 1) % cycle.length];

    const supabase = createClient();
    await supabase
      .from("flight_crew")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", member.id);

    setCrew((prev) => prev.map((m) => m.id === member.id ? { ...m, status: next } : m));
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("flight_crew").delete().eq("id", id);
    setCrew((prev) => prev.filter((m) => m.id !== id));
    setExpandedId(null);
  }

  function startEdit(member: CrewMember) {
    setForm({
      name: member.name,
      role: member.role || "",
      context: member.context || "team",
      referred_by: member.referred_by || "",
      status: member.status as "to_meet" | "connected" | "ongoing",
      notes: member.notes || "",
    });
    setEditingId(member.id);
    setShowAddForm(true);
    setExpandedId(null);
  }

  const filtered = filter === "all" ? crew : crew.filter((m) => m.context === filter || m.status === filter);
  const toMeetCount = crew.filter((m) => m.status === "to_meet").length;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <div className="generating">Loading flight crew...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <div style={{ flex: 1, maxWidth: "720px", margin: "0 auto", width: "100%", padding: "2.5rem 2rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: "6px" }}>Flight crew</p>
              <h1 style={{ fontSize: "2rem", marginBottom: "4px" }}>Your people</h1>
              <p style={{ fontSize: "14px", color: "var(--color-text-tertiary)" }}>
                The people who matter to this transition. Track who you need to meet, who you have connected with, and what you are learning.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <button
                onClick={() => { setShowAddForm(true); setEditingId(null); setForm(EMPTY_FORM); }}
                className="btn-primary"
                style={{ fontSize: "13px", padding: "8px 16px" }}
              >
                + Add person
              </button>
              <Link href="/dashboard" className="back-link" style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", marginTop: "10px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Add / Edit Form */}
        {showAddForm && (
          <div style={{ marginBottom: "2rem", padding: "20px", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)" }}>
            <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "16px" }}>
              {editingId ? "Edit person" : "Add to flight crew"}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "var(--color-text-tertiary)", display: "block", marginBottom: "5px" }}>Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name"
                  style={{ fontSize: "13px", padding: "8px 12px" }}
                  autoFocus
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "var(--color-text-tertiary)", display: "block", marginBottom: "5px" }}>Role / Title</label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="e.g. VP Engineering"
                  style={{ fontSize: "13px", padding: "8px 12px" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "var(--color-text-tertiary)", display: "block", marginBottom: "5px" }}>Context</label>
                <select
                  value={form.context}
                  onChange={(e) => setForm({ ...form, context: e.target.value })}
                  style={{ fontSize: "13px", padding: "8px 12px" }}
                >
                  {CONTEXT_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "var(--color-text-tertiary)", display: "block", marginBottom: "5px" }}>Referred by</label>
                <input
                  type="text"
                  value={form.referred_by}
                  onChange={(e) => setForm({ ...form, referred_by: e.target.value })}
                  placeholder="Who suggested this person?"
                  style={{ fontSize: "13px", padding: "8px 12px" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", color: "var(--color-text-tertiary)", display: "block", marginBottom: "5px" }}>Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="What do you want to talk about? What did you learn from this person?"
                rows={3}
                style={{ fontSize: "13px", resize: "none" }}
              />
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleSave}
                disabled={!form.name.trim() || saving}
                className="btn-primary"
                style={{ fontSize: "13px", padding: "8px 16px" }}
              >
                {saving ? "Saving..." : editingId ? "Save changes" : "Add to crew"}
              </button>
              <button
                onClick={() => { setShowAddForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
                className="back-link"
                style={{ fontSize: "13px" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        {crew.length > 0 && (
          <div style={{ display: "flex", gap: "16px", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {[
              { label: "Total", value: crew.length, color: "var(--color-text-tertiary)" },
              { label: "To meet", value: toMeetCount, color: "var(--color-amber)" },
              { label: "Connected", value: crew.filter((m) => m.status === "connected").length, color: "var(--color-teal)" },
              { label: "Ongoing", value: crew.filter((m) => m.status === "ongoing").length, color: "var(--color-mint)" },
            ].map((stat) => (
              <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "16px", fontFamily: "var(--font-mono)", fontWeight: 700, color: stat.color }}>{stat.value}</span>
                <span style={{ fontSize: "12px", color: "var(--color-text-minimum)" }}>{stat.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Filter pills */}
        {crew.length > 0 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            <button
              onClick={() => setFilter("all")}
              style={{
                fontSize: "12px", padding: "4px 12px", borderRadius: "20px",
                border: `1px solid ${filter === "all" ? "var(--color-teal)" : "var(--color-border-subtle)"}`,
                background: filter === "all" ? "rgba(14,178,205,0.1)" : "transparent",
                color: filter === "all" ? "var(--color-teal)" : "var(--color-text-tertiary)",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              All
            </button>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => setFilter(s.value)}
                style={{
                  fontSize: "12px", padding: "4px 12px", borderRadius: "20px",
                  border: `1px solid ${filter === s.value ? s.color : "var(--color-border-subtle)"}`,
                  background: filter === s.value ? `${s.color}18` : "transparent",
                  color: filter === s.value ? s.color : "var(--color-text-tertiary)",
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >
                {s.label}
              </button>
            ))}
            {CONTEXT_OPTIONS.slice(0, 5).map((c) => (
              crew.some((m) => m.context === c.value) ? (
                <button
                  key={c.value}
                  onClick={() => setFilter(c.value)}
                  style={{
                    fontSize: "12px", padding: "4px 12px", borderRadius: "20px",
                    border: `1px solid ${filter === c.value ? c.color : "var(--color-border-subtle)"}`,
                    background: filter === c.value ? `${c.color}18` : "transparent",
                    color: filter === c.value ? c.color : "var(--color-text-tertiary)",
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                >
                  {c.label}
                </button>
              ) : null
            ))}
          </div>
        )}

        {/* Empty state */}
        {crew.length === 0 && !showAddForm && (
          <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <p style={{ fontSize: "15px", color: "var(--color-text-tertiary)", marginBottom: "8px" }}>
              No crew members yet.
            </p>
            <p style={{ fontSize: "13px", color: "var(--color-text-minimum)", marginBottom: "24px", lineHeight: "1.6", maxWidth: "360px", margin: "0 auto 24px" }}>
              Add the people who matter to this transition — people you need to meet, people who were referred to you, mentors, cross-functional partners.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-secondary"
            >
              Add your first crew member
            </button>
          </div>
        )}

        {/* Crew list */}
        {filtered.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filtered.map((member) => {
              const ctx = getContextStyle(member.context);
              const sts = getStatusStyle(member.status);
              const isExpanded = expandedId === member.id;

              return (
                <div
                  key={member.id}
                  className="card"
                  style={{ padding: "14px 16px", transition: "all 0.2s" }}
                >
                  {/* Main row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {/* Status dot — click to cycle */}
                    <button
                      onClick={() => handleStatusCycle(member)}
                      title={`Status: ${sts.label}. Click to change.`}
                      style={{
                        width: "10px", height: "10px", borderRadius: "50%",
                        background: sts.color, border: "none", cursor: "pointer",
                        flexShrink: 0, padding: 0, transition: "transform 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.4)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    />

                    {/* Name + role */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>
                          {member.name}
                        </span>
                        {member.role && (
                          <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
                            {member.role}
                          </span>
                        )}
                        {member.context && (
                          <span style={{
                            fontSize: "10px", fontFamily: "var(--font-mono)",
                            color: ctx.color, background: `${ctx.color}18`,
                            padding: "1px 6px", borderRadius: "10px",
                          }}>
                            {ctx.label}
                          </span>
                        )}
                      </div>
                      {member.referred_by && (
                        <div style={{ fontSize: "11px", color: "var(--color-text-minimum)", marginTop: "2px" }}>
                          via {member.referred_by}
                        </div>
                      )}
                    </div>

                    {/* Status label + expand */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                      <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: sts.color }}>
                        {sts.label}
                      </span>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : member.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-minimum)", padding: "2px", display: "flex" }}
                      >
                        <svg
                          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round"
                          style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                        >
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--color-border-subtle)" }}>
                      {member.notes && (
                        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: "1.6", marginBottom: "12px", whiteSpace: "pre-wrap" }}>
                          {member.notes}
                        </p>
                      )}
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => startEdit(member)}
                          style={{ fontSize: "12px", color: "var(--color-teal)", background: "none", border: "1px solid rgba(14,178,205,0.3)", borderRadius: "var(--radius)", padding: "5px 12px", cursor: "pointer" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          style={{ fontSize: "12px", color: "var(--color-text-minimum)", background: "none", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius)", padding: "5px 12px", cursor: "pointer" }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && crew.length > 0 && (
          <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)", textAlign: "center", padding: "2rem" }}>
            No crew members match this filter.
          </p>
        )}

      </div>
    </div>
  );
}
