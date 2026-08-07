"use client";

import { useParams } from "next/navigation";
import { EntityDetailPage } from "@/components/admin/EntityDetailPage";

export default function ManufacturerDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <EntityDetailPage apiPath="/catalog/manufacturers" id={id} entityLabel="manufacturer" filterParam="manufacturerId" backLink="/admin/manufacturers" />
  );
}
