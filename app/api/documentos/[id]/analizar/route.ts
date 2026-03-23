export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tiptapToPlainText } from "@/lib/tiptap-to-text";
import { REDACTOR_MODEL_ID } from "@/lib/redactor-prompts";

const ANALYSIS_SYSTEM_PROMPT = `Eres JurisAI Analizador, un asistente especializado en análisis de documentos legales mexicanos.

Tu tarea es analizar documentos legales y proporcionar un informe estructurado que incluya:

1. **Tipo de documento**: Identifica el tipo (contrato, amparo, acta, poder notarial, etc.)
2. **Partes involucradas**: Lista las partes identificadas y sus roles
3. **Cláusulas principales**: Resume las cláusulas o secciones clave
4. **Fechas y plazos clave**: Extrae fechas importantes y plazos
5. **Riesgos identificados**: Señala cláusulas problemáticas, ambigüedades, términos desfavorables o ausencia de protecciones estándar
6. **Citas legales**: Lista las referencias normativas encontradas y verifica si son apropiadas
7. **Mejoras sugeridas**: Proporciona recomendaciones concretas para fortalecer el documento

Sé específico, usa terminología legal mexicana correcta, y organiza tu respuesta con encabezados markdown claros.
Responde siempre en español.`;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { success: false, error: { code: "AI_NOT_CONFIGURED", message: "IA no configurada" } },
      { status: 503 }
    );
  }

  const doc = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!doc) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Documento no encontrado" } },
      { status: 404 }
    );
  }

  const textCorpus =
    doc.extractedText?.trim() ||
    (doc.content ? tiptapToPlainText(doc.content) : "");

  if (!textCorpus) {
    return NextResponse.json(
      { success: false, error: { code: "NO_CONTENT", message: "El documento no tiene contenido para analizar" } },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const instruction: string = body?.instruction?.trim() || "";

  const userMessage = `Analiza el siguiente documento legal:\n\n${textCorpus.slice(0, 8000)}${
    instruction ? `\n\nEnfoque especial: ${instruction}` : ""
  }`;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let fullText = "";
      try {
        const openaiStream = await openai.chat.completions.create({
          model: REDACTOR_MODEL_ID,
          messages: [
            { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          max_tokens: 2048,
          temperature: 0.3,
          stream: true,
        });

        for await (const chunk of openaiStream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) {
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
        console.error("[documentos/analizar]", err);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Error al analizar" })}\n\n`)
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
