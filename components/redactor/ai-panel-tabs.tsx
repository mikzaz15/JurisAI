"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, Plus, Loader2, X, RotateCcw, Clock, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Editor } from "@tiptap/react";

// ─── Helpers (shared with generar endpoint logic) ────────────────────────────

function markdownToHtml(text: string): string {
  let cleaned = text.replace(/^```[a-z]*\n?/gm, "").replace(/^```\s*$/gm, "").trim();
  const lines = cleaned.split("\n");
  const html: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^###\s/.test(line)) { html.push(`<h3>${inlineMarkdown(line.slice(4).trim())}</h3>`); i++; continue; }
    if (/^##\s/.test(line))  { html.push(`<h2>${inlineMarkdown(line.slice(3).trim())}</h2>`); i++; continue; }
    if (/^#\s/.test(line))   { html.push(`<h1>${inlineMarkdown(line.slice(2).trim())}</h1>`); i++; continue; }
    if (line.trim() === "")  { i++; continue; }
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^#{1,3}\s/.test(lines[i])) {
      paraLines.push(inlineMarkdown(lines[i])); i++;
    }
    if (paraLines.length) html.push(`<p>${paraLines.join("<br>")}</p>`);
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
  return /(?:reescribe|redacta|genera|rehace|rewrite|redraft).*(?:todo|completo|entero|integral|full|entire)|(?:contrato|documento).*(?:completo|entero|integral)|full rewrite|entire document/i.test(instruction);
}
function wantsSignatureSections(instruction: string) {
  return /\bfirma|firmas|signature|signatures|testigos|witness/i.test(instruction);
}
function isScopedClauseRequest(instruction: string) {
  return !isExplicitFullRewriteRequest(instruction) && /\bcl[aá]usula|pena convencional|incumplimiento|agrega|añade|inserta|incorpora|modifica|ajusta|complementa\b/i.test(instruction);
}
function stripCodeFences(text: string) { return text.replace(/^```[a-z]*\n?/gm, "").replace(/^```\s*$/gm, "").trim(); }
function removePlaceholderLines(text: string) { return text.split("\n").filter((l) => !/^\s*\[[^\]]+\]\s*$/.test(l.trim())).join("\n"); }
function stripSignatureTail(text: string) {
  const lines = text.split("\n");
  const idx = lines.findIndex((l) => { const t = l.trim(); return /^_{3,}$/.test(t) || /^#{1,3}\s*(firmas?|testigos?|signatures?)\b/i.test(t) || /^protesto lo necesario$/i.test(t); });
  return idx >= 0 ? lines.slice(0, idx).join("\n").trim() : text.trim();
}
function looksLikeFullDocument(text: string) {
  const m = text.match(/^(?:#{1,3}\s*)?(?:PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|S[EÉ]PTIMA|SEPTIMA|OCTAVA|NOVENA|D[EÉ]CIMA|DECIMA|UND[EÉ]CIMA|UNDECIMA|DUOD[EÉ]CIMA|DUODECIMA)\./gim) ?? [];
  return text.length > 1400 || m.length > 1 || /\bCOMPARECEN\b|\bDECLARAN\b|\bCL[ÁA]USULAS\b|\bTESTIGOS\b/i.test(text);
}
function extractFirstClauseBlock(text: string) {
  const lines = text.split("\n");
  const clauseHeading = /^(?:#{1,3}\s*)?(?:PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|S[EÉ]PTIMA|SEPTIMA|OCTAVA|NOVENA|D[EÉ]CIMA|DECIMA|UND[EÉ]CIMA|UNDECIMA|DUOD[EÉ]CIMA|DUODECIMA)\./i;
  const stopSection = /^#{1,3}\s*(firmas?|testigos?|comparecen|declaran|cl[áa]usulas)\b/i;
  const startIndex = lines.findIndex((l) => clauseHeading.test(l.trim()));
  if (startIndex < 0) return text.trim();
  const collected: string[] = [];
  for (let i = startIndex; i < lines.length; i++) {
    const t = lines[i].trim();
    if (i > startIndex && (clauseHeading.test(t) || stopSection.test(t) || /^_{3,}$/.test(t))) break;
    collected.push(lines[i]);
  }
  return collected.join("\n").trim();
}

function sanitizeGeneratedOutput(rawText: string, instruction: string) {
  const fullRewriteRequested = isExplicitFullRewriteRequest(instruction);
  let text = stripCodeFences(rawText).replace(/\r\n/g, "\n").trim();
  if (!text) return "";
  text = removePlaceholderLines(text).replace(/\[[^\]]+\]/g, "").replace(/\n{3,}/g, "\n\n").trim();
  if (!fullRewriteRequested && !wantsSignatureSections(instruction)) text = stripSignatureTail(text);
  if (!fullRewriteRequested && isScopedClauseRequest(instruction) && looksLikeFullDocument(text)) text = extractFirstClauseBlock(text);
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

// ─── Version types ────────────────────────────────────────────────────────────

interface Version {
  id: string;
  version: number;
  changeNote: string | null;
  createdAt: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AiPanelTabsProps {
  documentId: string;
  editor: Editor | null;
  lastSelection: { from: number; to: number; empty: boolean } | null;
  onRestoreVersion: (versionId: string) => void;
  defaultTab?: "asistente" | "analizar" | "versiones";
}

// ─── Asistente tab ────────────────────────────────────────────────────────────

function AsistenteTab({
  documentId,
  editor,
  lastSelection,
}: {
  documentId: string;
  editor: Editor | null;
  lastSelection: AiPanelTabsProps["lastSelection"];
}) {
  const t = useTranslations("redactor");
  const [instruction, setInstruction] = useState("");
  const [output, setOutput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [insertNotice, setInsertNotice] = useState<"selection" | "cursor" | "end" | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastInsertedRef = useRef<string | null>(null);

  const safeOutput = useMemo(
    () => (streaming ? output : sanitizeGeneratedOutput(output, instruction)),
    [instruction, output, streaming]
  );
  const canInsert = !!safeOutput && !streaming && !/^Error al generar|^Error generating/i.test(safeOutput);

  useEffect(() => {
    setInsertNotice(null);
    if (!streaming) lastInsertedRef.current = null;
  }, [instruction, output, streaming]);

  const handleGenerate = useCallback(async () => {
    if (!instruction.trim() || streaming) return;
    setStreaming(true);
    setOutput("");
    const selectedText = editor?.state.selection
      ? editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)
      : "";
    abortRef.current = new AbortController();
    try {
      const res = await fetch("/api/redactor/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, instruction: instruction.trim(), selectedText: selectedText || undefined }),
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
            if (payload.type === "token") { accumulated += payload.text; setOutput(accumulated); }
            else if (payload.type === "done") setOutput(sanitizeGeneratedOutput(payload.text, instruction));
          } catch {}
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setOutput("Error al generar. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setStreaming(false);
    }
  }, [documentId, editor, instruction, streaming]);

  const handleInsert = useCallback(() => {
    if (!editor || !safeOutput || streaming) return;
    if (lastInsertedRef.current === safeOutput) return;
    const html = markdownToHtml(safeOutput);
    const fallback = editor.state.doc.content.size;
    const range = lastSelection ?? { from: fallback, to: fallback, empty: true };
    const target = lastSelection ? (lastSelection.empty ? "cursor" : "selection") : "end";
    const inserted = editor.chain().focus().insertContentAt({ from: range.from, to: range.to }, html, { updateSelection: true }).run();
    if (inserted) { lastInsertedRef.current = safeOutput; setInsertNotice(target); }
  }, [editor, lastSelection, safeOutput, streaming]);

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
      <div>
        <p className="mb-1.5 text-xs font-medium text-gray-700">{t("aiInstruction")}</p>
        <Textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder={t("aiPlaceholder")}
          rows={3}
          className="resize-none text-sm"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
        />
      </div>
      <Button onClick={handleGenerate} disabled={!instruction.trim() || streaming} size="sm" className="w-full">
        {streaming ? (<><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />{t("aiGenerating")}</>) : (<><Sparkles className="mr-2 h-3.5 w-3.5" />{t("aiGenerate")}</>)}
      </Button>
      {(output || streaming) && (
        <div className="flex-1">
          <div className="mb-2 rounded-md border border-[#C9A84C]/20 bg-[#C9A84C]/5 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6F2D]">{t("aiPreview")}</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">{t("aiPreviewNote")}</p>
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
                  {insertNotice === "selection" ? t("aiInsertedSelection") : insertNotice === "cursor" ? t("aiInsertedCursor") : t("aiInsertedEnd")}
                </p>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleInsert} disabled={!canInsert || lastInsertedRef.current === safeOutput} className="flex-1 text-xs">
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {lastInsertedRef.current === safeOutput ? t("aiInserted") : t("aiInsert")}
                </Button>
                <button onClick={() => { setOutput(""); setInstruction(""); }} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" title={t("aiClear")}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Analizar tab ─────────────────────────────────────────────────────────────

function AnalizarTab({ documentId }: { documentId: string }) {
  const [instruction, setInstruction] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const handleAnalyze = async () => {
    if (streaming) return;
    setStreaming(true);
    setAnalysis("");
    setError("");
    abortRef.current = new AbortController();
    try {
      const res = await fetch(`/api/documentos/${documentId}/analizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: instruction.trim() || undefined }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error?.message || "Error al analizar");
      }
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
            if (payload.type === "token") { accumulated += payload.text; setAnalysis(accumulated); }
            else if (payload.type === "done") setAnalysis(payload.text);
            else if (payload.type === "error") throw new Error(payload.message);
          } catch (e) {
            if ((e as Error).name !== "SyntaxError") throw e;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError((err as Error).message || "Error al analizar el documento.");
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
      <div>
        <p className="mb-1.5 text-xs font-medium text-gray-700">Enfoque del análisis (opcional)</p>
        <Textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Ej. Identifica riesgos para el arrendatario..."
          rows={2}
          className="resize-none text-sm"
        />
      </div>
      <Button
        onClick={handleAnalyze}
        disabled={streaming}
        size="sm"
        className="w-full bg-[#0C1B2A] hover:bg-[#1a2f45] text-white"
      >
        {streaming ? (
          <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Analizando...</>
        ) : (
          <><Scan className="mr-2 h-3.5 w-3.5" />Analizar documento</>
        )}
      </Button>
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      )}
      {analysis && (
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-800 leading-relaxed prose prose-xs max-w-none overflow-y-auto">
          <ReactMarkdown>{analysis}</ReactMarkdown>
          {streaming && <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-gray-500" />}
        </div>
      )}
    </div>
  );
}

// ─── Versiones tab ────────────────────────────────────────────────────────────

function VersionesTab({
  documentId,
  onRestoreVersion,
}: {
  documentId: string;
  onRestoreVersion: (id: string) => void;
}) {
  const t = useTranslations("versiones");
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    if (loaded) return;
    setLoading(true);
    fetch(`/api/documentos/${documentId}/versiones`)
      .then((r) => r.json())
      .then((json) => { if (json.success) setVersions(json.data.versions); })
      .finally(() => { setLoading(false); setLoaded(true); });
  }, [documentId, loaded]);

  // Lazy-load on first render of this tab
  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex-1 overflow-y-auto p-3">
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      )}
      {!loading && versions.length === 0 && (
        <p className="py-8 text-center text-xs text-gray-400">{t("noVersions")}</p>
      )}
      {!loading && versions.map((v, idx) => (
        <div
          key={v.id}
          className={cn(
            "mb-2 rounded-lg border p-3",
            idx === 0 ? "border-[#C9A84C]/30 bg-[#C9A84C]/5" : "border-gray-100"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900">
                {t("version")}{v.version}
                {idx === 0 && <span className="ml-2 text-[10px] text-[#C9A84C]">{t("current")}</span>}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                <Clock className="mr-1 inline h-3 w-3" />
                {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true, locale: es })}
              </p>
              {v.changeNote && <p className="mt-0.5 text-[11px] text-gray-500 truncate">{v.changeNote}</p>}
            </div>
            {idx > 0 && (
              <button
                onClick={() => onRestoreVersion(v.id)}
                title={t("restore")}
                className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-[#C9A84C]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function AiPanelTabs({
  documentId,
  editor,
  lastSelection,
  onRestoreVersion,
  defaultTab = "asistente",
}: AiPanelTabsProps) {
  return (
    <div className="flex h-full flex-col border-l border-gray-200 bg-white">
      <Tabs defaultValue={defaultTab} className="flex flex-1 flex-col min-h-0">
        <div className="border-b border-gray-200 px-3 pt-3">
          <TabsList className="w-full bg-gray-100 h-8">
            <TabsTrigger value="asistente" className="flex-1 text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              Asistente
            </TabsTrigger>
            <TabsTrigger value="analizar" className="flex-1 text-xs gap-1">
              <Scan className="h-3 w-3" />
              Analizar
            </TabsTrigger>
            <TabsTrigger value="versiones" className="flex-1 text-xs gap-1">
              <Clock className="h-3 w-3" />
              Versiones
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="asistente" className="flex flex-1 flex-col min-h-0 mt-0 data-[state=inactive]:hidden">
          <AsistenteTab documentId={documentId} editor={editor} lastSelection={lastSelection} />
        </TabsContent>

        <TabsContent value="analizar" className="flex flex-1 flex-col min-h-0 mt-0 data-[state=inactive]:hidden">
          <AnalizarTab documentId={documentId} />
        </TabsContent>

        <TabsContent value="versiones" className="flex flex-1 flex-col min-h-0 mt-0 data-[state=inactive]:hidden">
          <VersionesTab documentId={documentId} onRestoreVersion={onRestoreVersion} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
