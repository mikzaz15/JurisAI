/**
 * JurisAI SVG logo — dark background version.
 * Scales icon on the left, "Juris" in DM Serif Display (white),
 * gold vertical bar, "AI" in Plus Jakarta Sans 600 (gold).
 *
 * Usage:
 *   <JurisAILogo />                — default (md)
 *   <JurisAILogo size="sm" />      — compact (sidebar)
 *   <JurisAILogo size="lg" />      — hero / landing
 *   <JurisAILogo collapsed />      — scales icon only (collapsed sidebar)
 */

interface JurisAILogoProps {
  size?: "sm" | "md" | "lg";
  collapsed?: boolean;
  className?: string;
}

// Heights for the full wordmark (aspect ratio 240:50 = 4.8:1)
const heights: Record<string, number> = { sm: 28, md: 36, lg: 44 };

// The gold scales icon in isolation (viewBox spans x 3–41, y 0.5–49)
export function JurisAILogoIcon({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="3 0 41 50"
      xmlns="http://www.w3.org/2000/svg"
      height={size}
      width={size}
      className={className}
      aria-hidden="true"
    >
      <line x1="22" y1="8" x2="22" y2="42" stroke="#C9A84C" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="10" y1="16" x2="34" y2="16" stroke="#C9A84C" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="10" cy="32" r="7" fill="none" stroke="#C9A84C" strokeWidth="1.4" />
      <circle cx="34" cy="26" r="7" fill="none" stroke="#C9A84C" strokeWidth="1.4" />
      <circle cx="22" cy="8" r="3.5" fill="#C9A84C" />
    </svg>
  );
}

export function JurisAILogo({ size = "md", collapsed = false, className }: JurisAILogoProps) {
  if (collapsed) {
    return <JurisAILogoIcon size={heights[size]} className={className} />;
  }

  const h = heights[size];
  const w = Math.round(h * 4.8);

  return (
    <svg
      viewBox="0 0 240 50"
      xmlns="http://www.w3.org/2000/svg"
      height={h}
      width={w}
      className={className}
      aria-label="JurisAI"
      role="img"
    >
      {/* Scales of justice icon */}
      <line x1="22" y1="8" x2="22" y2="42" stroke="#C9A84C" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="10" y1="16" x2="34" y2="16" stroke="#C9A84C" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="10" cy="32" r="7" fill="none" stroke="#C9A84C" strokeWidth="1.4" />
      <circle cx="34" cy="26" r="7" fill="none" stroke="#C9A84C" strokeWidth="1.4" />
      <circle cx="22" cy="8" r="3.5" fill="#C9A84C" />
      {/* Juris — DM Serif Display, white */}
      <text fontFamily="DM Serif Display, serif" fontSize="28" fill="#FFFFFF" x="50" y="35" letterSpacing="0.5">
        Juris
      </text>
      {/* Gold vertical separator */}
      <rect x="120" y="12" width="2.5" height="28" rx="1.25" fill="#C9A84C" />
      {/* AI — Plus Jakarta Sans 600, gold */}
      <text fontFamily="Plus Jakarta Sans, sans-serif" fontSize="28" fontWeight="600" fill="#C9A84C" x="132" y="35" letterSpacing="0.5">
        AI
      </text>
    </svg>
  );
}
