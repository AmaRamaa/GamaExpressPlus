import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Auto parts tips, fitment guidance, and company updates from Gama Express, a Kosovo retailer specializing in exterior auto parts.",
  alternates: { canonical: `${SITE_URL}/blog` },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
