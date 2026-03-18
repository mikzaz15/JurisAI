"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import CharacterCount from "@tiptap/extension-character-count";

interface TiptapEditorProps {
  initialContent?: string;
  onUpdate: (content: string) => void;
  onEditorReady?: (editor: ReturnType<typeof useEditor>) => void;
  onSelectionChange?: (selection: { from: number; to: number; empty: boolean }) => void;
  editable?: boolean;
}

export function TiptapEditor({
  initialContent,
  onUpdate,
  onEditorReady,
  onSelectionChange,
  editable = true,
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder: "Empieza a escribir el documento legal...",
      }),
      Highlight.configure({ multicolor: false }),
      CharacterCount,
    ],
    content: (() => {
      if (!initialContent) return "";
      try {
        return JSON.parse(initialContent);
      } catch {
        return initialContent;
      }
    })(),
    editable,
    onUpdate({ editor }) {
      onUpdate(JSON.stringify(editor.getJSON()));
    },
    onSelectionUpdate({ editor }) {
      onSelectionChange?.({
        from: editor.state.selection.from,
        to: editor.state.selection.to,
        empty: editor.state.selection.empty,
      });
    },
  });

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  return (
    <div className="tiptap-wrapper flex-1 overflow-y-auto">
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none px-8 py-6 focus:outline-none min-h-[calc(100vh-12rem)] [&_.ProseMirror]:min-h-[calc(100vh-12rem)] [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none"
      />
    </div>
  );
}
