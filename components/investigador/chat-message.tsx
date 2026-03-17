"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CitationChip } from "./citation-chip";
import { ConfidenceBadge } from "./confidence-badge";
import { FollowUpPills } from "./follow-up-pills";
import { CITATION_REGEX, isLegalCitation } from "@/lib/citation-parser";
import { cn } from "@/lib/utils";
import { Copy, Check, FileText, User, Bot } from "lucide-react";

export interface ChatMessageData {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  confidence?: "ALTA" | "MEDIA" | "BAJA";
  citations?: string[];
  followUp?: string[];
  createdAt?: Date | string;
  isStreaming?: boolean;
}

interface ChatMessageProps {
  message: ChatMessageData;
  onFollowUp?: (question: string) => void;
  onExport?: (content: string) => void;
}

export function ChatMessage({ message, onFollowUp, onExport }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (message.role === "USER") {
    return (
      <div className="flex gap-3 justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-[#0C1B2A] px-4 py-3 text-white">
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200">
          <User className="h-4 w-4 text-gray-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0C1B2A]">
        <Bot className="h-4 w-4 text-[#C9A84C]" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Confidence + actions bar */}
        {!message.isStreaming && message.confidence && (
          <div className="mb-2 flex items-center gap-2">
            <ConfidenceBadge confidence={message.confidence} />
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                title="Copiar respuesta"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copiado" : "Copiar"}
              </button>
              {onExport && (
                <button
                  onClick={() => onExport(message.content)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  title="Exportar como documento"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Exportar
                </button>
              )}
            </div>
          </div>
        )}

        {/* Message content */}
        <div
          className={cn(
            "rounded-2xl rounded-tl-sm bg-white border border-gray-100 px-4 py-3 shadow-sm",
            message.isStreaming && "border-[#C9A84C]/30"
          )}
        >
          {message.isStreaming ? (
            <StreamingContent content={message.content} />
          ) : (
            <MarkdownWithCitations content={message.content} />
          )}

          {message.isStreaming && (
            <span className="inline-flex gap-0.5 ml-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9A84C] [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9A84C] [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9A84C]" />
            </span>
          )}
        </div>

        {/* Follow-up pills */}
        {!message.isStreaming && message.followUp && message.followUp.length > 0 && onFollowUp && (
          <FollowUpPills questions={message.followUp} onSelect={onFollowUp} />
        )}
      </div>
    </div>
  );
}

// Renders plain text during streaming (no markdown processing needed — just text)
function StreamingContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none text-gray-800">
      <p className="mb-0 whitespace-pre-wrap text-sm leading-7">{content}</p>
    </div>
  );
}

// Full markdown renderer with citation chip injection
function MarkdownWithCitations({ content }: { content: string }) {
  const components: React.ComponentProps<typeof ReactMarkdown>["components"] = {
    p: ({ children }) => (
      <p className="mb-3 text-sm leading-7 last:mb-0">
        {injectCitations(children)}
      </p>
    ),
    li: ({ children }) => (
      <li className="mb-1 text-sm leading-6">{injectCitations(children)}</li>
    ),
    h2: ({ children }) => (
      <h2 className="mb-2 mt-4 font-serif text-base font-semibold text-gray-900 first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-1.5 mt-3 text-sm font-semibold text-gray-800 first:mt-0">
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-3 border-l-4 border-[#C9A84C]/50 bg-[#C9A84C]/5 pl-4 pr-2 py-2 text-sm italic text-gray-700">
        {children}
      </blockquote>
    ),
    code: ({ children, className }) => {
      const isBlock = className?.startsWith("language-");
      if (isBlock) {
        return (
          <code className="block rounded-md bg-gray-50 border border-gray-200 p-3 text-xs font-mono text-gray-800 my-2">
            {children}
          </code>
        );
      }
      return (
        <code className="rounded bg-gray-100 px-1 py-0.5 text-xs font-mono text-gray-800">
          {children}
        </code>
      );
    },
    ul: ({ children }) => (
      <ul className="mb-3 ml-4 list-disc space-y-1">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-3 ml-4 list-decimal space-y-1">{children}</ol>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    hr: () => <hr className="my-3 border-gray-200" />,
  };

  return (
    <div className="prose prose-sm max-w-none text-gray-800">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Walk react-markdown children and inject CitationChip for legal citations.
 */
function injectCitations(children: React.ReactNode): React.ReactNode {
  if (typeof children === "string") {
    return splitByCitations(children);
  }
  if (Array.isArray(children)) {
    return children.map((child, i) => (
      <React.Fragment key={i}>{injectCitations(child)}</React.Fragment>
    ));
  }
  return children;
}

function splitByCitations(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  const re = new RegExp(CITATION_REGEX.source, "g");
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (!isLegalCitation(match[1])) continue;

    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }
    result.push(
      <CitationChip key={`cit-${match.index}`} citation={match[1]} />
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result.length > 0 ? result : [text];
}
