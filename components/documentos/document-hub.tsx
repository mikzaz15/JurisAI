"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  Plus,
  Layout,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropZoneModal } from "./drop-zone-modal";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
};

interface DocumentHubProps {
  totalCount: number;
}

export function DocumentHub({ totalCount }: DocumentHubProps) {
  const router = useRouter();
  const [dropModalOpen, setDropModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragError, setDragError] = useState("");

  // Global drag-drop (whole hub area)
  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (accepted.length === 0) return;
      const file = accepted[0];
      setUploading(true);
      setDragError("");
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/documentos/upload", { method: "POST", body: formData });
        const json = await res.json();
        if (json.success) {
          router.push(`/app/documentos/${json.data.documentId}`);
        } else {
          setDragError(json.error?.message || "Error al subir el archivo.");
        }
      } catch {
        setDragError("Error de conexión. Intenta de nuevo.");
      } finally {
        setUploading(false);
      }
    },
    [router]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    noClick: true, // only drag — clicks handled by the modal button
  });

  return (
    <div {...getRootProps()} className="relative">
      <input {...getInputProps()} />

      {/* Global drag overlay */}
      {isDragActive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl border-2 border-dashed border-[#C9A84C] bg-[#C9A84C]/5 backdrop-blur-sm">
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-[#C9A84C]">
              <Loader2 className="h-10 w-10 animate-spin" />
              <p className="text-sm font-medium">Subiendo...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-[#C9A84C]">
              <Upload className="h-10 w-10" />
              <p className="text-sm font-semibold">Suelta el archivo para analizarlo</p>
              <p className="text-xs text-[#C9A84C]/70">PDF, DOCX o TXT · Máximo 10 MB</p>
            </div>
          )}
        </div>
      )}

      {/* Drop zone banner */}
      <div
        className={cn(
          "mb-6 rounded-2xl border-2 border-dashed p-8 text-center transition-all",
          "border-gray-200 bg-gray-50/50 hover:border-[#C9A84C]/40 hover:bg-[#C9A84C]/3"
        )}
      >
        <Upload className="mx-auto mb-3 h-8 w-8 text-gray-300" />
        <p className="text-sm font-medium text-gray-600">
          Arrastra un documento para analizarlo y mejorarlo
        </p>
        <p className="mt-1 text-xs text-gray-400">PDF, DOCX o TXT · Máximo 10 MB</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C]/10 hover:text-[#C9A84C]"
          onClick={() => setDropModalOpen(true)}
        >
          <Upload className="mr-2 h-3.5 w-3.5" />
          Seleccionar archivo
        </Button>
        {dragError && (
          <p className="mt-2 text-xs text-red-500">{dragError}</p>
        )}
      </div>

      {/* Action cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {/* Blank document */}
        <Link
          href="/app/documentos/nuevo"
          className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-[#C9A84C]/40 hover:shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0C1B2A] text-white transition-colors group-hover:bg-[#1a2f45]">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Documento en blanco</p>
            <p className="mt-0.5 text-sm text-gray-500">
              Redacta desde cero con asistencia de IA
            </p>
          </div>
        </Link>

        {/* From template */}
        <Link
          href="/app/documentos/nuevo?template=true"
          className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-[#C9A84C]/40 hover:shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#C9A84C] text-[#0C1B2A] transition-colors group-hover:bg-[#b8943c]">
            <Layout className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Crear desde plantilla</p>
            <p className="mt-0.5 text-sm text-gray-500">
              Genera un borrador con IA en segundos
            </p>
          </div>
        </Link>
      </div>

      {/* Section header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-400" />
          Documentos recientes
          {totalCount > 0 && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              {totalCount}
            </span>
          )}
        </h2>
      </div>

      <DropZoneModal open={dropModalOpen} onOpenChange={setDropModalOpen} />
    </div>
  );
}
