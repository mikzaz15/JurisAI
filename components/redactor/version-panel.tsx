"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { X, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Version {
  id: string;
  version: number;
  changeNote: string | null;
  createdAt: string;
}

interface VersionPanelProps {
  documentId: string;
  open: boolean;
  onClose: () => void;
  onRestore: (versionId: string) => void;
}

export function VersionPanel({
  documentId,
  open,
  onClose,
  onRestore,
}: VersionPanelProps) {
  const t = useTranslations("versiones");
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/documentos/${documentId}/versiones`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setVersions(json.data.versions);
      })
      .finally(() => setLoading(false));
  }, [open, documentId]);

  if (!open) return null;

  return (
    <div className="absolute right-0 top-0 z-20 flex h-full w-72 flex-col border-l border-gray-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">{t("title")}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        )}

        {!loading && versions.length === 0 && (
          <p className="py-8 text-center text-xs text-gray-400">{t("noVersions")}</p>
        )}

        {!loading && versions.map((v, idx) => (
          <div
            key={v.id}
            className={cn(
              "mb-2 rounded-lg border p-3",
              idx === 0 ? "border-[#C9A84C]/30 bg-[#C9A84C]/5" : "border-gray-100"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900">
                  {t("version")}{v.version}
                  {idx === 0 && (
                    <span className="ml-2 text-[10px] text-[#C9A84C]">{t("current")}</span>
                  )}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  <Clock className="mr-1 inline h-3 w-3" />
                  {formatDistanceToNow(new Date(v.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
                {v.changeNote && (
                  <p className="mt-0.5 text-[11px] text-gray-500 truncate">{v.changeNote}</p>
                )}
              </div>
              {idx > 0 && (
                <button
                  onClick={() => onRestore(v.id)}
                  title={t("restore")}
                  className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-[#C9A84C]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
