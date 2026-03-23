import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  REDACTOR_SYSTEM_PROMPT,
  REDACTOR_MODEL_ID,
  REDACTOR_GENERATION_CONFIG,
} from "@/lib/redactor-prompts";
import { tiptapToPlainText } from "@/lib/tiptap-to-text";
import { z } from "zod";

const generarSchema = z.object({
  documentId: z.string().cuid(),
  instruction: z.string().min(1).max(2000),
  selectedText: z.string().max(5000).optional(),
});

function isExplicitFullRewriteRequest(instruction: string) {
  return /(?:reescribe|redacta|genera|rehace|rewrite|redraft).*(?:todo|completo|entero|integral|full|entire)|(?:contrato|documento).*(?:completo|entero|integral)|full rewrite|entire document/i.test(
    instruction
  );
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

  const parsed = generarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const { documentId, instruction, selectedText } = parsed.data;

  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId: session.user.id },
  });
  if (!doc) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { success: false, error: { code: "AI_NOT_CONFIGURED" } },
      { status: 503 }
    );
  }

  const docContext = doc.content
    ? tiptapToPlainText(doc.content).slice(0, 3000)
    : "";
  const fullRewriteRequested = isExplicitFullRewriteRequest(instruction);

  const modeGuidance = fullRewriteRequested
    ? "MODO: FULL_REWRITE. El usuario pidió explícitamente una reescritura o redacción integral. Puedes devolver un borrador completo del documento solicitado."
    : selectedText
    ? "MODO: TARGETED_EDIT. Trata la solicitud como una edición puntual del texto seleccionado. Devuelve solo el texto de reemplazo para ese fragmento. No repitas encabezados, firmas, partes no seleccionadas ni el resto del documento."
    : "MODO: SCOPED_INSERTION. Trata la solicitud como una inserción o mejora puntual. Devuelve solo la cláusula o bloque estrechamente solicitado. No devuelvas el contrato completo, no repitas secciones existentes, no agregues firmas, no agregues testigos y no uses placeholders entre corchetes.";

  let userMessage = `Documento: "${doc.title}"\n\nInstrucción: ${instruction}`;
  if (selectedText) userMessage += `\n\nTexto seleccionado:\n${selectedText}`;
  if (docContext) userMessage += `\n\nContexto del documento (primeros 3000 caracteres):\n${docContext}`;
  userMessage += `\n\n${modeGuidance}`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let fullText = "";
      try {
        const anthropicStream = anthropic.messages.stream({
          model: REDACTOR_MODEL_ID,
          max_tokens: REDACTOR_GENERATION_CONFIG.max_tokens,
          system: REDACTOR_SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage }],
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const text = event.delta.text;
            fullText += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "token", text })}\n\n`)
            );
          }
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done", text: fullText })}\n\n`)
        );
      } catch (err) {
        console.error("[redactor/generar]", err);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Error al generar" })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
