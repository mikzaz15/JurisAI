"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

type DocumentStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "FINAL" | "ARCHIVED";

const statusVariant: Record<DocumentStatus, "default" | "warning" | "success" | "primary" | "outline"> = {
  DRAFT: "default",
  IN_REVIEW: "warning",
  APPROVED: "success",
  FINAL: "primary",
  ARCHIVED: "outline",
};

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
}

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  const t = useTranslations("documentos.statuses");
  const label = t(status as Parameters<typeof t>[0]);
  return <Badge variant={statusVariant[status] ?? "default"}>{label}</Badge>;
}
