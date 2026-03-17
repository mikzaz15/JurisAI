"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentTypeBadge } from "./document-type-badge";
import { DocumentStatusBadge } from "./document-status-badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Document {
  id: string;
  title: string;
  type: string;
  status: string;
  updatedAt: Date | string;
  matter: { id: string; title: string } | null;
}

interface DocumentListProps {
  documents: Document[];
  loading?: boolean;
}

export function DocumentList({ documents, loading }: DocumentListProps) {
  const t = useTranslations("documentos");

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <h3 className="text-base font-semibold text-gray-900">{t("noDocuments")}</h3>
        <p className="mt-1 text-sm text-gray-500">{t("noDocumentsDesc")}</p>
        <Button asChild className="mt-4">
          <Link href="/app/documentos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            {t("createFirst")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {documents.map((doc) => (
        <Link
          key={doc.id}
          href={`/app/documentos/${doc.id}`}
          className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <FileText className="h-5 w-5 shrink-0 text-[#C9A84C]" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{doc.title}</p>
            <div className="mt-0.5 flex items-center gap-2">
              {doc.matter && (
                <span className="text-xs text-gray-400 truncate">
                  {doc.matter.title}
                </span>
              )}
              <span className="text-xs text-gray-400">
                {t("lastModified")}{" "}
                {formatDistanceToNow(new Date(doc.updatedAt), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DocumentTypeBadge type={doc.type as any} />
            <DocumentStatusBadge status={doc.status as any} />
          </div>
        </Link>
      ))}
    </div>
  );
}
