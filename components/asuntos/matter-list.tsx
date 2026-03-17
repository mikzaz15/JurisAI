"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FolderOpen, Plus } from "lucide-react";
import { MatterCard } from "./matter-card";
import { Button } from "@/components/ui/button";

interface Matter {
  id: string;
  title: string;
  clientName: string | null;
  status: "ACTIVE" | "CLOSED" | "ON_HOLD" | "ARCHIVED";
  areaOfLaw: string;
  updatedAt: Date | string;
  _count: { documents: number; researchSessions: number };
}

interface MatterListProps {
  matters: Matter[];
  loading?: boolean;
  onEdit?: (id: string) => void;
  onArchive?: (id: string) => void;
}

export function MatterList({ matters, loading, onEdit, onArchive }: MatterListProps) {
  const t = useTranslations("asuntos");

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
          />
        ))}
      </div>
    );
  }

  if (matters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FolderOpen className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <h3 className="text-base font-semibold text-gray-900">{t("noMatters")}</h3>
        <p className="mt-1 text-sm text-gray-500">{t("noMattersDesc")}</p>
        <Button asChild className="mt-4">
          <Link href="/app/asuntos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            {t("createFirst")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {matters.map((matter) => (
        <MatterCard
          key={matter.id}
          matter={matter}
          onEdit={onEdit}
          onArchive={onArchive}
        />
      ))}
    </div>
  );
}
