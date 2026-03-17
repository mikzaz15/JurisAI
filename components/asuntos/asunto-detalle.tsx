"use client";

import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatterStatusBadge } from "./matter-status-badge";
import { Badge } from "@/components/ui/badge";
import { AsuntoDocumentosTab } from "./asunto-documentos-tab";
import { AsuntoInvestigacionTab } from "./asunto-investigacion-tab";
import { AsuntoNotas } from "./asunto-notas";

interface Document {
  id: string;
  title: string;
  type: string;
  status: string;
  updatedAt: Date | string;
}

interface ResearchSession {
  id: string;
  title: string | null;
  updatedAt: Date | string;
  _count: { messages: number };
  messages: { content: string }[];
}

interface Note {
  id: string;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface Matter {
  id: string;
  title: string;
  clientName: string | null;
  clientRfc: string | null;
  description: string | null;
  status: "ACTIVE" | "CLOSED" | "ON_HOLD" | "ARCHIVED";
  areaOfLaw: string;
  jurisdiction: string | null;
  documents: Document[];
  researchSessions: ResearchSession[];
  notes: Note[];
}

interface AsuntoDetalleProps {
  matter: Matter;
}

export function AsuntoDetalle({ matter }: AsuntoDetalleProps) {
  const t = useTranslations("asuntos");
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") ?? "documents";

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Back link */}
      <div className="mb-4">
        <Link
          href="/app/asuntos"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("title")}
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <MatterStatusBadge status={matter.status} />
            <Badge variant="navy" className="text-[10px]">
              {matter.areaOfLaw.replace(/_/g, " ")}
            </Badge>
            {matter.jurisdiction && (
              <Badge variant="outline" className="text-[10px]">
                {matter.jurisdiction}
              </Badge>
            )}
          </div>
          <h1 className="font-serif text-2xl text-gray-900">{matter.title}</h1>
          {matter.clientName && (
            <p className="mt-1 text-sm text-gray-500">
              {matter.clientName}
              {matter.clientRfc && (
                <span className="ml-2 text-gray-400">RFC: {matter.clientRfc}</span>
              )}
            </p>
          )}
          {matter.description && (
            <p className="mt-2 text-sm text-gray-600">{matter.description}</p>
          )}
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href={`/app/asuntos/${matter.id}?tab=documents&edit=true`}>
            <Pencil className="mr-1.5 h-4 w-4" />
            {t("form.editTitle")}
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="documents">
            {t("tabs.documents")} ({matter.documents.length})
          </TabsTrigger>
          <TabsTrigger value="research">
            {t("tabs.research")} ({matter.researchSessions.length})
          </TabsTrigger>
          <TabsTrigger value="notes">
            {t("tabs.notes")} ({matter.notes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-4">
          <AsuntoDocumentosTab
            matterId={matter.id}
            documents={matter.documents}
          />
        </TabsContent>

        <TabsContent value="research" className="mt-4">
          <AsuntoInvestigacionTab
            matterId={matter.id}
            sessions={matter.researchSessions}
          />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <AsuntoNotas
            matterId={matter.id}
            initialNotes={matter.notes}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
