"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SessionSidebar, type SessionSummary } from "./session-sidebar";
import type { ChatMessageData } from "./chat-message";
import { ChatArea } from "./chat-area";

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

  const handleNewSession = useCallback(async () => {
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
    <div className="flex h-full">
      <SessionSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
      />

      {activeSessionId ? (
        <ChatArea
          sessionId={activeSessionId}
          initialMessages={initialMessages}
        />
      ) : (
        <NoSessionState onNew={handleNewSession} />
      )}
    </div>
  );
}

function NoSessionState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="font-serif text-2xl text-gray-900">Investigador</h2>
        <p className="mt-2 text-sm text-gray-500">
          Selecciona una sesión o inicia una nueva consulta
        </p>
        <button
          onClick={onNew}
          className="mt-4 rounded-lg bg-[#C9A84C] px-5 py-2 text-sm font-semibold text-[#0C1B2A] hover:bg-[#b8943d] transition-colors"
        >
          Nueva consulta
        </button>
      </div>
    </div>
  );
}
