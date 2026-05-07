"use client";

import { motion } from "framer-motion";
import { Card, Player } from "@/types";
import { PlayingCard } from "./PlayingCard";

interface PlayerHandProps {
  player: Player;
  isCurrentUser: boolean;
  isCurrentTurn: boolean;
  position: string;
  onPlayCard: (card: Card) => void;
  onDragCard?: (card: Card) => void;
  onDragEndCard?: () => void;
  isMobile?: boolean;
}

export function PlayerHand({ player, isCurrentUser, isCurrentTurn, position, onPlayCard, onDragCard, onDragEndCard, isMobile }: PlayerHandProps) {
  const isHorizontal = position === "bottom" || position === "top";

  if (isCurrentUser) {
    return (
      <motion.div 
        className={`flex ${isHorizontal ? "flex-row" : "flex-col"} gap-1 sm:gap-2 justify-center`}
        layout
      >
        {player.hand?.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <PlayingCard
              card={card}
              onClick={() => onPlayCard(card)}
              onDragStart={(draggedCard) => onDragCard?.(draggedCard)}
              onDragEnd={onDragEndCard}
              disabled={!isCurrentTurn}
              size={isMobile ? "sm" : "md"}
            />
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <div className={`flex ${isHorizontal ? "flex-row" : "flex-col"} gap-1 sm:gap-2 justify-center`}>
      {Array.from({ length: player.hand?.length || 0 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.03 }}
        >
          <PlayingCard faceDown size={isMobile ? "sm" : "md"} />
        </motion.div>
      ))}
    </div>
  );
}
