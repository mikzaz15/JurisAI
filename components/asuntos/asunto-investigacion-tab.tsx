"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MessageSquare, Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ResearchSession {
  id: string;
  title: string | null;
  updatedAt: Date | string;
  _count: { messages: number };
  messages: { content: string }[];
}

interface AsuntoInvestigacionTabProps {
  matterId: string;
  sessions: ResearchSession[];
}

export function AsuntoInvestigacionTab({ matterId, sessions }: AsuntoInvestigacionTabProps) {
  const t = useTranslations("asuntos");
  const router = useRouter();
  const pendingTitle = "Investigación pendiente";

  const handleNewSession = async () => {
    const res = await fetch("/api/investigador/sesiones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matterId, title: pendingTitle }),
    });
    const json = await res.json();
    if (json.success) {
      router.push(`/app/investigador/${json.data.id}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={handleNewSession}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t("newResearchSession")}
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">{t("noSessions")}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden">
          {sessions.map((s) => {
            const title = s.title ?? s.messages[0]?.content?.slice(0, 60) ?? pendingTitle;
            return (
              <Link
                key={s.id}
                href={`/app/investigador/${s.id}`}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
              >
                <MessageSquare className="h-5 w-5 shrink-0 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{title}</p>
                  <p className="text-xs text-gray-400">
                    {s._count.messages} mensajes ·{" "}
                    {formatDistanceToNow(new Date(s.updatedAt), { addSuffix: true, locale: es })}
                  </p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
