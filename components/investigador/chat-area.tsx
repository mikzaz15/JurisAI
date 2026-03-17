"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChatMessage, type ChatMessageData } from "./chat-message";
import { ChatInput } from "./chat-input";
import { EmptyState } from "./empty-state";
import { JurisdictionSelector } from "./jurisdiction-selector";
import { AlertCircle, RefreshCw } from "lucide-react";

interface StreamDonePayload {
  type: "done";
  messageId: string;
  userMessageId: string;
  confidence: "ALTA" | "MEDIA" | "BAJA";
  followUp: string[];
  citations: string[];
  tokensUsed: number;
}

interface StreamErrorPayload {
  type: "error";
  message: string;
}

interface ChatAreaProps {
  sessionId: string;
  initialMessages: ChatMessageData[];
}

export function ChatArea({ sessionId, initialMessages }: ChatAreaProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessageData[]>(initialMessages);
  const [streamingMessage, setStreamingMessage] = useState<ChatMessageData | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jurisdiction, setJurisdiction] = useState("federal");
  const [areaOfLaw, setAreaOfLaw] = useState("ALL");
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom whenever messages or streaming changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage?.content]);

  const sendMessage = useCallback(
    async (query: string) => {
      if (isStreaming) return;
      setError(null);
      setIsStreaming(true);

      // Optimistically add user message
      const tempUserId = `temp-user-${Date.now()}`;
      const userMsg: ChatMessageData = {
        id: tempUserId,
        role: "USER",
        content: query,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Init streaming placeholder
      const tempAssistantId = `temp-assistant-${Date.now()}`;
      setStreamingMessage({
        id: tempAssistantId,
        role: "ASSISTANT",
        content: "",
        isStreaming: true,
      });

      abortRef.current = new AbortController();

      try {
        const response = await fetch("/api/investigador/consulta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, query, jurisdiction, areaOfLaw }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          throw new Error(
            errJson?.error?.message ?? "Error al conectar con el servidor"
          );
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            if (!part.startsWith("data: ")) continue;
            const rawJson = part.slice(6).trim();
            if (!rawJson) continue;

            let payload: { type: string } & Record<string, unknown>;
            try {
              payload = JSON.parse(rawJson);
            } catch {
              continue;
            }

            if (payload.type === "token") {
              accumulatedText += payload.text as string;
              setStreamingMessage((prev) =>
                prev ? { ...prev, content: accumulatedText } : prev
              );
            } else if (payload.type === "done") {
              const done = payload as unknown as StreamDonePayload;
              const finalMessage: ChatMessageData = {
                id: done.messageId,
                role: "ASSISTANT",
                content: accumulatedText,
                confidence: done.confidence,
                followUp: done.followUp,
                citations: done.citations,
                isStreaming: false,
              };
              setMessages((prev) => {
                // Replace temp user message with confirmed id if needed
                return [...prev, finalMessage];
              });
              setStreamingMessage(null);
              setIsStreaming(false);
              // Refresh session list in sidebar
              router.refresh();
            } else if (payload.type === "error") {
              const errPayload = payload as unknown as StreamErrorPayload;
              throw new Error(errPayload.message);
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const msg = (err as Error).message ?? "Error desconocido";
        setError(msg);
        setStreamingMessage(null);
        setIsStreaming(false);
        // Remove the optimistic user message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempUserId));
      }
    },
    [isStreaming, sessionId, jurisdiction, areaOfLaw, router]
  );

  const handleFollowUp = useCallback(
    (question: string) => sendMessage(question),
    [sendMessage]
  );

  const handleExport = useCallback(
    async (content: string) => {
      // Sprint 3: save to Documentos
      const res = await fetch("/api/documentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Investigación — ${new Date().toLocaleDateString("es-MX")}`,
          type: "GENERAL",
          content,
        }),
      });
      const json = await res.json();
      if (json.success) {
        router.push(`/app/documentos/${json.data.id}`);
      }
    },
    [router]
  );

  const allDisplayedMessages = messages;
  const isEmpty = allDisplayedMessages.length === 0 && !streamingMessage;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Top bar: jurisdiction + area of law */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0C1B2A] px-4 py-2">
        <JurisdictionSelector
          jurisdiction={jurisdiction}
          areaOfLaw={areaOfLaw}
          onJurisdictionChange={setJurisdiction}
          onAreaOfLawChange={setAreaOfLaw}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {isEmpty ? (
          <EmptyState onQuerySelect={sendMessage} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
            {allDisplayedMessages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onFollowUp={handleFollowUp}
                onExport={msg.role === "ASSISTANT" ? handleExport : undefined}
              />
            ))}

            {streamingMessage && (
              <ChatMessage
                message={streamingMessage}
                onFollowUp={handleFollowUp}
              />
            )}

            {/* Error state */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">
                    Error al procesar la consulta
                  </p>
                  <p className="mt-0.5 text-sm text-red-600">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-100"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reintentar
                </button>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        isStreaming={isStreaming}
        placeholder="Escribe tu consulta legal... (Enter para enviar)"
      />
    </div>
  );
}
