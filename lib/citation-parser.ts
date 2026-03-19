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

const SECTION_LABELS = {
  conclusion: "Conclusión",
  legalBasis: "Fundamento legal",
  practical: "Implicaciones prácticas",
  risks: "Riesgos o matices",
} as const;

const SECTION_ALIASES: Array<{
  label: (typeof SECTION_LABELS)[keyof typeof SECTION_LABELS];
  pattern: RegExp;
}> = [
  {
    label: SECTION_LABELS.conclusion,
    pattern: /^(conclusi[oó]n|respuesta breve|respuesta corta|respuesta directa|s[ií]ntesis|criterio principal)$/i,
  },
  {
    label: SECTION_LABELS.legalBasis,
    pattern: /^(fundamento legal|fundamento jur[ií]dico|base legal|marco normativo|sustento legal|sustento normativo|criterio jurisprudencial|fuentes aplicables)$/i,
  },
  {
    label: SECTION_LABELS.practical,
    pattern: /^(implicaciones pr[aá]cticas|aplicaci[oó]n pr[aá]ctica|efectos pr[aá]cticos|consideraciones pr[aá]cticas|en la pr[aá]ctica)$/i,
  },
  {
    label: SECTION_LABELS.risks,
    pattern: /^(riesgos? o matices|riesgos?|matices|advertencias|limitaciones|salvedades|puntos de atenci[oó]n|observaciones)$/i,
  },
];

function normalizeInvestigadorContent(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return trimmed;

  const withCanonicalHeadings = canonicalizeHeadings(trimmed);
  if (hasStructuredSections(withCanonicalHeadings)) {
    return withCanonicalHeadings;
  }

  const blocks = withCanonicalHeadings
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!shouldAutoStructure(withCanonicalHeadings, blocks)) {
    return withCanonicalHeadings;
  }

  const [firstBlock, ...remainingBlocks] = blocks;
  const foundation: string[] = [];
  const practical: string[] = [];
  const risks: string[] = [];

  for (const block of remainingBlocks) {
    if (looksLikeRiskBlock(block)) {
      risks.push(block);
    } else if (looksLikeLegalBasisBlock(block)) {
      foundation.push(block);
    } else {
      practical.push(block);
    }
  }

  const sections = [`## ${SECTION_LABELS.conclusion}\n${firstBlock}`];

  if (foundation.length) {
    sections.push(`## ${SECTION_LABELS.legalBasis}\n${foundation.join("\n\n")}`);
  }
  if (practical.length) {
    sections.push(`## ${SECTION_LABELS.practical}\n${practical.join("\n\n")}`);
  }
  if (risks.length) {
    sections.push(`## ${SECTION_LABELS.risks}\n${risks.join("\n\n")}`);
  }

  return sections.join("\n\n");
}

function canonicalizeHeadings(content: string): string {
  return content
    .split("\n")
    .map((line) => {
      const headingMatch = line.match(/^(#{2,3}\s+|\*\*)(.+?)(\*\*)?:?\s*$/);
      if (!headingMatch) return line;

      const rawHeading = headingMatch[2]
        .replace(/\*\*/g, "")
        .replace(/:+$/, "")
        .trim();

      for (const alias of SECTION_ALIASES) {
        if (alias.pattern.test(rawHeading)) {
          return `## ${alias.label}`;
        }
      }

      return line;
    })
    .join("\n");
}

function hasStructuredSections(content: string): boolean {
  return /(^|\n)##\s+(Conclusión|Fundamento legal|Implicaciones prácticas|Riesgos o matices)\s*$/m.test(
    content
  );
}

function shouldAutoStructure(content: string, blocks: string[]): boolean {
  return blocks.length >= 2 && (content.length >= 280 || blocks.length >= 3);
}

function looksLikeLegalBasisBlock(block: string): boolean {
  return (
    new RegExp(CITATION_REGEX.source, "i").test(block) ||
    /\b(art\.?|artículo|jurisprudencia|tesis|código|ley|constituci[oó]n|reglamento|nom|dof|scjn|tribunal|lft|ccf|cff|lisr|liva|lgsm)\b/i.test(
      block
    )
  );
}

function looksLikeRiskBlock(block: string): boolean {
  return /\b(riesgo|matiz|salvedad|salvo|excepto|sin embargo|advertencia|limitaci[oó]n|incertidumbre|controvertido|puede variar|depende|conflicto de criterios?)\b/i.test(
    block
  );
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

  content = normalizeInvestigadorContent(content);

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
