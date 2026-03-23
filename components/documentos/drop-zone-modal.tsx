"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Loader2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
};

interface DropZoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type UploadState = "idle" | "uploading" | "error";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DropZoneModal({ open, onOpenChange }: DropZoneModalProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      setFile(accepted[0]);
      setUploadState("idle");
      setErrorMessage("");
    }
  }, []);

  const onDropRejected = useCallback(() => {
    setErrorMessage("Formato no soportado o archivo demasiado grande (máx. 10 MB).");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: ACCEPTED_TYPES,
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploadState("uploading");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/documentos/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        onOpenChange(false);
        router.push(`/app/documentos/${json.data.documentId}`);
      } else {
        setErrorMessage(json.error?.message || "Error al subir el archivo.");
        setUploadState("error");
      }
    } catch {
      setErrorMessage("Error de conexión. Intenta de nuevo.");
      setUploadState("error");
    }
  };

  const reset = () => {
    setFile(null);
    setUploadState("idle");
    setErrorMessage("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Subir documento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={cn(
              "relative cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all",
              isDragActive
                ? "border-[#C9A84C] bg-[#C9A84C]/5"
                : "border-gray-200 hover:border-[#C9A84C]/50 hover:bg-gray-50"
            )}
          >
            <input {...getInputProps()} />
            <Upload
              className={cn(
                "mx-auto mb-3 h-10 w-10 transition-colors",
                isDragActive ? "text-[#C9A84C]" : "text-gray-300"
              )}
            />
            {isDragActive ? (
              <p className="text-sm font-medium text-[#C9A84C]">Suelta el archivo aquí</p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700">
                  Arrastra un archivo o{" "}
                  <span className="text-[#C9A84C] underline underline-offset-2">
                    selecciona uno
                  </span>
                </p>
                <p className="mt-1 text-xs text-gray-400">PDF, DOCX o TXT · Máximo 10 MB</p>
              </>
            )}
          </div>

          {/* Selected file preview */}
          {file && (
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <FileText className="h-5 w-5 shrink-0 text-[#C9A84C]" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); reset(); }}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Error */}
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorMessage}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploadState === "uploading"}
              className="bg-[#C9A84C] hover:bg-[#b8943c] text-[#0C1B2A] font-semibold"
            >
              {uploadState === "uploading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Subir y analizar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
