"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Player, Move } from "@/types";
import { PlayingCard } from "./PlayingCard";
import { PlayerAvatar } from "./PlayerAvatar";
import { PlayerHand } from "./PlayerHand";
import { CenterPile } from "./CenterPile";
import { Chicha } from "@/components/svg/Chicha";
import { Lantern } from "@/components/svg/Lantern";
import { HandAnimation } from "@/components/svg/HandAnimation";
import { createClient } from "@/lib/supabase/client";
import { Volume2, VolumeX } from "lucide-react";

interface GameTableProps {
  roomId: string;
  players: Player[];
  currentUserId: string;
  gameState: any;
  onPlayCard: (card: Card) => void;
}

export function GameTable({ roomId, players, currentUserId, gameState, onPlayCard }: GameTableProps) {
  const [centerPile, setCenterPile] = useState<Card[]>([]);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [handAnimation, setHandAnimation] = useState<{ position: string; active: boolean } | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [chkobbaToast, setChkobbaToast] = useState<{ playerName: string; id: number } | null>(null);
  const [prevChkobbaPoints, setPrevChkobbaPoints] = useState<Record<string, number>>({});
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Keep table cards in sync with authoritative game state.
    if (Array.isArray(gameState?.center_pile)) {
      setCenterPile(gameState.center_pile);
    }
  }, [gameState]);

  useEffect(() => {
    const current = gameState?.chkobba_points;
    if (!current || typeof current !== "object") return;

    const changedPlayerId = Object.keys(current).find((playerId) => {
      const prev = prevChkobbaPoints[playerId] || 0;
      const now = current[playerId] || 0;
      return now > prev;
    });

    if (changedPlayerId) {
      const playerName =
        (gameState?.players || players).find((p: Player) => p.id === changedPlayerId)?.username || "Player";
      setChkobbaToast({ playerName, id: Date.now() });
      setTimeout(() => setChkobbaToast(null), 1400);
    }

    setPrevChkobbaPoints(current);
  }, [gameState?.chkobba_points, gameState?.players, players, prevChkobbaPoints]);

  useEffect(() => {
    const channel = supabase
      .channel(`game_${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "moves", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const move = payload.new as Move;
          setLastMove(move);

          const playerIndex = players.findIndex((p) => p.id === move.user_id);
          const positions = ["bottom", "left", "top", "right"];
          const position = positions[playerIndex] || "bottom";

          setHandAnimation({ position, active: true });
          setTimeout(() => setHandAnimation(null), 1200);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, players, supabase]);

  const getPlayerPosition = (index: number, totalPlayers: number) => {
    if (totalPlayers === 2) {
      return ["bottom", "top"][index] || "bottom";
    }
    return ["bottom", "left", "top", "right"][index] || "bottom";
  };

  const currentPlayerIndex = players.findIndex((p) => p.id === currentUserId);
  const rotatedPlayers = [...players.slice(currentPlayerIndex), ...players.slice(0, currentPlayerIndex)];
  const is2v2 = gameState?.mode === "2v2";
  const scoreRows = (gameState?.players || players).map((p: Player) => ({
    id: p.id,
    username: p.username,
    total: gameState?.scores?.[p.id] || 0,
    round: gameState?.round_points?.[p.id] || 0,
    chkobba: gameState?.chkobba_points?.[p.id] || 0,
    isCurrentUser: p.id === currentUserId,
  }));

  return (
    <div className="relative w-full h-screen overflow-hidden bg-brown-dark">
      <div className="absolute inset-0 arabesque-pattern opacity-20" />

      {/* Table - responsive sizing */}
      <div className={`absolute ${isMobile ? "inset-2" : "inset-4 sm:inset-8 md:inset-12"} table-felt`}>
        {/* Lanterns - hidden on small mobile */}
        {!isMobile && (
          <>
            <div className="absolute -top-6 -left-5 w-10 h-16 sm:w-12 sm:h-20">
              <Lantern />
            </div>
            <div className="absolute -top-6 -right-5 w-10 h-16 sm:w-12 sm:h-20">
              <Lantern />
            </div>
            <div className="absolute -bottom-6 -left-5 w-10 h-16 sm:w-12 sm:h-20 rotate-180">
              <Lantern />
            </div>
            <div className="absolute -bottom-6 -right-5 w-10 h-16 sm:w-12 sm:h-20 rotate-180">
              <Lantern />
            </div>
          </>
        )}

        {/* Chicha - smaller on mobile */}
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${isMobile ? "w-12 h-20 opacity-40" : "w-16 h-24 sm:w-20 sm:h-32"} opacity-50 pointer-events-none`}>
          <Chicha />
        </div>

        {/* Center pile */}
        <CenterPile
          cards={centerPile}
          isDropActive={!!draggingCardId}
          onDropCard={(card) => {
            setDraggingCardId(null);
            onPlayCard(card);
          }}
        />

        {/* Players */}
        {rotatedPlayers.map((player, index) => {
          const position = getPlayerPosition(index, rotatedPlayers.length);
          const isCurrentTurn = gameState?.current_player_index === ((currentPlayerIndex + index) % players.length);
          const isCurrentUser = player.id === currentUserId;

          return (
            <div
              key={player.id}
              className={`absolute ${
                position === "bottom" ? "bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2" :
                position === "left" ? "left-2 sm:left-4 top-1/2 -translate-y-1/2" :
                position === "top" ? "top-2 sm:top-4 left-1/2 -translate-x-1/2" :
                "right-2 sm:right-4 top-1/2 -translate-y-1/2"
              }`}
            >
              <PlayerAvatar
                player={player}
                isCurrentTurn={isCurrentTurn}
                isCurrentUser={isCurrentUser}
                position={position}
                showTeam={is2v2}
              />

              <div className={`flex ${position === "left" || position === "right" ? "flex-col" : "flex-row"} gap-1 sm:gap-2 justify-center mt-2`}>
                <PlayerHand
                  player={player}
                  isCurrentUser={isCurrentUser}
                  isCurrentTurn={isCurrentTurn}
                  position={position}
                  onPlayCard={onPlayCard}
                  onDragCard={(card) => setDraggingCardId(card.id)}
                  onDragEndCard={() => setDraggingCardId(null)}
                  isMobile={isMobile}
                />
              </div>
            </div>
          );
        })}

        {/* Hand animation */}
        {handAnimation && (
          <HandAnimation
            position={handAnimation.position as "bottom" | "left" | "right" | "top"}
            isPlaying={handAnimation.active}
          />
        )}
      </div>

      {/* Audio toggle - mobile friendly position */}
      <button
        onClick={() => setAudioEnabled(!audioEnabled)}
        className={`absolute ${isMobile ? "bottom-2 right-2" : "bottom-4 right-4"} glass-card p-3 rounded-xl text-gold hover:text-gold-light transition-all`}
      >
        {audioEnabled ? <Volume2 size={isMobile ? 18 : 22} /> : <VolumeX size={isMobile ? 18 : 22} />}
      </button>

      {/* Game info - responsive */}
      <div className={`absolute ${isMobile ? "top-2 left-2" : "top-4 left-4"} glass-card p-3 sm:p-4`}>
        <p className="text-gold text-sm sm:text-base font-semibold">Round {gameState?.round || 1}</p>
        <p className="text-cream/60 text-xs sm:text-sm mt-1">
          {is2v2 ? "2v2 Teams" : "1v1 Duel"}
        </p>
        {is2v2 && gameState?.team_scores && (
          <div className="flex gap-3 mt-2 text-xs sm:text-sm">
            <span className="team-1 team-badge">T1: {gameState.team_scores[1] || 0}</span>
            <span className="team-2 team-badge">T2: {gameState.team_scores[2] || 0}</span>
          </div>
        )}
      </div>

      {/* Live score board */}
      <div className={`absolute ${isMobile ? "top-2 right-2" : "top-4 right-4"} glass-card p-3 sm:p-4 min-w-[220px]`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-gold text-sm sm:text-base font-semibold">Score Live</p>
          <span className="text-cream/70 text-xs">Objectif: 21</span>
        </div>
        <div className="space-y-2">
          {scoreRows.map((row: any) => (
            <div
              key={row.id}
              className={`rounded-lg px-2 py-1.5 border ${
                row.isCurrentUser ? "border-gold/50 bg-gold/10" : "border-gold/20 bg-cream/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-cream text-sm font-medium truncate mr-2">{row.username}</span>
                <span className="text-gold text-sm font-bold">{row.total}/21</span>
              </div>
              <div className="flex items-center gap-3 text-xs mt-1 text-cream/70">
                <span>Manche: {row.round}</span>
                <span>Chkoba: {row.chkobba}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {chkobbaToast && (
          <motion.div
            key={chkobbaToast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="absolute left-1/2 top-20 -translate-x-1/2 glass-card px-4 py-2 border border-gold/50"
          >
            <span className="text-gold font-semibold text-sm">
              +1 Chkoba • {chkobbaToast.playerName}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
