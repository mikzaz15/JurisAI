"use client";

import { ArrowRight } from "lucide-react";

interface FollowUpPillsProps {
  questions: string[];
  onSelect: (question: string) => void;
}

export function FollowUpPills({ questions, onSelect }: FollowUpPillsProps) {
  if (!questions.length) return null;

  return (
    <div className="mt-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
        Siguientes preguntas sugeridas
      </p>
      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => (
          <button
            key={i}
            onClick={() => onSelect(q)}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition-all hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/5 hover:text-[#8a6e2a]"
          >
            <ArrowRight className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1 text-left">{q}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
