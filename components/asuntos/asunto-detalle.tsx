"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const AREAS = [
  "CIVIL", "PENAL", "MERCANTIL", "LABORAL", "FISCAL", "ADMINISTRATIVO",
  "CONSTITUCIONAL", "FAMILIAR", "AGRARIO", "AMBIENTAL", "PROPIEDAD_INTELECTUAL",
  "COMERCIO_EXTERIOR", "CORPORATIVO", "INMOBILIARIO", "MIGRATORIO", "NOTARIAL", "OTHER",
] as const;

const STATUSES = ["ACTIVE", "CLOSED", "ON_HOLD", "ARCHIVED"] as const;

export function AsuntoDetalle({ matter }: AsuntoDetalleProps) {
  const t = useTranslations("asuntos");
  const tc = useTranslations("common");
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultTab = searchParams.get("tab") ?? "documents";
  const isEditing = searchParams.get("edit") === "true";
  const [formData, setFormData] = useState({
    title: matter.title,
    clientName: matter.clientName ?? "",
    clientRfc: matter.clientRfc ?? "",
    areaOfLaw: matter.areaOfLaw,
    jurisdiction: matter.jurisdiction ?? "",
    description: matter.description ?? "",
    status: matter.status,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const closeEdit = () => {
    router.push(`/app/asuntos/${matter.id}?tab=${defaultTab}`);
    router.refresh();
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    const res = await fetch(`/api/asuntos/${matter.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.title,
        clientName: formData.clientName || null,
        clientRfc: formData.clientRfc || null,
        areaOfLaw: formData.areaOfLaw,
        jurisdiction: formData.jurisdiction || null,
        description: formData.description || null,
        status: formData.status,
      }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      setError(json?.error?.message ?? "Error al actualizar el asunto");
      setIsSaving(false);
      return;
    }

    router.push(`/app/asuntos/${matter.id}?tab=${defaultTab}`);
    router.refresh();
  };

  if (isEditing) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="mb-4">
          <Link
            href={`/app/asuntos/${matter.id}?tab=${defaultTab}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("title")}
          </Link>
        </div>

        <div className="mx-auto max-w-2xl">
          <div className="mb-6">
            <h1 className="font-serif text-2xl text-gray-900">{t("form.editTitle")}</h1>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="title">{t("form.title")} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder={t("form.titlePlaceholder")}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clientName">{t("form.client")}</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData((prev) => ({ ...prev, clientName: e.target.value }))}
                placeholder={t("form.clientPlaceholder")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clientRfc">{t("form.clientRfc")}</Label>
              <Input
                id="clientRfc"
                value={formData.clientRfc}
                onChange={(e) => setFormData((prev) => ({ ...prev, clientRfc: e.target.value }))}
                placeholder={t("form.clientRfcPlaceholder")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("form.area")} *</Label>
                <Select
                  value={formData.areaOfLaw}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, areaOfLaw: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>{t("form.status")}</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value as Matter["status"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`status.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jurisdiction">{t("form.jurisdiction")}</Label>
              <Input
                id="jurisdiction"
                value={formData.jurisdiction}
                onChange={(e) => setFormData((prev) => ({ ...prev, jurisdiction: e.target.value }))}
                placeholder="Ej. CDMX, Federal, Jalisco..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">{t("form.description")}</Label>
              <Textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder={t("form.descriptionPlaceholder")}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSaving || !formData.title.trim()}>
                {isSaving ? t("form.submitting") : t("form.editSubmit")}
              </Button>
              <Button type="button" variant="outline" onClick={closeEdit} disabled={isSaving}>
                {tc("cancel")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
