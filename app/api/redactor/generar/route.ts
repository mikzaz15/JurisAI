import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
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

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { success: false, error: { code: "AI_NOT_CONFIGURED" } },
      { status: 503 }
    );
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const docContext = doc.content
    ? tiptapToPlainText(doc.content).slice(0, 3000)
    : "";

  let userMessage = `Documento: "${doc.title}"\n\nInstrucción: ${instruction}`;
  if (selectedText) userMessage += `\n\nTexto seleccionado:\n${selectedText}`;
  if (docContext) userMessage += `\n\nContexto del documento (primeros 3000 caracteres):\n${docContext}`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullText = "";
      try {
        const openaiStream = await openai.chat.completions.create({
          model: REDACTOR_MODEL_ID,
          messages: [
            { role: "system", content: REDACTOR_SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          max_tokens: REDACTOR_GENERATION_CONFIG.max_tokens,
          temperature: REDACTOR_GENERATION_CONFIG.temperature,
          stream: true,
        });

        for await (const chunk of openaiStream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) {
            fullText += text;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "token", text })}\n\n`
              )
            );
          }
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "done", text: fullText })}\n\n`
          )
        );
      } catch (err) {
        console.error("[redactor/generar]", err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: "Error al generar" })}\n\n`
          )
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
