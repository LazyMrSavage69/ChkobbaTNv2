"use client";

export function CardBack({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 120" className={`w-full h-full ${className}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="arabesque-card" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M10,0 Q15,5 10,10 Q5,15 10,20" fill="none" stroke="#C9A84C" strokeWidth="0.8" />
          <path d="M0,10 Q5,5 10,10 Q15,15 20,10" fill="none" stroke="#C9A84C" strokeWidth="0.8" />
          <circle cx="10" cy="10" r="2" fill="#C9A84C" opacity="0.5" />
        </pattern>
      </defs>

      {/* Card background */}
      <rect x="2" y="2" width="76" height="116" rx="6" fill="#8B1A1A" stroke="#C9A84C" strokeWidth="2" />
      <rect x="6" y="6" width="68" height="108" rx="4" fill="url(#arabesque-card)" />

      {/* Center medallion */}
      <circle cx="40" cy="60" r="15" fill="#2C1810" stroke="#C9A84C" strokeWidth="1.5" />
      <path d="M40,48 L44,56 L52,56 L46,62 L48,70 L40,65 L32,70 L34,62 L28,56 L36,56 Z" fill="#C9A84C" />

      {/* Corner ornaments */}
      <circle cx="12" cy="12" r="4" fill="#C9A84C" opacity="0.6" />
      <circle cx="68" cy="12" r="4" fill="#C9A84C" opacity="0.6" />
      <circle cx="12" cy="108" r="4" fill="#C9A84C" opacity="0.6" />
      <circle cx="68" cy="108" r="4" fill="#C9A84C" opacity="0.6" />
    </svg>
  );
}
