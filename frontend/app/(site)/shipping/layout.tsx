import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Shipping & Pickup",
  description:
    "Delivery methods and timing for auto parts orders, plus in-store pickup at our Fushë Kosovë/Prishtinë and Prizren locations.",
  alternates: {
    canonical: `${SITE_URL}/shipping`,
  },
};

export default function ShippingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
