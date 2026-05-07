"use client";

import { motion } from "framer-motion";

export function Cigarette({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 40 60" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {/* Cigarette body */}
        <rect x="15" y="10" width="8" height="35" rx="2" fill="#F5ECD7" stroke="#C9A84C" strokeWidth="0.5" />

        {/* Filter */}
        <rect x="15" y="40" width="8" height="8" rx="1" fill="#C9A84C" opacity="0.6" />

        {/* Burning tip */}
        <ellipse cx="19" cy="10" rx="4" ry="3" fill="#8B1A1A" />
        <ellipse cx="19" cy="9" rx="2" ry="1.5" fill="#FF4500" />

        {/* Glow */}
        <circle cx="19" cy="9" r="6" fill="#FF4500" opacity="0.2">
          <animate attributeName="opacity" values="0.2;0.4;0.2" dur="2s" repeatCount="indefinite" />
        </circle>

        {/* Smoke particles */}
        {[0, 1, 2].map((i) => (
          <motion.path
            key={i}
            d="M19,6 Q22,0 19,-5 Q16,-10 19,-15"
            fill="none"
            stroke="#F5ECD7"
            strokeWidth="1"
            opacity={0.3}
            initial={{ pathLength: 0, opacity: 0.3 }}
            animate={{
              pathLength: [0, 1],
              opacity: [0.3, 0],
              y: [-5, -25],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeOut",
            }}
          />
        ))}
      </svg>
    </div>
  );
}
