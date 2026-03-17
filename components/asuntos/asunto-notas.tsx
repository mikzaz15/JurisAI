"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Note {
  id: string;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface AsuntoNotasProps {
  matterId: string;
  initialNotes: Note[];
}

export function AsuntoNotas({ matterId, initialNotes }: AsuntoNotasProps) {
  const t = useTranslations("asuntos");
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [newContent, setNewContent] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!newContent.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/asuntos/${matterId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newContent.trim() }),
    });
    const json = await res.json();
    if (json.success) {
      setNotes((prev) => [json.data.note, ...prev]);
      setNewContent("");
    }
    setSaving(false);
  }, [matterId, newContent]);

  const handleDelete = useCallback(async (noteId: string) => {
    await fetch(`/api/asuntos/${matterId}/notes/${noteId}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }, [matterId]);

  return (
    <div className="space-y-4">
      {/* New note input */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <Textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder={t("notesPlaceholder")}
          rows={3}
          className="resize-none border-0 p-0 text-sm shadow-none focus-visible:ring-0"
        />
        <div className="mt-3 flex justify-end">
          <Button
            size="sm"
            disabled={!newContent.trim() || saving}
            onClick={handleSave}
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {saving ? "Guardando..." : t("noteSaved")}
          </Button>
        </div>
      </div>

      {/* Existing notes */}
      {notes.map((note) => (
        <div
          key={note.id}
          className="group relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <p className="whitespace-pre-wrap text-sm text-gray-700">{note.content}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(note.createdAt), {
                addSuffix: true,
                locale: es,
              })}
            </span>
            <button
              onClick={() => handleDelete(note.id)}
              className="rounded p-1 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}

      {notes.length === 0 && !newContent && (
        <div className="py-8 text-center text-sm text-gray-400">
          Sin notas aún. Escribe la primera nota arriba.
        </div>
      )}
    </div>
  );
}
