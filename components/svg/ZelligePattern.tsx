"use client";

export function ZelligePattern({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="zellige"
          x="0"
          y="0"
          width="80"
          height="80"
          patternUnits="userSpaceOnUse"
        >
          {/* Base star pattern */}
          <polygon
            points="40,5 48,28 72,28 52,42 60,65 40,52 20,65 28,42 8,28 32,28"
            fill="none"
            stroke="#C9A84C"
            strokeWidth="0.5"
            opacity="0.15"
          />
          <polygon
            points="40,10 45,25 60,25 48,35 52,50 40,42 28,50 32,35 20,25 35,25"
            fill="none"
            stroke="#8B1A1A"
            strokeWidth="0.5"
            opacity="0.1"
          />
          {/* Corner accents */}
          <circle cx="40" cy="40" r="3" fill="#C9A84C" opacity="0.1" />
          <circle cx="0" cy="0" r="2" fill="#1A4A2E" opacity="0.1" />
          <circle cx="80" cy="0" r="2" fill="#1A4A2E" opacity="0.1" />
          <circle cx="0" cy="80" r="2" fill="#1A4A2E" opacity="0.1" />
          <circle cx="80" cy="80" r="2" fill="#1A4A2E" opacity="0.1" />
          {/* Interlacing lines */}
          <path
            d="M 0,40 Q 20,20 40,40 Q 60,60 80,40"
            fill="none"
            stroke="#C9A84C"
            strokeWidth="0.5"
            opacity="0.08"
          />
          <path
            d="M 40,0 Q 20,20 40,40 Q 60,60 40,80"
            fill="none"
            stroke="#C9A84C"
            strokeWidth="0.5"
            opacity="0.08"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#zellige)" />
    </svg>
  );
}
