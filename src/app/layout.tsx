import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AptiCore — AI Bias Detection & Fair Hiring Platform",
  description:
    "Reveal, remove, and prove bias reduction in hiring. AptiCore anonymizes resumes, scores candidates on pure merit, and delivers transparent, explainable decisions.",
  keywords: [
    "AI hiring",
    "bias detection",
    "fair hiring",
    "resume screening",
    "anonymization",
    "explainable AI",
    "DEI",
    "Google Solution Challenge",
  ],
  openGraph: {
    title: "AptiCore — AI Bias Detection & Fair Hiring Platform",
    description:
      "Reveal, remove, and prove bias reduction in hiring with transparent AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${dmSans.variable} antialiased`}
    >
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
