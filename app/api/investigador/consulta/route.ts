import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  INVESTIGADOR_SYSTEM_PROMPT,
  MODEL_ID,
  GENERATION_CONFIG,
} from "@/lib/investigador-prompts";
import { parseAIResponse } from "@/lib/citation-parser";
import { z } from "zod";

const consultaSchema = z.object({
  sessionId: z.string().cuid(),
  query: z.string().min(1).max(4000),
  jurisdiction: z.string().optional(),
  areaOfLaw: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_BODY", message: "Cuerpo inválido" } },
      { status: 400 }
    );
  }

  const parsed = consultaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const { sessionId, query, jurisdiction, areaOfLaw } = parsed.data;

  // Verify session belongs to user
  const researchSession = await prisma.researchSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { role: true, content: true },
      },
    },
  });

  if (!researchSession) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Sesión no encontrada" } },
      { status: 404 }
    );
  }

  // Check subscription query limit
  if (session.user.orgId) {
    const sub = await prisma.subscription.findUnique({
      where: { orgId: session.user.orgId },
    });
    if (sub && sub.queriesUsed >= sub.queriesLimit) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "QUERY_LIMIT_REACHED",
            message: "Has alcanzado el límite de consultas de tu plan",
          },
        },
        { status: 429 }
      );
    }
  }

  // Save user message
  const userMessage = await prisma.message.create({
    data: {
      sessionId,
      role: "USER",
      content: query,
    },
  });

  // Auto-set session title from first user message
  if (!researchSession.title && researchSession.messages.length === 0) {
    await prisma.researchSession.update({
      where: { id: sessionId },
      data: { title: query.slice(0, 80) },
    });
  }

  // Build conversation messages for OpenAI
  const conversationMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: INVESTIGADOR_SYSTEM_PROMPT },
    ...researchSession.messages.map((m) => ({
      role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    })),
    { role: "user" as const, content: buildUserMessage(query, jurisdiction, areaOfLaw) },
  ];

  // Initialize OpenAI client
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "AI_NOT_CONFIGURED", message: "API key de IA no configurada" },
      },
      { status: 503 }
    );
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Create streaming response
  const encoder = new TextEncoder();
  const startTime = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      let fullText = "";
      let inputTokens = 0;
      let outputTokens = 0;

      try {
        const openaiStream = await openai.chat.completions.create({
          model: MODEL_ID,
          messages: conversationMessages,
          max_tokens: GENERATION_CONFIG.max_tokens,
          temperature: GENERATION_CONFIG.temperature,
          stream: true,
          stream_options: { include_usage: true },
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
          if (chunk.usage) {
            inputTokens = chunk.usage.prompt_tokens ?? 0;
            outputTokens = chunk.usage.completion_tokens ?? 0;
          }
        }

        // Parse the full response
        const { content, confidence, followUp, citations } =
          parseAIResponse(fullText);
        const latencyMs = Date.now() - startTime;
        const totalTokens = inputTokens + outputTokens;

        // Map confidence string to 0-1 float
        const confidenceMap = { ALTA: 0.9, MEDIA: 0.6, BAJA: 0.3 };
        const confidenceScore =
          confidenceMap[confidence as keyof typeof confidenceMap] ?? 0.6;

        // Save assistant message
        const assistantMessage = await prisma.message.create({
          data: {
            sessionId,
            role: "ASSISTANT",
            content,
            citations: citations as unknown as import("@prisma/client").Prisma.InputJsonValue,
            confidence: confidenceScore,
            tokensUsed: totalTokens,
            latencyMs,
          },
        });

        // Update session metadata
        await prisma.researchSession.update({
          where: { id: sessionId },
          data: {
            tokensUsed: { increment: totalTokens },
            modelUsed: MODEL_ID,
            updatedAt: new Date(),
          },
        });

        // Increment usage counters
        if (session.user.orgId) {
          await prisma.subscription.updateMany({
            where: { orgId: session.user.orgId },
            data: { queriesUsed: { increment: 1 } },
          });
          await prisma.usageMetric.create({
            data: {
              orgId: session.user.orgId,
              userId: session.user.id,
              metricType: "ai_query",
              tokensUsed: totalTokens,
              latencyMs,
              modelUsed: MODEL_ID,
            },
          });
        }

        // Log audit entry
        await prisma.auditLog.create({
          data: {
            action: "research.query",
            resource: "ResearchSession",
            resourceId: sessionId,
            userId: session.user.id,
            orgId: session.user.orgId,
            details: { queryLength: query.length, confidence, citations: citations.length },
          },
        });

        // Send final done event
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "done",
              messageId: assistantMessage.id,
              userMessageId: userMessage.id,
              confidence,
              followUp,
              citations,
              tokensUsed: totalTokens,
            })}\n\n`
          )
        );
      } catch (err) {
        console.error("[consulta] Stream error:", err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              message: "Error al generar la respuesta. Por favor, inténtalo de nuevo.",
            })}\n\n`
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

function buildUserMessage(
  query: string,
  jurisdiction?: string,
  areaOfLaw?: string
): string {
  const parts = [query];
  if (jurisdiction && jurisdiction !== "federal")
    parts.push(`\n[Jurisdicción: ${jurisdiction}]`);
  if (areaOfLaw && areaOfLaw !== "ALL")
    parts.push(`[Área del derecho: ${areaOfLaw}]`);
  return parts.join(" ");
}
