"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

type MatterStatus = "ACTIVE" | "CLOSED" | "ON_HOLD" | "ARCHIVED";

const statusVariant: Record<MatterStatus, "success" | "default" | "warning" | "outline"> = {
  ACTIVE: "success",
  CLOSED: "default",
  ON_HOLD: "warning",
  ARCHIVED: "outline",
};

interface MatterStatusBadgeProps {
  status: MatterStatus;
}

export function MatterStatusBadge({ status }: MatterStatusBadgeProps) {
  const t = useTranslations("asuntos.status");
  return (
    <Badge variant={statusVariant[status]}>
      {t(status)}
    </Badge>
  );
}
