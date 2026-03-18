"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SessionSidebar, type SessionSummary } from "./session-sidebar";
import type { ChatMessageData } from "./chat-message";
import { ChatArea } from "./chat-area";
import { PanelLeft } from "lucide-react";

interface InvestigadorShellProps {
  sessions: SessionSummary[];
  activeSessionId?: string;
  initialMessages?: ChatMessageData[];
}

export function InvestigadorShell({
  sessions: initialSessions,
  activeSessionId,
  initialMessages = [],
}: InvestigadorShellProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleNewSession = useCallback(async () => {
    setMobileSidebarOpen(false);
    const res = await fetch("/api/investigador/sesiones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await res.json();
    if (json.success) {
      router.push(`/app/investigador/${json.data.id}`);
      router.refresh();
    }
  }, [router]);

  const handleDeleteSession = useCallback(
    async (id: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      await fetch(`/api/investigador/sesiones/${id}`, { method: "DELETE" });
      router.refresh();
    },
    [router]
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#09131D]">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <SessionSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {activeSessionId ? (
        <ChatArea
          sessionId={activeSessionId}
          initialMessages={initialMessages}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />
      ) : (
        <NoSessionState
          onNew={handleNewSession}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />
      )}
    </div>
  );
}

function NoSessionState({
  onNew,
  onOpenMobileSidebar,
}: {
  onNew: () => void;
  onOpenMobileSidebar: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Mobile header */}
      <div className="flex items-center border-b border-white/10 bg-[#0C1B2A] px-4 py-3 md:hidden">
        <button
          onClick={onOpenMobileSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Abrir historial"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.14),transparent_26%),linear-gradient(180deg,#102032_0%,#0B1520_55%,#09131D_100%)] px-6 py-10 md:px-10 md:py-14">
        <div className="m-auto w-full max-w-4xl">
          <div className="mx-auto max-w-2xl rounded-[28px] border border-white/10 bg-white/[0.04] px-8 py-10 text-center shadow-[0_32px_90px_rgba(0,0,0,0.35)] backdrop-blur-sm md:px-12 md:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#C9A84C]/80">
              Espacio de investigación legal
            </p>
            <h2 className="mt-5 font-serif text-4xl text-white md:text-5xl">
              Investigador
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-300 md:text-base">
              Inicia una nueva consulta o elige una sesión previa desde el historial para seguir
              trabajando con tu investigación legal citada.
            </p>
            <div className="mt-8 flex justify-center">
              <button
                onClick={onNew}
                className="rounded-xl bg-[#C9A84C] px-6 py-3 text-sm font-semibold text-[#0C1B2A] transition-colors hover:bg-[#b8943d]"
              >
                Nueva consulta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
