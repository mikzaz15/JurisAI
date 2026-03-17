"use client";

import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MatterFiltersProps {
  search: string;
  status: string;
  areaOfLaw: string;
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onAreaOfLawChange: (v: string) => void;
}

const STATUSES = ["ACTIVE", "CLOSED", "ON_HOLD", "ARCHIVED"] as const;
const AREAS = [
  "CIVIL", "PENAL", "MERCANTIL", "LABORAL", "FISCAL", "ADMINISTRATIVO",
  "CONSTITUCIONAL", "FAMILIAR", "AGRARIO", "AMBIENTAL", "PROPIEDAD_INTELECTUAL",
  "COMERCIO_EXTERIOR", "CORPORATIVO", "INMOBILIARIO", "MIGRATORIO", "NOTARIAL", "OTHER",
] as const;

export function MatterFilters({
  search,
  status,
  areaOfLaw,
  onSearchChange,
  onStatusChange,
  onAreaOfLawChange,
}: MatterFiltersProps) {
  const t = useTranslations("asuntos");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-9"
        />
      </div>

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder={t("allStatuses")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {t(`status.${s}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={areaOfLaw} onValueChange={onAreaOfLawChange}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder={t("allAreas")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t("allAreas")}</SelectItem>
          {AREAS.map((a) => (
            <SelectItem key={a} value={a}>
              {a.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
