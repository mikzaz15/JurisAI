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

const DOC_TYPES = [
  "CONTRACT", "AMPARO_PETITION", "CORPORATE_DEED", "POWER_OF_ATTORNEY",
  "LEGAL_OPINION", "MEMO", "COMPLAINT", "MOTION", "REGULATORY_FILING",
  "NDA", "EMPLOYMENT", "LEASE", "GENERAL",
] as const;

const DOC_STATUSES = ["DRAFT", "IN_REVIEW", "APPROVED", "FINAL", "ARCHIVED"] as const;

interface Matter {
  id: string;
  title: string;
}

interface DocumentFiltersProps {
  search: string;
  type: string;
  status: string;
  matterId: string;
  matters: Matter[];
  onSearchChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onMatterChange: (v: string) => void;
}

export function DocumentFilters({
  search, type, status, matterId, matters,
  onSearchChange, onTypeChange, onStatusChange, onMatterChange,
}: DocumentFiltersProps) {
  const t = useTranslations("documentos");

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

      <Select value={type} onValueChange={onTypeChange}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder={t("allTypes")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t("allTypes")}</SelectItem>
          {DOC_TYPES.map((dt) => (
            <SelectItem key={dt} value={dt}>
              {t(`types.${dt}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder={t("allStatuses")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
          {DOC_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {t(`statuses.${s}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {matters.length > 0 && (
        <Select value={matterId} onValueChange={onMatterChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("allMatters")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("allMatters")}</SelectItem>
            {matters.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
