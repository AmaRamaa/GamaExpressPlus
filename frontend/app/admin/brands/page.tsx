"use client";

import { EntityManagerPage } from "@/components/admin/EntityManagerPage";

export default function AdminBrandsPage() {
  return <EntityManagerPage title="Brands" apiPath="/catalog/brands" entityLabel="brand" detailBasePath="/admin/brands" showOEM />;
}
