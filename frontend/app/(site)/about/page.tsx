import { api } from "@/lib/api";
import AboutContent from "@/components/about/AboutContent";

// See app/(site)/page.tsx for why this is forced dynamic rather than
// statically generated at build time.
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const [rawBrands, rawMakes] = await Promise.all([
    api.get<{ name: string }[]>("/catalog/brands"),
    api.get<{ name: string }[]>("/vehicles/makes"),
  ]);
  const brands = rawBrands.map((b) => b.name);
  const supportedMakes = rawMakes.map((m) => m.name);

  return <AboutContent brands={brands} supportedMakes={supportedMakes} />;
}
