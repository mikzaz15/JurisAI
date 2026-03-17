import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RedactorShell } from "@/components/redactor/redactor-shell";
import type { Metadata } from "next";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doc = await prisma.document.findUnique({
    where: { id: params.id },
    select: { title: true },
  });
  return { title: doc?.title ? `${doc.title} — Redactor` : "Redactor" };
}

export default async function DocumentEditorPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const document = await prisma.document.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      content: true,
    },
  });

  if (!document) notFound();

  return <RedactorShell document={document} />;
}
