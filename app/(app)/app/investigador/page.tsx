import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InvestigadorShell } from "@/components/investigador/investigador-shell";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Investigador" };

export default async function InvestigadorPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sessions = await prisma.researchSession.findMany({
    where: { userId: session.user.id },
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
  });

  // If user has sessions, redirect to the most recent one
  if (sessions.length > 0) {
    redirect(`/app/investigador/${sessions[0].id}`);
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] overflow-hidden bg-[#09131D]">
      <InvestigadorShell sessions={[]} />
    </div>
  );
}
