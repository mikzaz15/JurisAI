import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  REDACTOR_SYSTEM_PROMPT,
  REDACTOR_MODEL_ID,
  REDACTOR_GENERATION_CONFIG,
} from "@/lib/redactor-prompts";
import { z } from "zod";

const completarSchema = z.object({
  templateId: z.string(),
  variables: z.record(z.string(), z.string()).default({}),
  matterId: z.string().cuid().optional().nullable(),
  title: z.string().min(1).max(300).optional(),
});

function replaceVariables(content: string, variables: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `[POR COMPLETAR]`);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED" } },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_BODY" } },
      { status: 400 }
    );
  }

  const parsed = completarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const { templateId, variables, matterId, title } = parsed.data;

  // Load template
  const template = await prisma.template.findFirst({
    where: {
      id: templateId,
      OR: [{ isSystem: true }, { orgId: session.user.orgId }],
    },
  });

  if (!template) {
    return NextResponse.json(
      { success: false, error: { code: "TEMPLATE_NOT_FOUND" } },
      { status: 404 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { success: false, error: { code: "AI_NOT_CONFIGURED" } },
      { status: 503 }
    );
  }

  // Replace variables in template content
  const contentWithVars = replaceVariables(template.content, variables);

  const documentTitle = title ?? `${template.name} — ${new Date().toLocaleDateString("es-MX")}`;

  // Call Anthropic to generate the full document
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userMessage = `Completa y perfecciona el siguiente documento legal mexicano con las variables ya insertadas. El documento debe quedar completamente redactado y listo para uso profesional. Devuelve ÚNICAMENTE el contenido del documento en formato Markdown, sin explicaciones previas:\n\n${contentWithVars}`;

  const completion = await anthropic.messages.create({
    model: REDACTOR_MODEL_ID,
    max_tokens: REDACTOR_GENERATION_CONFIG.max_tokens,
    system: REDACTOR_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const generatedContent =
    completion.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("") || contentWithVars;

  // Wrap plain markdown in a basic TipTap JSON doc
  const tiptapContent = JSON.stringify({
    type: "doc",
    content: generatedContent.split("\n\n").map((para) => ({
      type: "paragraph",
      content: para ? [{ type: "text", text: para }] : [],
    })),
  });

  // Create the document
  const document = await prisma.document.create({
    data: {
      title: documentTitle,
      type: template.category,
      status: "DRAFT",
      content: tiptapContent,
      matterId: matterId ?? null,
      userId: session.user.id,
      templateId: template.id,
      modelUsed: REDACTOR_MODEL_ID,
      prompt: userMessage.slice(0, 500),
    },
  });

  // Create initial version
  await prisma.documentVersion.create({
    data: {
      documentId: document.id,
      version: 1,
      content: tiptapContent,
      changeNote: "Generado con IA desde plantilla",
    },
  });

  return NextResponse.json(
    { success: true, data: { documentId: document.id } },
    { status: 201 }
  );
}
