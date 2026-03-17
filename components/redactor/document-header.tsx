"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Pencil } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentTypeBadge } from "@/components/documentos/document-type-badge";
import { cn } from "@/lib/utils";

type SaveState = "saved" | "saving" | "unsaved";

interface DocumentHeaderProps {
  title: string;
  type: string;
  status: string;
  saveState: SaveState;
  onTitleChange: (t: string) => void;
  onStatusChange: (s: string) => void;
}

const STATUSES = [
  { value: "DRAFT", label: "Borrador" },
  { value: "IN_REVIEW", label: "En revisión" },
  { value: "FINAL", label: "Final" },
];

export function DocumentHeader({
  title,
  type,
  status,
  saveState,
  onTitleChange,
  onStatusChange,
}: DocumentHeaderProps) {
  const t = useTranslations("redactor");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  const confirmTitle = () => {
    if (draft.trim()) onTitleChange(draft.trim());
    else setDraft(title);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2">
      {/* Title */}
      <div className="flex flex-1 min-w-0 items-center gap-2">
        {editing ? (
          <div className="flex flex-1 items-center gap-1">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={confirmTitle}
              onKeyDown={(e) => e.key === "Enter" && confirmTitle()}
              className="flex-1 rounded border border-[#C9A84C] px-2 py-0.5 text-sm font-semibold text-gray-900 focus:outline-none min-w-0"
            />
            <button
              type="button"
              onClick={confirmTitle}
              className="text-[#C9A84C] hover:text-[#b8943d]"
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setDraft(title); setEditing(true); }}
            className="group flex items-center gap-1.5 min-w-0"
          >
            <span className="truncate text-sm font-semibold text-gray-900">
              {title || t("untitled")}
            </span>
            <Pencil className="h-3 w-3 shrink-0 text-gray-400 opacity-0 group-hover:opacity-100" />
          </button>
        )}

        {/* Type badge */}
        <DocumentTypeBadge type={type as any} />
      </div>

      {/* Status */}
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value} className="text-xs">
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Save state */}
      <span
        className={cn(
          "shrink-0 text-xs",
          saveState === "saved" ? "text-green-600" :
          saveState === "saving" ? "text-gray-400" : "text-amber-500"
        )}
      >
        {saveState === "saved" ? t("saved") : saveState === "saving" ? t("saving") : t("unsaved")}
      </span>
    </div>
  );
}
