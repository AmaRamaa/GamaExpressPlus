"use client";

import { useParams } from "next/navigation";
import { EntityDetailPage } from "@/components/admin/EntityDetailPage";

export default function BrandDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <EntityDetailPage apiPath="/catalog/brands" id={id} entityLabel="brand" filterParam="brandId" backLink="/admin/brands" />;
}
