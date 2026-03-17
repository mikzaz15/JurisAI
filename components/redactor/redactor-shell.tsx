"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { Editor } from "@tiptap/react";
import { PanelRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorToolbar } from "./editor-toolbar";

// TipTap uses browser-only APIs — must not run during SSR
const TiptapEditor = dynamic(
  () => import("./tiptap-editor").then((m) => m.TiptapEditor),
  { ssr: false, loading: () => <div className="flex-1 animate-pulse bg-gray-50" /> }
);
import { DocumentHeader } from "./document-header";
import { VersionPanel } from "./version-panel";
import { ExportMenu } from "./export-menu";
import { AiAssistantPanel } from "./ai-assistant-panel";

type SaveState = "saved" | "saving" | "unsaved";

interface DocumentData {
  id: string;
  title: string;
  type: string;
  status: string;
  content: string | null;
}

interface RedactorShellProps {
  document: DocumentData;
}

const AUTOSAVE_DELAY = 2000;
const VERSION_INTERVAL_MS = 5 * 60 * 1000;

export function RedactorShell({ document: doc }: RedactorShellProps) {
  const t = useTranslations("redactor");

  const [editor, setEditor] = useState<Editor | null>(null);
  const [title, setTitle] = useState(doc.title);
  const [status, setStatus] = useState(doc.status);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [versionPanelOpen, setVersionPanelOpen] = useState(false);

  const pendingContent = useRef<string | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastVersionAt = useRef<number>(Date.now());

  const save = useCallback(
    async (overrides?: { title?: string; status?: string; content?: string }) => {
      setSaveState("saving");
      const body: Record<string, unknown> = {};
      if (overrides?.title !== undefined) body.title = overrides.title;
      else body.title = title;
      if (overrides?.status !== undefined) body.status = overrides.status;
      else body.status = status;
      if (overrides?.content !== undefined) body.content = overrides.content;
      else if (pendingContent.current !== null) body.content = pendingContent.current;

      const res = await fetch(`/api/documentos/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSaveState("saved");
        pendingContent.current = null;

        // Periodically create a version snapshot
        if (Date.now() - lastVersionAt.current >= VERSION_INTERVAL_MS) {
          lastVersionAt.current = Date.now();
          fetch(`/api/documentos/${doc.id}/versiones`, { method: "POST" }).catch(() => {});
        }
      } else {
        setSaveState("unsaved");
      }
    },
    [doc.id, title, status]
  );

  const handleContentUpdate = useCallback((content: string) => {
    pendingContent.current = content;
    setSaveState("unsaved");

    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      save({ content });
    }, AUTOSAVE_DELAY);
  }, [save]);

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    save({ title: newTitle });
  }, [save]);

  const handleStatusChange = useCallback((newStatus: string) => {
    setStatus(newStatus);
    save({ status: newStatus });
  }, [save]);

  const handleRestoreVersion = useCallback(async (versionId: string) => {
    if (!confirm("¿Restaurar esta versión?")) return;
    const res = await fetch(`/api/documentos/${doc.id}/versiones/${versionId}`, {
      method: "POST",
    });
    const json = await res.json();
    if (json.success && json.data.document.content && editor) {
      try {
        const parsed = JSON.parse(json.data.document.content);
        editor.commands.setContent(parsed);
      } catch {
        editor.commands.setContent(json.data.document.content);
      }
      setSaveState("saved");
    }
    setVersionPanelOpen(false);
  }, [doc.id, editor]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* Document header row */}
      <DocumentHeader
        title={title}
        type={doc.type}
        status={status}
        saveState={saveState}
        onTitleChange={handleTitleChange}
        onStatusChange={handleStatusChange}
      />

      {/* Actions row */}
      <div className="flex items-center justify-end gap-2 border-b border-gray-200 bg-white px-4 py-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setVersionPanelOpen((v) => !v)}
          className={versionPanelOpen ? "bg-gray-100" : ""}
        >
          <Clock className="mr-1.5 h-3.5 w-3.5" />
          {t("versions")}
        </Button>
        <ExportMenu documentId={doc.id} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAiPanelOpen((v) => !v)}
          className={aiPanelOpen ? "bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/30" : ""}
        >
          <PanelRight className="mr-1.5 h-3.5 w-3.5" />
          IA
        </Button>
      </div>

      {/* Main editor area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Editor panel */}
        <div className="flex flex-1 flex-col overflow-hidden bg-white">
          <EditorToolbar editor={editor} />
          <div className="flex-1 overflow-y-auto">
            <TiptapEditor
              initialContent={doc.content ?? undefined}
              onUpdate={handleContentUpdate}
              onEditorReady={setEditor}
            />
          </div>
        </div>

        {/* AI Assistant panel */}
        {aiPanelOpen && (
          <div className="w-80 shrink-0">
            <AiAssistantPanel documentId={doc.id} editor={editor} />
          </div>
        )}

        {/* Version history panel (absolute overlay on right) */}
        <VersionPanel
          documentId={doc.id}
          open={versionPanelOpen}
          onClose={() => setVersionPanelOpen(false)}
          onRestore={handleRestoreVersion}
        />
      </div>
    </div>
  );
}
