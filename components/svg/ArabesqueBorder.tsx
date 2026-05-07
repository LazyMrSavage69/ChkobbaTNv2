"use client";

export function ArabesqueBorder({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Top border */}
      <svg className="absolute -top-3 left-0 w-full h-6" preserveAspectRatio="none">
        <defs>
          <pattern id="arabesque-top" x="0" y="0" width="40" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M0,12 Q10,0 20,12 Q30,24 40,12"
              fill="none"
              stroke="#C9A84C"
              strokeWidth="1.5"
            />
            <circle cx="20" cy="12" r="3" fill="#C9A84C" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#arabesque-top)" />
      </svg>

      {/* Bottom border */}
      <svg className="absolute -bottom-3 left-0 w-full h-6" preserveAspectRatio="none">
        <defs>
          <pattern id="arabesque-bottom" x="0" y="0" width="40" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M0,12 Q10,24 20,12 Q30,0 40,12"
              fill="none"
              stroke="#C9A84C"
              strokeWidth="1.5"
            />
            <circle cx="20" cy="12" r="3" fill="#C9A84C" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#arabesque-bottom)" />
      </svg>

      {/* Left border */}
      <svg className="absolute top-0 -left-3 w-6 h-full" preserveAspectRatio="none">
        <defs>
          <pattern id="arabesque-left" x="0" y="0" width="24" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M12,0 Q0,10 12,20 Q24,30 12,40"
              fill="none"
              stroke="#C9A84C"
              strokeWidth="1.5"
            />
            <circle cx="12" cy="20" r="3" fill="#C9A84C" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#arabesque-left)" />
      </svg>

      {/* Right border */}
      <svg className="absolute top-0 -right-3 w-6 h-full" preserveAspectRatio="none">
        <defs>
          <pattern id="arabesque-right" x="0" y="0" width="24" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M12,0 Q24,10 12,20 Q0,30 12,40"
              fill="none"
              stroke="#C9A84C"
              strokeWidth="1.5"
            />
            <circle cx="12" cy="20" r="3" fill="#C9A84C" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#arabesque-right)" />
      </svg>

      {/* Corner decorations */}
      <div className="absolute -top-4 -left-4 w-8 h-8">
        <svg viewBox="0 0 32 32" className="w-full h-full">
          <path d="M0,16 Q8,0 16,0 Q24,0 32,16" fill="none" stroke="#C9A84C" strokeWidth="2" />
          <circle cx="16" cy="8" r="4" fill="#C9A84C" />
        </svg>
      </div>
      <div className="absolute -top-4 -right-4 w-8 h-8 rotate-90">
        <svg viewBox="0 0 32 32" className="w-full h-full">
          <path d="M0,16 Q8,0 16,0 Q24,0 32,16" fill="none" stroke="#C9A84C" strokeWidth="2" />
          <circle cx="16" cy="8" r="4" fill="#C9A84C" />
        </svg>
      </div>
      <div className="absolute -bottom-4 -left-4 w-8 h-8 -rotate-90">
        <svg viewBox="0 0 32 32" className="w-full h-full">
          <path d="M0,16 Q8,0 16,0 Q24,0 32,16" fill="none" stroke="#C9A84C" strokeWidth="2" />
          <circle cx="16" cy="8" r="4" fill="#C9A84C" />
        </svg>
      </div>
      <div className="absolute -bottom-4 -right-4 w-8 h-8 rotate-180">
        <svg viewBox="0 0 32 32" className="w-full h-full">
          <path d="M0,16 Q8,0 16,0 Q24,0 32,16" fill="none" stroke="#C9A84C" strokeWidth="2" />
          <circle cx="16" cy="8" r="4" fill="#C9A84C" />
        </svg>
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
