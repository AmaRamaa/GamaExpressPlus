"use client";

import { useParams } from "next/navigation";
import { EntityDetailPage } from "@/components/admin/EntityDetailPage";

export default function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <EntityDetailPage apiPath="/catalog/categories" id={id} entityLabel="category" filterParam="categoryId" backLink="/admin/categories" />;
}
