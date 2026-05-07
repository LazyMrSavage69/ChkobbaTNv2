"use client";

import { motion } from "framer-motion";
import { Player } from "@/types";
import { Cigarette } from "@/components/svg/Cigarette";

interface PlayerAvatarProps {
  player: Player;
  isCurrentTurn: boolean;
  isCurrentUser: boolean;
  position: string;
  showTeam?: boolean;
}

export function PlayerAvatar({ player, isCurrentTurn, isCurrentUser, position, showTeam }: PlayerAvatarProps) {
  return (
    <div className={`flex flex-col items-center mb-2 ${position === "left" || position === "right" ? "flex-row gap-3" : ""}`}>
      <div className="relative">
        <motion.div
          animate={isCurrentTurn ? {
            boxShadow: [
              "0 0 8px rgba(201, 168, 76, 0.4)",
              "0 0 25px rgba(201, 168, 76, 0.7)",
              "0 0 8px rgba(201, 168, 76, 0.4)",
            ]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-red-deep to-red-900 border-2 ${
            isCurrentTurn ? "border-gold" : "border-cream/20"
          } flex items-center justify-center relative`}
        >
          <span className="text-cream font-bold text-lg sm:text-xl">
            {player.username?.charAt(0).toUpperCase() || "?"}
          </span>

          {showTeam && player.team && (
            <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              player.team === 1 ? "bg-gold text-brown-dark" : "bg-red-500 text-cream"
            }`}>
              {player.team}
            </div>
          )}
        </motion.div>

        {player.has_cigarette && (
          <div className="absolute -top-1 -right-1 w-5 h-7 sm:w-6 sm:h-8">
            <Cigarette />
          </div>
        )}

        {isCurrentUser && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gold rounded-full border-2 border-brown-dark" />
        )}
      </div>

      <div className="text-center mt-1">
        <span className="text-cream text-sm sm:text-base font-medium block">{player.username}</span>
        {isCurrentTurn && (
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-gold text-xs sm:text-sm"
          >
            Playing...
          </motion.span>
        )}
      </div>
    </div>
  );
}
