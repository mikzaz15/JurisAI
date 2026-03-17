import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AsuntosShell } from "@/components/asuntos/asuntos-shell";

export default async function AsuntosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const matters = await prisma.matter.findMany({
    where: { orgId: session.user.orgId },
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: {
      _count: { select: { documents: true, researchSessions: true } },
    },
  });

  return <AsuntosShell initialMatters={matters} />;
}
