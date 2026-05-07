"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GameTable } from "@/components/game/GameTable";
import { Player, Card, Room } from "@/types";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Users, Hash, Sword, Shield } from "lucide-react";

export default function GamePage() {
  const { roomId } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [gameState, setGameState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [supportsRoomPlayersIsReady, setSupportsRoomPlayersIsReady] = useState(true);

  useEffect(() => {
    setMounted(true);

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      await detectRoomPlayersSchema();
      await fetchRoomData();
      await fetchGameState();
      setLoading(false);
    };

    init();

    const channel = supabase
      .channel(`room_${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` },
        () => fetchRoomData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_states", filter: `room_id=eq.${roomId}` },
        () => fetchGameState()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        () => fetchRoomData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const detectRoomPlayersSchema = async () => {
    try {
      const { error } = await supabase
        .from("room_players")
        .select("id, is_ready")
        .limit(1);

      if (!error) {
        setSupportsRoomPlayersIsReady(true);
        return;
      }

      const msg = `${error.message || ""} ${error.details || ""}`.toLowerCase();
      setSupportsRoomPlayersIsReady(!msg.includes("is_ready"));
    } catch {
      // Keep default on transient errors.
    }
  };

  const fetchRoomData = async () => {
    try {
      const { data: roomData } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomData) {
        setRoom(roomData);
        const { data: { user } } = await supabase.auth.getUser();
        if (user && roomData.host_id === user.id) setIsHost(true);
      }

      const { data: playersData } = await supabase
        .from("room_players")
        .select("*")
        .eq("room_id", roomId)
        .order("seat", { ascending: true });

      if (playersData) {
        const userIds = [...new Set(playersData.map((player) => player.user_id))];
        const { data: profilesData } = userIds.length
          ? await supabase
              .from("profiles")
              .select("id, username, avatar_url, has_cigarette")
              .in("id", userIds)
          : { data: [] };

        const profilesById = new Map(
          (profilesData || []).map((profile) => [profile.id, profile])
        );

        const formattedPlayers: Player[] = playersData.map((rp: any) => ({
          id: rp.user_id,
          username: profilesById.get(rp.user_id)?.username || "Player",
          avatar_url: profilesById.get(rp.user_id)?.avatar_url,
          seat: rp.seat,
          hand: [],
          is_ready: supportsRoomPlayersIsReady ? !!rp.is_ready : false,
          has_cigarette: profilesById.get(rp.user_id)?.has_cigarette || false,
          team: rp.team,
        }));
        setPlayers(formattedPlayers);

        const { data: { user } } = await supabase.auth.getUser();
        const currentPlayer = playersData.find((p: any) => p.user_id === user?.id);
        if (currentPlayer) setIsReady(currentPlayer.is_ready);
      }
    } catch (err) {
      console.error("Error fetching room data:", err);
    }
  };

  const fetchGameState = async () => {
    try {
      const { data } = await supabase
        .from("game_states")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setGameState(data.state_json);
      }
    } catch (err) {
      // No game state yet
    }
  };

  const toggleReady = async () => {
    try {
      if (!supportsRoomPlayersIsReady) {
        alert("Ready state is disabled: 'is_ready' column is missing in Supabase schema.");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("room_players")
        .update({ is_ready: !isReady })
        .eq("room_id", roomId)
        .eq("user_id", user.id);

      if (error) throw error;

      setIsReady(!isReady);
    } catch (err) {
      console.error("Error toggling ready:", err);
    }
  };

  const startGame = async () => {
    try {
      const response = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start game");
      }

      const result = await response.json();
      setGameState(result.gameState.state_json);
    } catch (err: any) {
      alert(err.message || "Failed to start game");
    }
  };

  const playCard = async (card: Card) => {
    try {
      const response = await fetch("/api/game/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, card }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to play card");
      }

      const result = await response.json();
      setGameState(result.state);
    } catch (err: any) {
      alert(err.message || "Failed to play card");
    }
  };

  const leaveRoom = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("room_players")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", user.id);

      router.push("/lobby");
    } catch (err) {
      console.error("Error leaving room:", err);
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-brown-dark flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-14 h-14 border-4 border-gold border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brown-dark flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-14 h-14 border-4 border-gold border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const is1v1 = room?.mode === "1v1";
  const requiredPlayers = is1v1 ? 2 : 4;

  if (!gameState || gameState.phase === "waiting") {
    return (
      <div className="min-h-screen zellige-bg">
        <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <button
              onClick={leaveRoom}
              className="flex items-center text-cream hover:text-gold transition-colors text-lg"
            >
              <ArrowLeft size={22} className="mr-2" />
              Back to Lobby
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold text-gold">{room?.name}</h1>
            <div className="flex items-center gap-3 text-cream/60">
              <div className="join-code text-sm py-2 px-4">
                <Hash size={14} className="inline mr-1" />
                {room?.join_code || "------"}
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={20} />
                <span className="text-lg">{players.length}/{requiredPlayers}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 sm:p-8">
            <div className="flex items-center justify-center gap-3 mb-8">
              {is1v1 ? <Sword size={28} className="text-red-400" /> : <Shield size={28} className="text-green-400" />}
              <h2 className="text-2xl sm:text-3xl font-bold text-gold">
                Waiting Room — {room?.mode}
              </h2>
            </div>

            <div className="space-y-3 mb-8">
              {players.map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 sm:p-5 bg-cream/5 rounded-xl border border-gold/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-deep to-red-900 border border-gold/40 flex items-center justify-center">
                      <span className="text-cream font-bold text-lg">
                        {player.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-cream font-semibold text-lg block">{player.username}</span>
                      {player.team && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          player.team === 1 ? "bg-gold/20 text-gold" : "bg-red-500/20 text-red-300"
                        }`}>
                          Team {player.team}
                        </span>
                      )}
                    </div>
                    {player.id === room?.host_id && (
                      <span className="text-xs bg-gold/20 text-gold px-3 py-1 rounded-full font-medium">Host</span>
                    )}
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                    player.is_ready ? "bg-green-dark/30 text-green-400 border border-green-500/30" : "bg-red-deep/20 text-red-400 border border-red-500/20"
                  }`}>
                    {player.is_ready ? "Ready ✓" : "Not Ready"}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleReady}
                className={`flex-1 py-4 px-6 rounded-2xl font-semibold text-lg transition-all ${
                  isReady
                    ? "bg-red-deep/20 border-2 border-red-500/40 text-red-400"
                    : "bg-green-dark/20 border-2 border-green-500/40 text-green-400"
                }`}
              >
                {isReady ? "Cancel Ready" : "I'm Ready"}
              </motion.button>

              {isHost && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startGame}
                  disabled={players.length < requiredPlayers || !players.every((p) => p.is_ready)}
                  className="flex-1 tunisian-btn flex items-center justify-center gap-3 disabled:opacity-40 text-lg"
                >
                  <Play size={22} />
                  <span>Start Game</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <GameTable
      roomId={roomId as string}
      players={gameState?.players || players}
      currentUserId={currentUserId}
      gameState={gameState}
      onPlayCard={playCard}
    />
  );
}
