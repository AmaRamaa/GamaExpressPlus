import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Returns & Exchanges",
  description:
    "Our policy for returning or exchanging auto parts purchased from Gama Express.",
  alternates: {
    canonical: `${SITE_URL}/returns`,
  },
};

export default function ReturnsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
