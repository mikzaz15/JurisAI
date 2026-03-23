export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  extractTextFromBuffer,
  isSupportedMimeType,
} from "@/lib/document-extractor";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  // Check document limit
  const sub = await prisma.subscription.findUnique({
    where: { orgId: session.user.orgId },
    select: { documentsUsed: true, documentsLimit: true },
  });
  if (sub && sub.documentsUsed >= sub.documentsLimit) {
    return NextResponse.json(
      { success: false, error: { code: "LIMIT_EXCEEDED", message: "Límite de documentos alcanzado" } },
      { status: 403 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_BODY", message: "Datos de formulario inválidos" } },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json(
      { success: false, error: { code: "NO_FILE", message: "No se recibió ningún archivo" } },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { success: false, error: { code: "FILE_TOO_LARGE", message: "El archivo supera los 10 MB" } },
      { status: 413 }
    );
  }

  const mimeType = file.type || "application/octet-stream";
  if (!isSupportedMimeType(mimeType)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNSUPPORTED_TYPE",
          message: "Formato no soportado. Usa PDF, DOCX o TXT.",
        },
      },
      { status: 415 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let extractedText = "";
  try {
    extractedText = await extractTextFromBuffer(buffer, mimeType);
  } catch (err) {
    console.error("[documentos/upload] extraction error:", err);
    return NextResponse.json(
      { success: false, error: { code: "EXTRACTION_FAILED", message: "No se pudo extraer el texto del archivo" } },
      { status: 422 }
    );
  }

  // Derive a clean document title from the file name
  const title = file.name.replace(/\.[^.]+$/, "") || "Documento subido";

  const document = await prisma.document.create({
    data: {
      title,
      type: "GENERAL",
      status: "DRAFT",
      extractedText: extractedText.slice(0, 200_000), // safety cap
      fileType: mimeType,
      fileSizeBytes: file.size,
      userId: session.user.id,
    },
  });

  // Increment usage
  if (sub) {
    await prisma.subscription.update({
      where: { orgId: session.user.orgId },
      data: { documentsUsed: { increment: 1 } },
    });
  }

  return NextResponse.json(
    { success: true, data: { documentId: document.id } },
    { status: 201 }
  );
}
