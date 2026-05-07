"use client";

import { motion } from "framer-motion";

export function Chicha({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 120 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {/* Base/Bowl */}
        <ellipse cx="60" cy="170" rx="35" ry="15" fill="#2C1810" stroke="#C9A84C" strokeWidth="2" />
        <ellipse cx="60" cy="165" rx="30" ry="12" fill="#1A4A2E" stroke="#C9A84C" strokeWidth="1" />

        {/* Stem */}
        <rect x="55" y="80" width="10" height="85" fill="#8B1A1A" stroke="#C9A84C" strokeWidth="1" />

        {/* Stem rings */}
        <rect x="53" y="100" width="14" height="3" fill="#C9A84C" />
        <rect x="53" y="130" width="14" height="3" fill="#C9A84C" />

        {/* Hose */}
        <path d="M60,120 Q30,110 20,140 Q15,160 25,170" fill="none" stroke="#2C1810" strokeWidth="6" />
        <path d="M60,120 Q30,110 20,140 Q15,160 25,170" fill="none" stroke="#C9A84C" strokeWidth="1" />

        {/* Hose mouthpiece */}
        <rect x="20" y="165" width="8" height="12" rx="2" fill="#C9A84C" />

        {/* Top head */}
        <ellipse cx="60" cy="75" rx="20" ry="8" fill="#2C1810" stroke="#C9A84C" strokeWidth="2" />
        <ellipse cx="60" cy="72" rx="15" ry="5" fill="#1A4A2E" />

        {/* Charcoal */}
        <ellipse cx="60" cy="68" rx="8" ry="3" fill="#8B1A1A" />

        {/* Smoke particles */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.circle
            key={i}
            cx={60 + (i % 2 === 0 ? -5 : 5)}
            cy={65}
            r={3 + i}
            fill="#F5ECD7"
            opacity={0.3 - i * 0.05}
            initial={{ y: 0, opacity: 0.4 }}
            animate={{
              y: [-10 - i * 15, -40 - i * 20],
              x: [0, (i % 2 === 0 ? -10 : 10)],
              opacity: [0.4 - i * 0.08, 0],
              scale: [1, 2 + i * 0.5],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.6,
              ease: "easeOut",
            }}
          />
        ))}
      </svg>
    </div>
  );
}
