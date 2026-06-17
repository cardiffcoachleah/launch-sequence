"use client";

import Link from "next/link";

export default function Nav() {
  return (
    <nav className="flex items-center justify-between px-8 py-5 border-b border-[var(--color-border)]">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="instrument text-[11px] tracking-[0.12em] text-[var(--color-teal)] border border-[rgba(14,178,205,0.4)] px-2 py-1 rounded-[var(--radius)]">
          LS
        </span>
        <span className="text-sm font-medium text-[var(--color-white-95)]">
          Launch Sequence
        </span>
      </Link>
      <div className="flex items-center gap-6">
        <Link
          href="/briefing"
          className="btn-primary text-sm"
        >
          Start your mission
        </Link>
      </div>
    </nav>
  );
}
