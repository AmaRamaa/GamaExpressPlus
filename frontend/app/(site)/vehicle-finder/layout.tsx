import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Vehicle Finder",
  description:
    "Find exterior auto parts compatible with your car by selecting its make, model, and generation.",
  alternates: {
    canonical: `${SITE_URL}/vehicle-finder`,
  },
};

export default function VehicleFinderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
