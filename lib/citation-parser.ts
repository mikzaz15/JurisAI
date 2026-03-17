// Known Mexican legal abbreviations used in citations
const LEGAL_ABBREVS = [
  "CCF", "CPEUM", "LFT", "CFF", "LISR", "LIVA", "LGSM", "LA", "CNPP",
  "CCo", "CPF", "CFPC", "CCCDMX", "LFPC", "LGS", "LFPDPPP", "SCJN",
  "T-MEC", "USMCA", "NOM-", "DOF", "IMSS", "SAT", "STPS", "COFEPRIS",
  "CNBV", "CONDUSEF", "PROFECO", "INFONAVIT", "CONSAR",
];

const LEGAL_PREFIXES = [
  "Art.", "Artículo", "Jurisprudencia", "Tesis", "Fracción", "Transitorio",
];

/** Regex that matches bracketed legal citations */
export const CITATION_REGEX =
  /\[([^\[\]\n]{3,120})\]/g;

export interface ParsedCitation {
  raw: string;        // Full match including brackets: "[Art. 1916 CCF]"
  text: string;       // Inner text: "Art. 1916 CCF"
  isLegal: boolean;   // Whether it matches known legal patterns
}

/** Returns true if the bracket content looks like a legal citation */
export function isLegalCitation(text: string): boolean {
  return (
    LEGAL_ABBREVS.some((abbrev) => text.includes(abbrev)) ||
    LEGAL_PREFIXES.some((prefix) => text.startsWith(prefix))
  );
}

/** Extract all citation strings from a block of text */
export function extractCitations(text: string): string[] {
  const citations: string[] = [];
  const regex = new RegExp(CITATION_REGEX.source, "g");
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (isLegalCitation(match[1])) {
      citations.push(match[1]);
    }
  }
  return Array.from(new Set(citations)); // deduplicate
}

export interface ParsedResponse {
  /** The clean markdown content to display (metadata block stripped) */
  content: string;
  /** ALTA | MEDIA | BAJA */
  confidence: "ALTA" | "MEDIA" | "BAJA";
  /** Extracted follow-up questions */
  followUp: string[];
  /** All legal citations found in the content */
  citations: string[];
}

/**
 * Parse the full AI response into structured data.
 * Splits on the mandatory trailing "---\nCONFIANZA:" block.
 */
export function parseAIResponse(raw: string): ParsedResponse {
  const separator = "\n---\n";
  const sepIndex = raw.lastIndexOf(separator);

  let content = raw;
  let metaBlock = "";

  if (sepIndex !== -1) {
    content = raw.slice(0, sepIndex).trim();
    metaBlock = raw.slice(sepIndex + separator.length).trim();
  }

  // Parse confidence
  let confidence: ParsedResponse["confidence"] = "MEDIA";
  const confMatch = metaBlock.match(/CONFIANZA:\s*(ALTA|MEDIA|BAJA)/i);
  if (confMatch) {
    confidence = confMatch[1].toUpperCase() as ParsedResponse["confidence"];
  }

  // Parse follow-up questions
  const followUp: string[] = [];
  const fqSection = metaBlock.match(/PREGUNTAS_SUGERIDAS:\n([\s\S]+)/i);
  if (fqSection) {
    const lines = fqSection[1].split("\n");
    for (const line of lines) {
      const m = line.match(/^\d+\.\s+(.+)/);
      if (m) followUp.push(m[1].trim());
    }
  }

  const citations = extractCitations(content);

  return { content, confidence, followUp, citations };
}

/**
 * Group sessions by relative date for sidebar display.
 */
export function groupByDate<T extends { createdAt: Date | string }>(
  items: T[]
): { label: string; items: T[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const groups: { label: string; items: T[] }[] = [
    { label: "Hoy", items: [] },
    { label: "Ayer", items: [] },
    { label: "Esta semana", items: [] },
    { label: "Este mes", items: [] },
    { label: "Más antiguo", items: [] },
  ];

  for (const item of items) {
    const d = new Date(item.createdAt);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (day >= today) groups[0].items.push(item);
    else if (day >= yesterday) groups[1].items.push(item);
    else if (day >= weekAgo) groups[2].items.push(item);
    else if (day >= monthAgo) groups[3].items.push(item);
    else groups[4].items.push(item);
  }

  return groups.filter((g) => g.items.length > 0);
}
