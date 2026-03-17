import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AsuntoDetalle } from "@/components/asuntos/asunto-detalle";

interface Props {
  params: { id: string };
}

export default async function AsuntoPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const matter = await prisma.matter.findFirst({
    where: { id: params.id, orgId: session.user.orgId },
    include: {
      documents: {
        where: { status: { not: "ARCHIVED" } },
        orderBy: { updatedAt: "desc" },
      },
      researchSessions: {
        orderBy: { updatedAt: "desc" },
        include: {
          _count: { select: { messages: true } },
          messages: {
            where: { role: "USER" },
            take: 1,
            orderBy: { createdAt: "asc" },
            select: { content: true },
          },
        },
      },
      notes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!matter) notFound();

  return <AsuntoDetalle matter={matter} />;
}
