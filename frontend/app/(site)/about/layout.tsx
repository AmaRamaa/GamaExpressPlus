import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn the story behind Gama Express Sh.p.k., a Kosovo-based retailer of exterior auto parts, and our mission to make quality bumpers, body panels, lighting, and trim easy to find.",
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
