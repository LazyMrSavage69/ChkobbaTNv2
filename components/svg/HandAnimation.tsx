"use client";

import { motion } from "framer-motion";

interface HandAnimationProps {
  position: "bottom" | "left" | "right" | "top";
  isPlaying: boolean;
  onComplete?: () => void;
}

export function HandAnimation({ position, isPlaying, onComplete }: HandAnimationProps) {
  const getInitialPosition = () => {
    switch (position) {
      case "bottom": return { x: 0, y: 200, opacity: 0 };
      case "left": return { x: -200, y: 0, opacity: 0 };
      case "right": return { x: 200, y: 0, opacity: 0 };
      case "top": return { x: 0, y: -200, opacity: 0 };
    }
  };

  const getFinalPosition = () => {
    switch (position) {
      case "bottom": return { x: 0, y: 0, opacity: 1 };
      case "left": return { x: 0, y: 0, opacity: 1 };
      case "right": return { x: 0, y: 0, opacity: 1 };
      case "top": return { x: 0, y: 0, opacity: 1 };
    }
  };

  const getRotation = () => {
    switch (position) {
      case "bottom": return 0;
      case "left": return 90;
      case "right": return -90;
      case "top": return 180;
    }
  };

  return (
    <motion.div
      className="absolute pointer-events-none z-50"
      style={{ 
        width: 80, 
        height: 80,
        ...(position === "bottom" && { bottom: "10%", left: "50%", marginLeft: -40 }),
        ...(position === "left" && { left: "10%", top: "50%", marginTop: -40 }),
        ...(position === "right" && { right: "10%", top: "50%", marginTop: -40 }),
        ...(position === "top" && { top: "10%", left: "50%", marginLeft: -40 }),
      }}
      initial={getInitialPosition()}
      animate={isPlaying ? getFinalPosition() : getInitialPosition()}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      onAnimationComplete={onComplete}
    >
      <svg viewBox="0 0 80 80" className="w-full h-full" style={{ transform: `rotate(${getRotation()}deg)` }}>
        {/* Hand silhouette */}
        <path
          d="M20,60 Q15,50 20,40 Q18,30 25,25 Q30,20 35,25 Q40,20 45,25 Q50,20 55,25 Q60,30 58,40 Q65,50 60,60 Z"
          fill="#D4A574"
          stroke="#8B6914"
          strokeWidth="1"
        />
        {/* Fingers */}
        <ellipse cx="28" cy="22" rx="4" ry="8" fill="#D4A574" stroke="#8B6914" strokeWidth="0.5" />
        <ellipse cx="38" cy="18" rx="4" ry="9" fill="#D4A574" stroke="#8B6914" strokeWidth="0.5" />
        <ellipse cx="48" cy="20" rx="4" ry="8" fill="#D4A574" stroke="#8B6914" strokeWidth="0.5" />
        <ellipse cx="56" cy="28" rx="3" ry="6" fill="#D4A574" stroke="#8B6914" strokeWidth="0.5" />
        {/* Card being held */}
        <rect x="30" y="10" width="20" height="30" rx="2" fill="#F5ECD7" stroke="#C9A84C" strokeWidth="1" transform="rotate(-15 40 25)" />
      </svg>
    </motion.div>
  );
}
