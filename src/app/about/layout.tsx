import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — AptiCore",
  description:
    "Learn why AptiCore exists: AI-powered bias detection that makes hiring decisions transparent, explainable, and provably fair.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
