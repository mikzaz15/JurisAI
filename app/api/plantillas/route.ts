import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED" } },
      { status: 401 }
    );
  }

  const templates = await prisma.template.findMany({
    where: {
      OR: [
        { isSystem: true },
        { orgId: session.user.orgId },
      ],
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      areaOfLaw: true,
      variables: true,
      content: true,
      isSystem: true,
      orgId: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, data: { templates } });
}
