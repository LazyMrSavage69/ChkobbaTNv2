"use client";

import { motion } from "framer-motion";

export function Lantern({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 60 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {/* Hook */}
        <path d="M30,5 Q30,0 25,0 Q20,0 20,5" fill="none" stroke="#C9A84C" strokeWidth="2" />

        {/* Top cap */}
        <ellipse cx="30" cy="15" rx="15" ry="5" fill="#8B1A1A" stroke="#C9A84C" strokeWidth="1" />
        <rect x="20" y="15" width="20" height="5" fill="#C9A84C" />

        {/* Glass body */}
        <path d="M15,20 Q10,50 15,80 L45,80 Q50,50 45,20 Z" fill="rgba(201,168,76,0.15)" stroke="#C9A84C" strokeWidth="1.5" />

        {/* Inner glow */}
        <motion.ellipse
          cx="30"
          cy="50"
          rx="12"
          ry="20"
          fill="#F5ECD7"
          opacity={0.3}
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Flame */}
        <motion.path
          d="M30,65 Q28,55 30,50 Q32,55 30,65"
          fill="#FF4500"
          animate={{ 
            d: [
              "M30,65 Q28,55 30,50 Q32,55 30,65",
              "M30,65 Q27,54 30,48 Q33,54 30,65",
              "M30,65 Q28,55 30,50 Q32,55 30,65",
            ]
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Bottom cap */}
        <ellipse cx="30" cy="80" rx="15" ry="5" fill="#8B1A1A" stroke="#C9A84C" strokeWidth="1" />
        <rect x="20" y="80" width="20" height="5" fill="#C9A84C" />

        {/* Bottom ornament */}
        <circle cx="30" cy="90" r="5" fill="#C9A84C" />
        <circle cx="30" cy="97" r="3" fill="#C9A84C" />
      </svg>
    </div>
  );
}
