"use client";

import { EntityManagerPage } from "@/components/admin/EntityManagerPage";

export default function AdminManufacturersPage() {
  return <EntityManagerPage title="Manufacturers" apiPath="/catalog/manufacturers" entityLabel="manufacturer" detailBasePath="/admin/manufacturers" />;
}
