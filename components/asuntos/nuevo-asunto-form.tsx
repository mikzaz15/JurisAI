"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
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

type FormData = {
  title: string;
  clientName: string;
  clientRfc: string;
  areaOfLaw: string;
  jurisdiction: string;
  description: string;
  status: string;
};

const AREAS = [
  "CIVIL", "PENAL", "MERCANTIL", "LABORAL", "FISCAL", "ADMINISTRATIVO",
  "CONSTITUCIONAL", "FAMILIAR", "AGRARIO", "AMBIENTAL", "PROPIEDAD_INTELECTUAL",
  "COMERCIO_EXTERIOR", "CORPORATIVO", "INMOBILIARIO", "MIGRATORIO", "NOTARIAL", "OTHER",
] as const;

const STATUSES = ["ACTIVE", "CLOSED", "ON_HOLD", "ARCHIVED"] as const;

export function NuevoAsuntoForm() {
  const router = useRouter();
  const t = useTranslations("asuntos");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<FormData>({
    defaultValues: { status: "ACTIVE", areaOfLaw: "CIVIL" },
  });

  const areaOfLaw = watch("areaOfLaw");
  const status = watch("status");

  const onSubmit = async (data: FormData) => {
    setError(null);
    const res = await fetch("/api/asuntos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.title,
        clientName: data.clientName || undefined,
        clientRfc: data.clientRfc || undefined,
        areaOfLaw: data.areaOfLaw,
        jurisdiction: data.jurisdiction || undefined,
        description: data.description || undefined,
        status: data.status,
      }),
    });
    const json = await res.json();
    if (json.success) {
      router.push(`/app/asuntos/${json.data.matter.id}`);
    } else {
      setError(json.error?.message ?? "Error al crear el asunto");
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-gray-900">{t("form.newTitle")}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title">{t("form.title")} *</Label>
          <Input
            id="title"
            placeholder={t("form.titlePlaceholder")}
            {...register("title", { required: true })}
            className={errors.title ? "border-red-500" : ""}
          />
        </div>

        {/* Client name */}
        <div className="space-y-1.5">
          <Label htmlFor="clientName">{t("form.client")}</Label>
          <Input
            id="clientName"
            placeholder={t("form.clientPlaceholder")}
            {...register("clientName")}
          />
        </div>

        {/* RFC */}
        <div className="space-y-1.5">
          <Label htmlFor="clientRfc">{t("form.clientRfc")}</Label>
          <Input
            id="clientRfc"
            placeholder={t("form.clientRfcPlaceholder")}
            {...register("clientRfc")}
          />
        </div>

        {/* Area & Status row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t("form.area")} *</Label>
            <Select value={areaOfLaw} onValueChange={(v) => setValue("areaOfLaw", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AREAS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("form.status")}</Label>
            <Select value={status} onValueChange={(v) => setValue("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`status.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Jurisdiction */}
        <div className="space-y-1.5">
          <Label htmlFor="jurisdiction">{t("form.jurisdiction")}</Label>
          <Input
            id="jurisdiction"
            placeholder="Ej. CDMX, Federal, Jalisco..."
            {...register("jurisdiction")}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description">{t("form.description")}</Label>
          <Textarea
            id="description"
            placeholder={t("form.descriptionPlaceholder")}
            rows={3}
            {...register("description")}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("form.submitting") : t("form.submit")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
