"use client";

import { motion } from "framer-motion";
import type { DragEvent } from "react";
import { Card } from "@/types";
import { CardBack } from "@/components/svg/CardBack";
import { getSuitSymbol, getCardDisplayValue } from "@/lib/game-engine/deck";

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  onClick?: () => void;
  onDragStart?: (card: Card) => void;
  onDragEnd?: () => void;
  disabled?: boolean;
  className?: string;
  animate?: boolean;
  size?: "sm" | "md" | "lg";
}

export function PlayingCard({
  card,
  faceDown = false,
  onClick,
  onDragStart,
  onDragEnd,
  disabled = false,
  className = "",
  animate = false,
  size = "md",
}: PlayingCardProps) {
  const suitColors: Record<string, string> = {
    coupe: "text-red-500",
    carreau: "text-red-500",
    trefle: "text-gray-900",
    pique: "text-gray-900",
  };

  const sizeClasses = {
    sm: "w-12 h-18 sm:w-14 sm:h-20",
    md: "w-14 h-20 sm:w-18 sm:h-26 md:w-22 md:h-32",
    lg: "w-18 h-26 sm:w-22 sm:h-32 md:w-26 md:h-38",
  };

  const cardContent = faceDown || !card ? (
    <CardBack className="w-full h-full" />
  ) : (
    <div className={`w-full h-full bg-cream rounded-xl border-2 border-gold p-1.5 sm:p-2 flex flex-col justify-between relative overflow-hidden ${suitColors[card.suit]}`}>
      <div className="flex flex-col items-center">
        <span className="text-base sm:text-lg font-bold">{getCardDisplayValue(card.value)}</span>
        <span className="text-sm sm:text-base">{getSuitSymbol(card.suit)}</span>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <span className="text-2xl sm:text-3xl">{getSuitSymbol(card.suit)}</span>
          <p className="text-xs mt-0.5 font-medium text-brown-dark">{card.label_ar}</p>
        </div>
      </div>

      <div className="flex flex-col items-center rotate-180 self-end">
        <span className="text-base sm:text-lg font-bold">{getCardDisplayValue(card.value)}</span>
        <span className="text-sm sm:text-base">{getSuitSymbol(card.suit)}</span>
      </div>

      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-gold rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-gold rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-gold rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-gold rounded-br-lg" />
    </div>
  );

  return (
    <motion.div
      className={`relative ${sizeClasses[size]} cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : "card-hover"} ${className}`}
      onClick={disabled ? undefined : onClick}
      draggable={!disabled && !!card && !faceDown}
      onDragStartCapture={(e: DragEvent<HTMLDivElement>) => {
        if (!card || disabled || faceDown) return;
        e.dataTransfer.setData("application/json", JSON.stringify(card));
        onDragStart?.(card);
      }}
      onDragEnd={() => onDragEnd?.()}
      whileHover={!disabled ? { y: -10, rotateY: 8, scale: 1.08 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      animate={animate ? {
        rotateY: [0, 180, 0],
        scale: [1, 1.1, 1],
      } : {}}
      transition={{ duration: 0.5 }}
    >
      {cardContent}
    </motion.div>
  );
}
