"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FileText, Search, MoreVertical, Pencil, Archive } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { MatterStatusBadge } from "./matter-status-badge";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MatterCardProps {
  matter: {
    id: string;
    title: string;
    clientName: string | null;
    status: "ACTIVE" | "CLOSED" | "ON_HOLD" | "ARCHIVED";
    areaOfLaw: string;
    updatedAt: Date | string;
    _count: { documents: number; researchSessions: number };
  };
  onEdit?: (id: string) => void;
  onArchive?: (id: string) => void;
}

export function MatterCard({ matter, onEdit, onArchive }: MatterCardProps) {
  const t = useTranslations("asuntos");

  return (
    <div className="group relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Actions dropdown */}
      <div className="absolute right-3 top-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-700">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(matter.id)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            )}
            {onArchive && matter.status !== "ARCHIVED" && (
              <DropdownMenuItem
                onClick={() => onArchive(matter.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Archive className="mr-2 h-4 w-4" />
                Archivar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Link href={`/app/asuntos/${matter.id}`} className="block">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="truncate font-semibold text-gray-900 text-sm leading-snug">
              {matter.title}
            </h3>
            {matter.clientName && (
              <p className="mt-0.5 truncate text-xs text-gray-500">{matter.clientName}</p>
            )}
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          <MatterStatusBadge status={matter.status} />
          <Badge variant="navy" className="text-[10px]">
            {matter.areaOfLaw.replace(/_/g, " ")}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {matter._count.documents} {t("documents")}
            </span>
            <span className="flex items-center gap-1">
              <Search className="h-3.5 w-3.5" />
              {matter._count.researchSessions} {t("sessions")}
            </span>
          </div>
          <span>
            {formatDistanceToNow(new Date(matter.updatedAt), {
              addSuffix: true,
              locale: es,
            })}
          </span>
        </div>
      </Link>
    </div>
  );
}
