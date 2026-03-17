"use client";

import { useState, useCallback, useRef } from "react";
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

interface AiAssistantPanelProps {
  documentId: string;
  editor: Editor | null;
}

export function AiAssistantPanel({ documentId, editor }: AiAssistantPanelProps) {
  const t = useTranslations("redactor");
  const [instruction, setInstruction] = useState("");
  const [output, setOutput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

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
              setOutput(payload.text);
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
    if (!editor || !output) return;
    const html = markdownToHtml(output);
    editor.chain().focus().insertContent(html).run();
  }, [editor, output]);

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
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="whitespace-pre-wrap text-xs text-gray-800 leading-relaxed">
                {output}
                {streaming && <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-gray-500" />}
              </p>
            </div>

            {!streaming && output && (
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={handleInsert} className="flex-1 text-xs">
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {t("aiInsert")}
                </Button>
                <button
                  onClick={handleClear}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  title={t("aiClear")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
