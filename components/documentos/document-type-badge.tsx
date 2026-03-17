"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

type DocumentType =
  | "CONTRACT" | "AMPARO_PETITION" | "CORPORATE_DEED" | "POWER_OF_ATTORNEY"
  | "LEGAL_OPINION" | "MEMO" | "COMPLAINT" | "MOTION" | "REGULATORY_FILING"
  | "NDA" | "EMPLOYMENT" | "LEASE" | "GENERAL";

const typeVariant: Record<DocumentType, "primary" | "navy" | "default" | "success" | "warning"> = {
  CONTRACT: "primary",
  LEASE: "primary",
  EMPLOYMENT: "primary",
  NDA: "warning",
  AMPARO_PETITION: "navy",
  COMPLAINT: "navy",
  MOTION: "navy",
  CORPORATE_DEED: "success",
  POWER_OF_ATTORNEY: "success",
  LEGAL_OPINION: "default",
  MEMO: "default",
  REGULATORY_FILING: "default",
  GENERAL: "default",
};

interface DocumentTypeBadgeProps {
  type: DocumentType;
}

export function DocumentTypeBadge({ type }: DocumentTypeBadgeProps) {
  const t = useTranslations("documentos.types");
  const label = t(type as Parameters<typeof t>[0]);
  return <Badge variant={typeVariant[type] ?? "default"}>{label}</Badge>;
}
