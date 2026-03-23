"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { DocumentFilters } from "./document-filters";
import { DocumentList } from "./document-list";
import { DocumentHub } from "./document-hub";

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
  totalCount: number;
}

export function DocumentosShell({ initialDocuments, matters, totalCount }: DocumentosShellProps) {
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
    <div className="h-full overflow-y-auto bg-gray-50/30">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="font-serif text-2xl text-gray-900">{t("title")}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Crea, sube y gestiona tus documentos legales
          </p>
        </div>

        {/* Hub: drop zone + action cards + section header */}
        <DocumentHub totalCount={totalCount} />

        {/* Filters */}
        <div className="mb-4">
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

        {/* Document list */}
        <DocumentList documents={documents} loading={loading} />
      </div>
    </div>
  );
}
