"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/types";
import { PlayingCard } from "./PlayingCard";

interface CenterPileProps {
  cards: Card[];
  isDropActive?: boolean;
  onDropCard?: (card: Card) => void;
}

export function CenterPile({ cards, isDropActive = false, onDropCard }: CenterPileProps) {
  return (
    <div
      className={`absolute top-1/2 left-1/2 w-[280px] sm:w-[360px] min-h-[120px] sm:min-h-[150px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-dashed transition-colors ${
        isDropActive ? "border-gold/70 bg-gold/10" : "border-gold/25 bg-brown-dark/15"
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;
        try {
          const card = JSON.parse(raw) as Card;
          onDropCard?.(card);
        } catch {
          // Ignore invalid payload.
        }
      }}
    >
      <div className="grid grid-cols-4 gap-2 p-2 sm:p-3 place-items-center">
        <AnimatePresence>
          {cards.map((card) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <PlayingCard card={card} size="sm" className="sm:scale-110" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
