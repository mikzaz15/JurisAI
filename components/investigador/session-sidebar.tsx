"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { groupByDate } from "@/lib/citation-parser";
import {
  Plus,
  Search,
  Trash2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface SessionSummary {
  id: string;
  title: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  messages: { content: string }[];
  _count: { messages: number };
}

interface SessionSidebarProps {
  sessions: SessionSummary[];
  activeSessionId?: string;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function SessionSidebar({
  sessions,
  activeSessionId,
  onNewSession,
  onDeleteSession,
  mobileOpen = false,
  onMobileClose,
}: SessionSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const filtered = sessions.filter((s) => {
    if (!search) return true;
    const title = s.title ?? s.messages[0]?.content ?? "";
    return title.toLowerCase().includes(search.toLowerCase());
  });

  const grouped = groupByDate(filtered);

  const handleDelete = useCallback(
    async (e: React.MouseEvent, sessionId: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (!confirm("¿Eliminar esta sesión?")) return;
      onDeleteSession(sessionId);
      if (activeSessionId === sessionId) {
        router.push("/app/investigador");
      }
    },
    [activeSessionId, onDeleteSession, router]
  );

  if (collapsed) {
    return (
      // Collapsed state: only visible on desktop
      <div className="hidden md:flex w-12 flex-col items-center border-r border-white/10 bg-[#0C1B2A] py-4">
        <button
          onClick={() => setCollapsed(false)}
          className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
          title="Expandir historial"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={onNewSession}
          className="mt-3 rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
          title="Nueva consulta"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    // On mobile: fixed overlay (z-50) shown only when mobileOpen; on desktop: always shown inline
    <div
      className={cn(
        "flex w-72 shrink-0 flex-col border-r border-white/10 bg-[#0C1B2A]",
        // Mobile: overlay behavior
        "fixed inset-y-0 left-0 z-50 md:relative md:z-auto md:flex",
        mobileOpen ? "flex" : "hidden md:flex"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">Investigador</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewSession}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-[#C9A84C] text-[#0C1B2A] hover:bg-[#b8943d] transition-colors"
            title="Nueva consulta"
          >
            <Plus className="h-4 w-4" />
          </button>
          {/* Close on mobile */}
          <button
            onClick={onMobileClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 hover:bg-white/10 hover:text-white md:hidden"
            title="Cerrar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {/* Collapse on desktop */}
          <button
            onClick={() => setCollapsed(true)}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-md text-white/40 hover:bg-white/10 hover:text-white"
            title="Colapsar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar sesiones..."
            className="flex-1 bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none"
          />
        </div>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {filtered.length === 0 ? (
          <div className="py-8 text-center">
            <MessageSquare className="mx-auto mb-2 h-8 w-8 text-white/20" />
            <p className="text-xs text-white/40">
              {search ? "Sin resultados" : "Sin sesiones aún"}
            </p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                {group.label}
              </p>
              {group.items.map((s) => (
                <SessionItem
                  key={s.id}
                  session={s}
                  isActive={s.id === activeSessionId}
                  onDelete={(e) => handleDelete(e, s.id)}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SessionItem({
  session,
  isActive,
  onDelete,
}: {
  session: SessionSummary;
  isActive: boolean;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const title =
    session.title ?? session.messages[0]?.content?.slice(0, 60) ?? "Nueva sesión";

  return (
    <Link
      href={`/app/investigador/${session.id}`}
      className={cn(
        "group flex items-start gap-2 rounded-lg px-2 py-2 transition-colors",
        isActive
          ? "bg-[#C9A84C]/15 text-[#C9A84C]"
          : "text-white/60 hover:bg-white/5 hover:text-white"
      )}
    >
      <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="truncate text-xs leading-snug">{title}</p>
        <p className="mt-0.5 text-[10px] opacity-50">
          {session._count.messages} mensajes
        </p>
      </div>
      <button
        onClick={onDelete}
        className="ml-1 shrink-0 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
        title="Eliminar sesión"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </Link>
  );
}
