import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
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

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { success: false, error: { code: "AI_NOT_CONFIGURED" } },
      { status: 503 }
    );
  }

  const contentWithVars = replaceVariables(template.content, variables);
  const documentTitle = title ?? `${template.name} — ${new Date().toLocaleDateString("es-MX")}`;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const userMessage = `Completa y perfecciona el siguiente documento legal mexicano con las variables ya insertadas. El documento debe quedar completamente redactado y listo para uso profesional. Devuelve ÚNICAMENTE el contenido del documento en formato Markdown, sin explicaciones previas:\n\n${contentWithVars}`;

  const completion = await openai.chat.completions.create({
    model: REDACTOR_MODEL_ID,
    messages: [
      { role: "system", content: REDACTOR_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    max_tokens: REDACTOR_GENERATION_CONFIG.max_tokens,
    temperature: REDACTOR_GENERATION_CONFIG.temperature,
  });

  const generatedContent = completion.choices[0]?.message?.content ?? contentWithVars;

  const tiptapContent = JSON.stringify({
    type: "doc",
    content: generatedContent.split("\n\n").map((para) => ({
      type: "paragraph",
      content: para ? [{ type: "text", text: para }] : [],
    })),
  });

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
