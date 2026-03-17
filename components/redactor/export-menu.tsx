"use client";

import { useTranslations } from "next-intl";
import { Download, Printer, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ExportMenuProps {
  documentId: string;
}

export function ExportMenu({ documentId }: ExportMenuProps) {
  const t = useTranslations("redactor");

  const handleDocx = () => {
    window.location.href = `/api/documentos/${documentId}/exportar/docx`;
  };

  const handlePdf = () => {
    window.print();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {t("export")}
          <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDocx}>
          <Download className="mr-2 h-4 w-4" />
          {t("exportDocx")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePdf}>
          <Printer className="mr-2 h-4 w-4" />
          {t("exportPdf")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
