"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, Plus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Editor } from "@tiptap/react";

/** Strip markdown code fences and convert common markdown to HTML for TipTap insertion. */
function markdownToHtml(text: string): string {
  // Remove opening/closing code fences (```markdown, ```text, ```, etc.)
  let cleaned = text.replace(/^```[a-z]*\n?/gm, "").replace(/^```\s*$/gm, "").trim();

  // Process line by line to build HTML
  const lines = cleaned.split("\n");
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Headings
    if (/^###\s/.test(line)) {
      html.push(`<h3>${inlineMarkdown(line.slice(4).trim())}</h3>`);
      i++;
      continue;
    }
    if (/^##\s/.test(line)) {
      html.push(`<h2>${inlineMarkdown(line.slice(3).trim())}</h2>`);
      i++;
      continue;
    }
    if (/^#\s/.test(line)) {
      html.push(`<h1>${inlineMarkdown(line.slice(2).trim())}</h1>`);
      i++;
      continue;
    }

    // Blank line → skip (paragraph boundary)
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph: collect consecutive non-blank, non-heading lines
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^#{1,3}\s/.test(lines[i])) {
      paraLines.push(inlineMarkdown(lines[i]));
      i++;
    }
    if (paraLines.length) {
      html.push(`<p>${paraLines.join("<br>")}</p>`);
    }
  }

  return html.join("") || `<p>${cleaned}</p>`;
}

function inlineMarkdown(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>");
}

function isExplicitFullRewriteRequest(instruction: string) {
  return /(?:reescribe|redacta|genera|rehace|rewrite|redraft).*(?:todo|completo|entero|integral|full|entire)|(?:contrato|documento).*(?:completo|entero|integral)|full rewrite|entire document/i.test(
    instruction
  );
}

function wantsSignatureSections(instruction: string) {
  return /\bfirma|firmas|signature|signatures|testigos|witness/i.test(instruction);
}

function isScopedClauseRequest(instruction: string) {
  return !isExplicitFullRewriteRequest(instruction) && /\bcl[aá]usula|pena convencional|incumplimiento|agrega|añade|inserta|incorpora|modifica|ajusta|complementa\b/i.test(
    instruction
  );
}

function stripCodeFences(text: string) {
  return text.replace(/^```[a-z]*\n?/gm, "").replace(/^```\s*$/gm, "").trim();
}

function removePlaceholderLines(text: string) {
  return text
    .split("\n")
    .filter((line) => !/^\s*\[[^\]]+\]\s*$/.test(line.trim()))
    .join("\n");
}

function stripSignatureTail(text: string) {
  const lines = text.split("\n");
  const cutIndex = lines.findIndex((line) => {
    const trimmed = line.trim();
    return (
      /^_{3,}$/.test(trimmed) ||
      /^#{1,3}\s*(firmas?|testigos?|signatures?)\b/i.test(trimmed) ||
      /^protesto lo necesario$/i.test(trimmed)
    );
  });

  return cutIndex >= 0 ? lines.slice(0, cutIndex).join("\n").trim() : text.trim();
}

function looksLikeFullDocument(text: string) {
  const clauseMatches =
    text.match(/^(?:#{1,3}\s*)?(?:PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|S[EÉ]PTIMA|SEPTIMA|OCTAVA|NOVENA|D[EÉ]CIMA|DECIMA|UND[EÉ]CIMA|UNDECIMA|DUOD[EÉ]CIMA|DUODECIMA)\./gim) ?? [];

  return (
    text.length > 1400 ||
    clauseMatches.length > 1 ||
    /\bCOMPARECEN\b|\bDECLARAN\b|\bCL[ÁA]USULAS\b|\bTESTIGOS\b/i.test(text)
  );
}

function extractFirstClauseBlock(text: string) {
  const lines = text.split("\n");
  const clauseHeading = /^(?:#{1,3}\s*)?(?:PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|S[EÉ]PTIMA|SEPTIMA|OCTAVA|NOVENA|D[EÉ]CIMA|DECIMA|UND[EÉ]CIMA|UNDECIMA|DUOD[EÉ]CIMA|DUODECIMA)\./i;
  const stopHeading = /^(?:#{1,3}\s*)?(?:PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|S[EÉ]PTIMA|SEPTIMA|OCTAVA|NOVENA|D[EÉ]CIMA|DECIMA|UND[EÉ]CIMA|UNDECIMA|DUOD[EÉ]CIMA|DUODECIMA)\./i;
  const stopSection = /^#{1,3}\s*(firmas?|testigos?|comparecen|declaran|cl[áa]usulas)\b/i;

  const startIndex = lines.findIndex((line) => clauseHeading.test(line.trim()));
  if (startIndex < 0) return text.trim();

  const collected: string[] = [];
  for (let i = startIndex; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (
      i > startIndex &&
      (stopHeading.test(trimmed) || stopSection.test(trimmed) || /^_{3,}$/.test(trimmed))
    ) {
      break;
    }
    collected.push(lines[i]);
  }

  return collected.join("\n").trim();
}

function sanitizeGeneratedOutput(rawText: string, instruction: string) {
  const fullRewriteRequested = isExplicitFullRewriteRequest(instruction);
  let text = stripCodeFences(rawText).replace(/\r\n/g, "\n").trim();

  if (!text) return "";

  text = removePlaceholderLines(text)
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!fullRewriteRequested && !wantsSignatureSections(instruction)) {
    text = stripSignatureTail(text);
  }

  if (!fullRewriteRequested && isScopedClauseRequest(instruction) && looksLikeFullDocument(text)) {
    text = extractFirstClauseBlock(text);
  }

  return text.replace(/\n{3,}/g, "\n\n").trim();
}

interface AiAssistantPanelProps {
  documentId: string;
  editor: Editor | null;
  lastSelection: { from: number; to: number; empty: boolean } | null;
}

export function AiAssistantPanel({ documentId, editor, lastSelection }: AiAssistantPanelProps) {
  const t = useTranslations("redactor");
  const [instruction, setInstruction] = useState("");
  const [output, setOutput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [insertNotice, setInsertNotice] = useState<"selection" | "cursor" | "end" | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastInsertedOutputRef = useRef<string | null>(null);

  const safeOutput = useMemo(
    () => (streaming ? output : sanitizeGeneratedOutput(output, instruction)),
    [instruction, output, streaming]
  );
  const canInsert =
    !!safeOutput &&
    !streaming &&
    !/^Error al generar|^Error generating/i.test(safeOutput);

  useEffect(() => {
    setInsertNotice(null);
    if (!streaming) {
      lastInsertedOutputRef.current = null;
    }
  }, [instruction, output, streaming]);

  const handleGenerate = useCallback(async () => {
    if (!instruction.trim() || streaming) return;
    setStreaming(true);
    setOutput("");

    const selectedText = editor?.state.selection
      ? editor.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to
        )
      : "";

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/redactor/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          instruction: instruction.trim(),
          selectedText: selectedText || undefined,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("Error al generar");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          const raw = part.slice(6).trim();
          if (!raw) continue;
          try {
            const payload = JSON.parse(raw);
            if (payload.type === "token") {
              accumulated += payload.text;
              setOutput(accumulated);
            } else if (payload.type === "done") {
              setOutput(sanitizeGeneratedOutput(payload.text, instruction));
            }
          } catch {}
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setOutput("Error al generar. Verifica tu conexión e intenta de nuevo.");
      }
    } finally {
      setStreaming(false);
    }
  }, [documentId, editor, instruction, streaming]);

  const handleInsert = useCallback(() => {
    if (!editor || !safeOutput || streaming) return;
    if (lastInsertedOutputRef.current === safeOutput) return;

    const html = markdownToHtml(safeOutput);
    const fallbackPosition = editor.state.doc.content.size;
    const insertionRange = lastSelection ?? { from: fallbackPosition, to: fallbackPosition, empty: true };
    const insertionTarget = lastSelection
      ? lastSelection.empty
        ? "cursor"
        : "selection"
      : "end";

    const inserted = editor
      .chain()
      .focus()
      .insertContentAt({ from: insertionRange.from, to: insertionRange.to }, html, {
        updateSelection: true,
      })
      .run();

    if (inserted) {
      lastInsertedOutputRef.current = safeOutput;
      setInsertNotice(insertionTarget);
    }
  }, [editor, lastSelection, safeOutput, streaming]);

  const handleClear = () => {
    setOutput("");
    setInstruction("");
  };

  return (
    <div className="flex h-full flex-col border-l border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
        <Sparkles className="h-4 w-4 text-[#C9A84C]" />
        <h3 className="text-sm font-semibold text-gray-900">{t("aiAssistant")}</h3>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {/* Instruction input */}
        <div>
          <p className="mb-1.5 text-xs font-medium text-gray-700">{t("aiInstruction")}</p>
          <Textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={t("aiPlaceholder")}
            rows={3}
            className="resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
            }}
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!instruction.trim() || streaming}
          size="sm"
          className="w-full"
        >
          {streaming ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              {t("aiGenerating")}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              {t("aiGenerate")}
            </>
          )}
        </Button>

        {/* Output */}
        {(output || streaming) && (
          <div className="flex-1">
            <div className="mb-2 rounded-md border border-[#C9A84C]/20 bg-[#C9A84C]/5 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6F2D]">
                {t("aiPreview")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                {t("aiPreviewNote")}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="whitespace-pre-wrap text-xs text-gray-800 leading-relaxed">
                {safeOutput}
                {streaming && <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-gray-500" />}
              </p>
            </div>

            {!streaming && safeOutput && (
              <div className="mt-2">
                {insertNotice && (
                  <p className="mb-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                    {insertNotice === "selection"
                      ? t("aiInsertedSelection")
                      : insertNotice === "cursor"
                      ? t("aiInsertedCursor")
                      : t("aiInsertedEnd")}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleInsert}
                    disabled={!canInsert || lastInsertedOutputRef.current === safeOutput}
                    className="flex-1 text-xs"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    {lastInsertedOutputRef.current === safeOutput ? t("aiInserted") : t("aiInsert")}
                  </Button>
                  <button
                    onClick={handleClear}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    title={t("aiClear")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
