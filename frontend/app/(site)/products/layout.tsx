import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Shop All Auto Parts",
  description:
    "Browse and filter exterior auto parts by category or vehicle, including bumpers, body panels, lighting, mirrors, glass, and trim, available in Kosovo.",
  alternates: {
    canonical: `${SITE_URL}/products`,
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
