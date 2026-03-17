"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isStreaming,
  disabled = false,
  placeholder = "Escribe tu consulta legal...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  const canSend = value.trim().length > 0 && !isStreaming && !disabled;

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div
        className={cn(
          "flex items-end gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm transition-all",
          "focus-within:border-[#C9A84C]/60 focus-within:ring-2 focus-within:ring-[#C9A84C]/20",
          disabled && "opacity-60"
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isStreaming}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed"
          style={{ maxHeight: "200px" }}
        />

        <button
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
            canSend
              ? "bg-[#C9A84C] text-white hover:bg-[#b8943d]"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}
          title="Enviar consulta (Enter)"
        >
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
      <p className="mt-1.5 text-center text-xs text-gray-400">
        JurisAI puede cometer errores. Verifica siempre la vigencia de las fuentes citadas.
        <span className="ml-1 opacity-60">Enter para enviar · Shift+Enter para nueva línea</span>
      </p>
    </div>
  );
}
