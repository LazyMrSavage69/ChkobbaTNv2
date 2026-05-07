import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getOpeningDeal } from "@/lib/game-engine/chkobba";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await request.json();

    const { data: room } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (!room || room.host_id !== user.id) {
      return NextResponse.json({ error: "Not authorized to start game" }, { status: 403 });
    }

    if (room.mode !== "1v1") {
      return NextResponse.json(
        { error: "Current ruleset is enabled for 1v1 only." },
        { status: 400 }
      );
    }

    const { data: roomPlayers } = await supabase
      .from("room_players")
      .select("*")
      .eq("room_id", roomId)
      .order("seat", { ascending: true });

    const userIds = [...new Set((roomPlayers || []).map((player: any) => player.user_id))];
    const { data: profiles } = userIds.length
      ? await supabase
          .from("profiles")
          .select("id, username, avatar_url, has_cigarette")
          .in("id", userIds)
      : { data: [] };

    const profilesById = new Map(
      (profiles || []).map((profile) => [profile.id, profile])
    );

    if (!roomPlayers || roomPlayers.length < room.max_players) {
      return NextResponse.json({ error: `Need ${room.max_players} players` }, { status: 400 });
    }

    const players = roomPlayers.map((rp: any) => ({
      id: rp.user_id,
      username: profilesById.get(rp.user_id)?.username || "Player",
      avatar_url: profilesById.get(rp.user_id)?.avatar_url,
      seat: rp.seat,
      hand: [],
      is_ready: rp.is_ready,
      has_cigarette: profilesById.get(rp.user_id)?.has_cigarette || false,
      team: rp.team,
    }));
    const opening = getOpeningDeal(players);
    const gamePlayers = players.map((player: any) => ({
      ...player,
      hand: opening.handsById[player.id] || [],
    }));

    const initialState = {
      players: gamePlayers,
      current_player_index: 0,
      center_pile: opening.table,
      round: 1,
      phase: "playing",
      scores: players.reduce((acc: any, p: any) => ({ ...acc, [p.id]: 0 }), {}),
      round_points: players.reduce((acc: any, p: any) => ({ ...acc, [p.id]: 0 }), {}),
      deck: opening.remainingDeck,
      mode: room.mode,
      captured_cards: players.reduce((acc: any, p: any) => ({ ...acc, [p.id]: [] }), {}),
      chkobba_points: players.reduce((acc: any, p: any) => ({ ...acc, [p.id]: 0 }), {}),
      last_capturer_id: undefined,
    };

    const { data: gameStateRecord, error: gameError } = await supabase
      .from("game_states")
      .insert({
        room_id: roomId,
        state_json: initialState,
        current_turn: players[0].id,
        round: 1,
      })
      .select()
      .single();

    if (gameError) throw gameError;

    await supabase
      .from("rooms")
      .update({ status: "playing" })
      .eq("id", roomId);

    return NextResponse.json({ 
      success: true, 
      gameState: gameStateRecord 
    });
  } catch (error: any) {
    console.error("Error starting game:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start game" },
      { status: 500 }
    );
  }
}
