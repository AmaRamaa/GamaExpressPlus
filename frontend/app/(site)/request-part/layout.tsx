import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Request a Part",
  description:
    "Can't find the part you need? Tell us your vehicle details or OEM number and Gama Express will help source it.",
  alternates: {
    canonical: `${SITE_URL}/request-part`,
  },
};

export default function RequestPartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
