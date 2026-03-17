"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatterFilters } from "./matter-filters";
import { MatterList } from "./matter-list";
import { useRouter } from "next/navigation";

interface Matter {
  id: string;
  title: string;
  clientName: string | null;
  status: "ACTIVE" | "CLOSED" | "ON_HOLD" | "ARCHIVED";
  areaOfLaw: string;
  updatedAt: Date | string;
  _count: { documents: number; researchSessions: number };
}

interface AsuntosShellProps {
  initialMatters: Matter[];
}

export function AsuntosShell({ initialMatters }: AsuntosShellProps) {
  const t = useTranslations("asuntos");
  const router = useRouter();
  const [matters, setMatters] = useState<Matter[]>(initialMatters);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [areaOfLaw, setAreaOfLaw] = useState("ALL");

  const fetchMatters = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status !== "ALL") params.set("status", status);
    if (areaOfLaw !== "ALL") params.set("areaOfLaw", areaOfLaw);

    const res = await fetch(`/api/asuntos?${params.toString()}`);
    const json = await res.json();
    if (json.success) {
      setMatters(json.data.matters);
    }
    setLoading(false);
  }, [search, status, areaOfLaw]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(fetchMatters, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchMatters, search]);

  const handleArchive = useCallback(async (id: string) => {
    if (!confirm(t("confirmArchive"))) return;
    await fetch(`/api/asuntos/${id}`, { method: "DELETE" });
    setMatters((prev) => prev.filter((m) => m.id !== id));
  }, [t]);

  const handleEdit = useCallback((id: string) => {
    router.push(`/app/asuntos/${id}?edit=true`);
  }, [router]);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-gray-900">{t("title")}</h1>
        </div>
        <Button asChild>
          <Link href="/app/asuntos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            {t("newMatter")}
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <MatterFilters
          search={search}
          status={status}
          areaOfLaw={areaOfLaw}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
          onAreaOfLawChange={setAreaOfLaw}
        />
      </div>

      <MatterList
        matters={matters}
        loading={loading}
        onEdit={handleEdit}
        onArchive={handleArchive}
      />
    </div>
  );
}
