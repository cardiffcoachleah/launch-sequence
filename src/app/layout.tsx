import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Launch Sequence — Your first 90 days, planned before day one",
  description:
    "An AI-powered transition companion for leaders stepping into new roles. Personalized plans, wellbeing check-ins, and structured feedback from T-10 to stable orbit.",
  openGraph: {
    title: "Launch Sequence",
    description:
      "Your first 90 days, planned before day one. For leaders in transition.",
    type: "website",
    url: "https://launchsequence.io",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:ital,wght@0,300..600;1,300..600&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
