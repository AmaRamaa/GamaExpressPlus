import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "See current job openings and what it's like to work at Gama Express, a Kosovo-based exterior auto parts retailer with locations in Fushë Kosovë/Prishtinë and Prizren.",
  alternates: { canonical: `${SITE_URL}/careers` },
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
