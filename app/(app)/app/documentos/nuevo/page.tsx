import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NuevoDocumentoWizard } from "@/components/documentos/nuevo-documento-wizard";

export default async function NuevoDocumentoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [templates, matters] = await Promise.all([
    prisma.template.findMany({
      where: {
        OR: [{ isSystem: true }, { orgId: session.user.orgId }],
      },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        areaOfLaw: true,
        isSystem: true,
        variables: true,
      },
    }),
    prisma.matter.findMany({
      where: { orgId: session.user.orgId, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    }),
  ]);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-gray-900">Nuevo documento</h1>
      </div>
      <NuevoDocumentoWizard templates={templates as any} matters={matters} />
    </div>
  );
}
