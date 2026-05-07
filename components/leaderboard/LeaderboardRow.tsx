"use client";

import { motion } from "framer-motion";
import { LeaderboardEntry } from "@/types";
import { Crown, Medal } from "lucide-react";

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  index: number;
}

export function LeaderboardRow({ entry, index }: LeaderboardRowProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown size={20} className="text-gold" />;
      case 2: return <Medal size={20} className="text-gray-300" />;
      case 3: return <Medal size={20} className="text-amber-600" />;
      default: return <span className="text-cream/60 text-sm">#{rank}</span>;
    }
  };

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`border-b border-gold/10 hover:bg-gold/5 transition-colors ${
        index < 3 ? "bg-gold/5" : ""
      }`}
    >
      <td className="px-6 py-4">
        <div className="flex items-center">
          {getRankIcon(entry.rank)}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-red-deep border border-gold/50 flex items-center justify-center">
            <span className="text-cream font-bold">
              {entry.profiles?.username?.charAt(0).toUpperCase() || "?"}
            </span>
          </div>
          <span className="text-cream font-medium">
            {entry.profiles?.username || "Unknown"}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-center text-green-400 font-medium">
        {entry.profiles?.wins || 0}
      </td>
      <td className="px-6 py-4 text-center text-red-400 font-medium">
        {entry.profiles?.losses || 0}
      </td>
      <td className="px-6 py-4 text-right">
        <span className="text-gold font-bold text-lg">{entry.score}</span>
      </td>
    </motion.tr>
  );
}
