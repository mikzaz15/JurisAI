import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED" } },
      { status: 401 }
    );
  }

  const template = await prisma.template.findFirst({
    where: {
      id: params.id,
      OR: [
        { isSystem: true },
        { orgId: session.user.orgId },
      ],
    },
  });

  if (!template) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: { template } });
}
