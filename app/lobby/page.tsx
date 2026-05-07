"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/ui/Navbar";
import { RoomCard } from "@/components/lobby/RoomCard";
import { Room, GameModeType } from "@/types";
import { Plus, Gamepad2, Search, Hash, Users, Sword, Shield } from "lucide-react";

export default function LobbyPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomMode, setNewRoomMode] = useState<GameModeType>("1v1");
  const [isPrivate, setIsPrivate] = useState(false);
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [supportsJoinCode, setSupportsJoinCode] = useState(true);
  const [supportsIsPrivate, setSupportsIsPrivate] = useState(true);
  const [supportsRoomPlayersTeam, setSupportsRoomPlayersTeam] = useState(true);
  const [supportsRoomPlayersIsReady, setSupportsRoomPlayersIsReady] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    detectRoomsSchema().then(async () => {
      await detectRoomPlayersSchema();
      await fetchRooms();
    });

    const channel = supabase
      .channel("lobby")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => fetchRooms()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const detectRoomsSchema = async () => {
    try {
      const { error } = await supabase
        .from("rooms")
        .select("id, join_code, is_private")
        .limit(1);

      if (!error) {
        setSupportsJoinCode(true);
        setSupportsIsPrivate(true);
        return;
      }

      const msg = `${error.message || ""} ${error.details || ""}`.toLowerCase();
      setSupportsJoinCode(!msg.includes("join_code"));
      setSupportsIsPrivate(!msg.includes("is_private"));
    } catch {
      // Keep defaults on network or transient errors.
    }
  };

  const detectRoomPlayersSchema = async () => {
    try {
      const { error } = await supabase
        .from("room_players")
        .select("id, team, is_ready")
        .limit(1);

      if (!error) {
        setSupportsRoomPlayersTeam(true);
        setSupportsRoomPlayersIsReady(true);
        return;
      }

      const msg = `${error.message || ""} ${error.details || ""}`.toLowerCase();
      setSupportsRoomPlayersTeam(!msg.includes("team"));
      setSupportsRoomPlayersIsReady(!msg.includes("is_ready"));
    } catch {
      // Keep defaults on transient errors.
    }
  };

  const fetchRooms = async () => {
    try {
      // Query without is_private filter to avoid column not found error
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          *,
          room_players(count)
        `)
        .eq("status", "waiting")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter private rooms client-side for now
      const formattedRooms = data?.map((room: any) => ({
        ...room,
        players_count: room.room_players?.[0]?.count || 0,
      })).filter((room: any) => !room.is_private) || [];

      setRooms(formattedRooms);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const maxPlayers = newRoomMode === "1v1" ? 2 : 4;

      // generate a stable join code client-side to avoid relying on DB-side random during insert
      const generateCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let out = "";
        for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
        return out;
      };

      const joinCodeValue = generateCode();
      const payload: any = {
        name: newRoomName || `${newRoomMode} Room`,
        mode: newRoomMode,
        status: "waiting",
        host_id: user.id,
        max_players: maxPlayers,
      };

      if (supportsIsPrivate) payload.is_private = isPrivate;
      if (supportsJoinCode) payload.join_code = joinCodeValue;

      const { data, error } = await supabase
        .from("rooms")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      const roomPlayerPayload: any = {
        room_id: data.id,
        user_id: user.id,
        seat: 0,
      };
      if (supportsRoomPlayersTeam) roomPlayerPayload.team = 1;
      if (supportsRoomPlayersIsReady) roomPlayerPayload.is_ready = false;

      const { error: addHostError } = await supabase.from("room_players").insert(roomPlayerPayload);
      if (addHostError) {
        throw new Error(addHostError.message || "Failed to add host to room_players");
      }
      // Keep the modal open and show the join code for private rooms (or always show it briefly)
      setCreatedRoomCode(supportsJoinCode ? data.join_code || null : null);
      setCreatedRoomId(data.id || null);
      // navigate after a short delay to allow the user to copy the code if desired
      setTimeout(() => {
        router.push(`/game/${data.id}`);
      }, 1200);
    } catch (err: any) {
      console.error("Create room error:", err);
      // If Supabase REST returned a 400, show helpful message
      alert(err?.message || JSON.stringify(err) || "Failed to create room");
    } finally {
      setCreating(false);
      // don't immediately close modal: keep it so we can show the code
    }
  };

  const joinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);

    try {
      if (!supportsJoinCode) {
        alert("Join by code is disabled: 'join_code' column is missing in Supabase schema.");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("*, room_players(count)")
        .eq("join_code", joinCode.toUpperCase())
        .eq("status", "waiting")
        .single();

      if (roomError || !room) {
        alert("Invalid join code or room not available");
        return;
      }

      const playersCount = room.room_players?.[0]?.count || 0;
      if (playersCount >= room.max_players) {
        alert("Room is full");
        return;
      }

      await joinRoom(room.id, playersCount);
    } catch (err: any) {
      alert(err.message || "Failed to join room");
    } finally {
      setJoining(false);
    }
  };

  const joinRoom = async (roomId: string, currentCount?: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("room_players")
        .select("*")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .single();

      if (!existing) {
        let count = currentCount;
        if (count === undefined) {
          const { data: players } = await supabase
            .from("room_players")
            .select("*")
            .eq("room_id", roomId);
          count = players?.length || 0;
        }

        const { data: roomData } = await supabase
          .from("rooms")
          .select("mode")
          .eq("id", roomId)
          .single();

        const team = roomData?.mode === "2v2" 
          ? (count < 2 ? 1 : 2)
          : 0;

        const roomPlayerPayload: any = {
          room_id: roomId,
          user_id: user.id,
          seat: count,
        };
        if (supportsRoomPlayersTeam) roomPlayerPayload.team = team;
        if (supportsRoomPlayersIsReady) roomPlayerPayload.is_ready = false;

        const { error: joinError } = await supabase.from("room_players").insert(roomPlayerPayload);
        if (joinError) {
          throw new Error(joinError.message || "Failed to join room");
        }
      }

      router.push(`/game/${roomId}`);
    } catch (err: any) {
      alert(err.message || "Failed to join room");
    }
  };

  return (
    <div className="min-h-screen zellige-bg">
      <Navbar />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gold tracking-tight">Game Lobby</h1>
            <p className="text-cream/60 mt-2 text-lg">Join a table or create your own</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowJoinModal(true)}
              className="flex-1 sm:flex-none glass-card px-6 py-4 text-gold font-semibold flex items-center justify-center gap-2 hover:border-gold/40 transition-all"
            >
              <Hash size={20} />
              <span>Join by Code</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="flex-1 sm:flex-none tunisian-btn flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              <span>Create Room</span>
            </motion.button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-14 h-14 border-4 border-gold border-t-transparent rounded-full"
            />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20">
            <Gamepad2 size={64} className="text-gold/20 mx-auto mb-6" />
            <p className="text-cream/40 text-xl">No open rooms available</p>
            <p className="text-cream/25 text-base mt-3">Be the first to create one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {rooms.map((room, index) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  index={index}
                  onJoin={() => joinRoom(room.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-8 max-w-lg w-full"
            >
              <h2 className="text-3xl font-bold text-gold mb-8">Create New Room</h2>

              <form onSubmit={createRoom} className="space-y-6">
                <div>
                  <label className="block text-gold text-base font-medium mb-3">Room Name</label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="tunisian-input"
                    placeholder="My Game Room"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gold text-base font-medium mb-3">Game Mode</label>
                  <div className="mode-selector">
                    <button
                      type="button"
                      onClick={() => setNewRoomMode("1v1")}
                      className={`mode-option ${newRoomMode === "1v1" ? "selected" : ""}`}
                    >
                      <Sword size={28} className="mx-auto mb-2 text-gold" />
                      <div className="text-cream font-semibold">1v1</div>
                      <div className="text-cream/50 text-sm">Duel</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRoomMode("2v2")}
                      className={`mode-option ${newRoomMode === "2v2" ? "selected" : ""}`}
                    >
                      <Shield size={28} className="mx-auto mb-2 text-gold" />
                      <div className="text-cream font-semibold">2v2</div>
                      <div className="text-cream/50 text-sm">Teams</div>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-cream/5 border border-gold/10">
                  <input
                    type="checkbox"
                    id="private"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-5 h-5 accent-gold rounded"
                  />
                  <label htmlFor="private" className="text-cream text-base cursor-pointer">
                    Private Room (code only)
                  </label>
                </div>

                {createdRoomCode ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-cream/60 mb-2">Room created! Share this code to invite players:</p>
                      <div className="inline-flex items-center gap-2 bg-brown-dark/90 px-4 py-3 rounded-md border border-gold/30">
                        <span className="font-mono text-2xl tracking-wider text-gold">{createdRoomCode}</span>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => { setShowCreateModal(false); setCreatedRoomCode(null); setCreatedRoomId(null); }}
                        className="flex-1 py-4 px-6 border-2 border-gold/30 text-cream rounded-2xl hover:bg-gold/10 transition-all text-base font-medium"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        onClick={() => createdRoomId && router.push(`/game/${createdRoomId}`)}
                        className="flex-1 tunisian-btn text-base"
                      >
                        Go to Room
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-4 px-6 border-2 border-gold/30 text-cream rounded-2xl hover:bg-gold/10 transition-all text-base font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 tunisian-btn disabled:opacity-50 text-base"
                  >
                    {creating ? "Creating..." : "Create"}
                  </button>
                </div>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join by Code Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowJoinModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-8 max-w-md w-full text-center"
            >
              <Hash size={48} className="text-gold mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gold mb-2">Join by Code</h2>
              <p className="text-cream/60 mb-8 text-base">Enter the 6-character room code</p>

              <form onSubmit={joinByCode} className="space-y-6">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="tunisian-input text-center text-2xl tracking-[0.3em] font-mono uppercase"
                  placeholder="ABC123"
                  maxLength={6}
                  required
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="flex-1 py-4 px-6 border-2 border-gold/30 text-cream rounded-2xl hover:bg-gold/10 transition-all text-base font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={joining || joinCode.length < 6}
                    className="flex-1 tunisian-btn disabled:opacity-50 text-base"
                  >
                    {joining ? "Joining..." : "Join Room"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
