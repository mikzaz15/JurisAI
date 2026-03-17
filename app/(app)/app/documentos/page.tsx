import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DocumentosShell } from "@/components/documentos/documentos-shell";

export default async function DocumentosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [documents, matters] = await Promise.all([
    prisma.document.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        matter: { select: { id: true, title: true } },
      },
    }),
    prisma.matter.findMany({
      where: { orgId: session.user.orgId },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  return <DocumentosShell initialDocuments={documents} matters={matters} />;
}
