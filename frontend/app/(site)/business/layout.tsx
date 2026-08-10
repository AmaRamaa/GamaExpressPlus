import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Business & Wholesale Accounts",
  description:
    "Wholesale accounts, bulk quote requests, and invoicing for business customers of Gama Express auto parts.",
  alternates: {
    canonical: `${SITE_URL}/business`,
  },
};

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
