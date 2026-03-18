import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InvestigadorShell } from "@/components/investigador/investigador-shell";
import type { ChatMessageData } from "@/components/investigador/chat-message";
import type { Metadata } from "next";

interface Props {
  params: { sessionId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const session = await prisma.researchSession.findUnique({
    where: { id: params.sessionId },
    select: { title: true },
  });
  return {
    title: session?.title
      ? `${session.title.slice(0, 50)} — Investigador`
      : "Investigador",
  };
}

export default async function SessionPage({ params }: Props) {
  const authSession = await auth();
  if (!authSession?.user) redirect("/login");

  // Load all sessions for the sidebar
  const [allSessions, researchSession] = await Promise.all([
    prisma.researchSession.findMany({
      where: { userId: authSession.user.id },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        messages: {
          where: { role: "USER" },
          take: 1,
          orderBy: { createdAt: "asc" },
          select: { content: true },
        },
        _count: { select: { messages: true } },
      },
    }),
    prisma.researchSession.findFirst({
      where: { id: params.sessionId, userId: authSession.user.id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    }),
  ]);

  if (!researchSession) notFound();

  // Map DB messages to ChatMessageData
  const initialMessages: ChatMessageData[] = researchSession.messages.map((m) => ({
    id: m.id,
    role: m.role as "USER" | "ASSISTANT",
    content: m.content,
    confidence: m.confidence
      ? m.confidence >= 0.8
        ? "ALTA"
        : m.confidence >= 0.5
        ? "MEDIA"
        : "BAJA"
      : undefined,
    citations: Array.isArray(m.citations) ? (m.citations as string[]) : undefined,
    followUp: undefined, // follow-up not persisted, generated at stream time
    createdAt: m.createdAt,
  }));

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] overflow-hidden bg-[#09131D]">
      <InvestigadorShell
        sessions={allSessions}
        activeSessionId={params.sessionId}
        initialMessages={initialMessages}
      />
    </div>
  );
}
