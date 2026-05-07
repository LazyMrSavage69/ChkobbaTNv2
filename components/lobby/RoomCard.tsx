"use client";

import { motion } from "framer-motion";
import { Room } from "@/types";
import { Users, Sword, Shield, Hash } from "lucide-react";

interface RoomCardProps {
  room: Room;
  index: number;
  onJoin: () => void;
}

export function RoomCard({ room, index, onJoin }: RoomCardProps) {
  const playersCount = (room as any).players_count || 0;
  const isFull = playersCount >= room.max_players;
  const is1v1 = room.mode === "1v1";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
      className="glass-card p-6 hover:border-gold/40 transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-cream group-hover:text-gold transition-colors mb-1">
            {room.name}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
              is1v1 ? "bg-red-deep/30 text-red-300" : "bg-green-dark/30 text-green-300"
            }`}>
              {is1v1 ? <Sword size={14} /> : <Shield size={14} />}
              {room.mode}
            </span>
            <span className="text-cream/40 text-sm">
              {isFull ? "Full" : "Open"}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="join-code text-sm py-2 px-4">
            <Hash size={14} className="inline mr-1" />
            {room.join_code || "------"}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 text-cream/60">
          <div className="flex items-center gap-1.5">
            <Users size={18} />
            <span className="text-base font-medium">
              {playersCount}/{room.max_players}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex -space-x-2">
              {Array.from({ length: Math.min(playersCount, 4) }).map((_, i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-red-deep border-2 border-brown-dark flex items-center justify-center">
                  <span className="text-cream text-xs font-bold">{String.fromCharCode(65 + i)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onJoin}
        disabled={isFull}
        className="w-full tunisian-btn flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-base"
      >
        <span>{isFull ? "Room Full" : "Join Room"}</span>
        {!isFull && <Users size={18} />}
      </motion.button>
    </motion.div>
  );
}
