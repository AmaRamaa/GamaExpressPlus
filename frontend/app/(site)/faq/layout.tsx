import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "FAQ — Ordering, Fitment & Delivery",
  description:
    "Answers to common questions about ordering auto parts from Gama Express, checking fitment for your vehicle, and delivery options.",
  alternates: {
    canonical: `${SITE_URL}/faq`,
  },
};

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
