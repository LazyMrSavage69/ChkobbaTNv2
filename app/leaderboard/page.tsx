"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/ui/Navbar";
import { LeaderboardRow } from "@/components/leaderboard/LeaderboardRow";
import { LeaderboardEntry } from "@/types";
import { Trophy, TrendingUp } from "lucide-react";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("leaderboard")
        .select(`
          *,
          profiles(username, avatar_url, wins, losses)
        `)
        .order("score", { ascending: false })
        .limit(50);

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen zellige-bg">
      <Navbar />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-block mb-5"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold/50 flex items-center justify-center mx-auto">
              <Trophy size={40} className="text-gold" />
            </div>
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gold tracking-tight">Leaderboard</h1>
          <p className="text-cream/50 mt-3 text-lg">Top players ranked by score</p>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gold/30 bg-gold/5">
                  <th className="px-6 py-5 text-left text-gold font-bold text-base">Rank</th>
                  <th className="px-6 py-5 text-left text-gold font-bold text-base">Player</th>
                  <th className="px-6 py-5 text-center text-gold font-bold text-base">Wins</th>
                  <th className="px-6 py-5 text-center text-gold font-bold text-base">Losses</th>
                  <th className="px-6 py-5 text-right text-gold font-bold text-base">Score</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full mx-auto"
                      />
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-cream/40 text-lg">
                      <TrendingUp size={48} className="mx-auto mb-4 text-gold/20" />
                      No entries yet. Be the first to play!
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, index) => (
                    <LeaderboardRow key={entry.id} entry={entry} index={index} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
