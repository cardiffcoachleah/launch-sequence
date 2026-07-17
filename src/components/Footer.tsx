import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--color-border-subtle)",
      padding: "16px 2rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "20px",
      flexWrap: "wrap",
    }}>
      <Link href="/about" style={{ fontSize: "12px", color: "var(--color-text-minimum)", textDecoration: "none" }}>
        About
      </Link>
      <a href="https://leahfarmer.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "var(--color-text-minimum)", textDecoration: "none" }}>
        Leah Farmer
      </a>
      <a href="mailto:leah@leahfarmer.com" style={{ fontSize: "12px", color: "var(--color-text-minimum)", textDecoration: "none" }}>
        leah@leahfarmer.com
      </a>
    </footer>
  );
}
