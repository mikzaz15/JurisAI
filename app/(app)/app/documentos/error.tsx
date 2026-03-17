"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DocumentosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[documentos/error]", error);
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="font-serif text-xl text-gray-900">Error en Documentos</h2>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        No se pudieron cargar los documentos. Por favor intenta de nuevo.
      </p>
      <Button onClick={reset} className="mt-6 gap-2">
        <RefreshCw className="h-4 w-4" />
        Intentar de nuevo
      </Button>
    </div>
  );
}
