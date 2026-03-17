"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="flex h-screen flex-col items-center justify-center bg-[#0C1B2A] p-8 text-center text-white">
        <div className="mb-4 font-serif text-3xl">
          <span className="text-white">Juris</span>
          <span className="mx-1 inline-block h-5 w-px bg-[#C9A84C]" />
          <span className="font-light text-[#C9A84C]">AI</span>
        </div>
        <h1 className="mt-4 text-xl font-semibold text-white">Error crítico</h1>
        <p className="mt-2 max-w-sm text-sm text-white/60">
          La aplicación encontró un error inesperado. Por favor recarga la página.
        </p>
        <Button
          onClick={reset}
          className="mt-6 bg-[#C9A84C] text-[#0C1B2A] hover:bg-[#C9A84C]/90"
        >
          Recargar
        </Button>
      </body>
    </html>
  );
}
