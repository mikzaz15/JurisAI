"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FileText, Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Document {
  id: string;
  title: string;
  type: string;
  status: string;
  updatedAt: Date | string;
}

interface AsuntoDocumentosTabProps {
  matterId: string;
  documents: Document[];
}

export function AsuntoDocumentosTab({ matterId, documents }: AsuntoDocumentosTabProps) {
  const t = useTranslations("asuntos");
  const td = useTranslations("documentos");

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild size="sm">
          <Link href={`/app/documentos/nuevo?matterId=${matterId}`}>
            <Plus className="mr-1.5 h-4 w-4" />
            {t("newDocumentForMatter")}
          </Link>
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">{t("noDocuments")}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              href={`/app/documentos/${doc.id}`}
              className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-5 w-5 shrink-0 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{doc.title}</p>
                <p className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true, locale: es })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {td(`types.${doc.type}` as any) ?? doc.type}
                </Badge>
                <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
