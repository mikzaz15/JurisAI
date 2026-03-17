"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentFilters } from "./document-filters";
import { DocumentList } from "./document-list";

interface Document {
  id: string;
  title: string;
  type: string;
  status: string;
  updatedAt: Date | string;
  matter: { id: string; title: string } | null;
}

interface Matter {
  id: string;
  title: string;
}

interface DocumentosShellProps {
  initialDocuments: Document[];
  matters: Matter[];
}

export function DocumentosShell({ initialDocuments, matters }: DocumentosShellProps) {
  const t = useTranslations("documentos");
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [matterId, setMatterId] = useState("ALL");

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (type !== "ALL") params.set("type", type);
    if (status !== "ALL") params.set("status", status);
    if (matterId !== "ALL") params.set("matterId", matterId);

    const res = await fetch(`/api/documentos?${params.toString()}`);
    const json = await res.json();
    if (json.success) setDocuments(json.data.documents);
    setLoading(false);
  }, [search, type, status, matterId]);

  useEffect(() => {
    const timer = setTimeout(fetchDocuments, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchDocuments, search]);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-gray-900">{t("title")}</h1>
        <Button asChild>
          <Link href="/app/documentos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            {t("newDocument")}
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <DocumentFilters
          search={search}
          type={type}
          status={status}
          matterId={matterId}
          matters={matters}
          onSearchChange={setSearch}
          onTypeChange={setType}
          onStatusChange={setStatus}
          onMatterChange={setMatterId}
        />
      </div>

      <DocumentList documents={documents} loading={loading} />
    </div>
  );
}
