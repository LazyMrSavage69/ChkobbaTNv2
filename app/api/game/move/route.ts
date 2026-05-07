import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  computeRoundPoints,
  getOpeningDeal,
  hasMatchWinner,
  resolveCapture,
} from "@/lib/game-engine/chkobba";
import { Card } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, card } = await request.json();

    const { data: gameStateRecord } = await supabase
      .from("game_states")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!gameStateRecord) {
      return NextResponse.json({ error: "No active game" }, { status: 404 });
    }

    const currentState = gameStateRecord.state_json;

    const currentPlayer = currentState.players[currentState.current_player_index];
    if (currentPlayer.id !== user.id) {
      return NextResponse.json({ error: "Not your turn" }, { status: 403 });
    }

    const move = {
      room_id: roomId,
      user_id: user.id,
      card_played: card,
      action: "play_card",
    };

    const playerIndex = currentState.players.findIndex((p: any) => p.id === user.id);
    const updatedPlayers = [...currentState.players];
    const player = updatedPlayers[playerIndex];
    const cardIndex = player.hand.findIndex((c: any) => c.id === card.id);

    if (cardIndex === -1) {
      return NextResponse.json({ error: "Card not in hand" }, { status: 400 });
    }

    const updatedHand = [...player.hand];
    updatedHand.splice(cardIndex, 1);
    updatedPlayers[playerIndex] = { ...player, hand: updatedHand };

    const capturedByPlayer: Record<string, Card[]> = { ...(currentState.captured_cards || {}) };
    const chkobbaPoints: Record<string, number> = { ...(currentState.chkobba_points || {}) };
    const tableCards: Card[] = [...(currentState.center_pile || [])];

    const captured = resolveCapture(tableCards, card);
    let newTableCards: Card[] = [];
    let lastCapturerId: string | undefined = currentState.last_capturer_id;
    if (captured.length > 0) {
      const capturedIds = new Set(captured.map((c) => c.id));
      newTableCards = tableCards.filter((c) => !capturedIds.has(c.id));
      capturedByPlayer[user.id] = [...(capturedByPlayer[user.id] || []), ...captured, card];
      lastCapturerId = user.id;
      move.action = "capture";
      if (tableCards.length > 0 && newTableCards.length === 0) {
        chkobbaPoints[user.id] = (chkobbaPoints[user.id] || 0) + 1;
      }
    } else {
      newTableCards = [...tableCards, card];
    }

    const { error: moveInsertError } = await supabase.from("moves").insert({
      ...move,
      card_played: {
        ...card,
        captured_card_ids: captured.map((c) => c.id),
      },
    });
    if (moveInsertError) throw moveInsertError;

    let nextPlayerIndex = (currentState.current_player_index + 1) % currentState.players.length;
    let newRound = currentState.round;
    let newPhase = "playing";
    let newScores = { ...(currentState.scores || {}) };
    let newRoundPoints = currentState.round_points || {};
    let newDeck = [...(currentState.deck || [])];

    const allHandsEmpty = updatedPlayers.every((p: any) => (p.hand || []).length === 0);
    if (allHandsEmpty) {
      if (newDeck.length > 0) {
        // Deal 3 cards each while deck is available.
        updatedPlayers.sort((a: any, b: any) => a.seat - b.seat).forEach((p: any) => {
          const handPlus = newDeck.splice(0, 3);
          p.hand = handPlus;
        });
      } else {
        // End of round: remaining table cards go to last capturer.
        if (newTableCards.length > 0 && lastCapturerId) {
          capturedByPlayer[lastCapturerId] = [
            ...(capturedByPlayer[lastCapturerId] || []),
            ...newTableCards,
          ];
          newTableCards = [];
        }

        newRoundPoints = computeRoundPoints(updatedPlayers, capturedByPlayer, chkobbaPoints);
        newScores = Object.fromEntries(
          Object.entries(newScores).map(([pid, score]) => [
            pid,
            (score as number) + (newRoundPoints[pid] || 0),
          ])
        );

        const winnerId = hasMatchWinner(newScores);
        if (winnerId) {
          newPhase = "game_over";
          await supabase
            .from("rooms")
            .update({ status: "finished" })
            .eq("id", roomId);
        } else {
          // New round with requested opening deal flow.
          const opening = getOpeningDeal(updatedPlayers);
          updatedPlayers.forEach((p: any) => {
            p.hand = opening.handsById[p.id] || [];
          });
          newTableCards = opening.table;
          newDeck = opening.remainingDeck;
          newRound += 1;
          nextPlayerIndex = 0;
          for (const p of updatedPlayers) capturedByPlayer[p.id] = [];
          for (const p of updatedPlayers) chkobbaPoints[p.id] = 0;
          lastCapturerId = undefined;
          newRoundPoints = updatedPlayers.reduce(
            (acc: Record<string, number>, p: any) => ({ ...acc, [p.id]: 0 }),
            {}
          );
        }
      }
    }

    const newState = {
      ...currentState,
      players: updatedPlayers,
      center_pile: newTableCards,
      current_player_index: nextPlayerIndex,
      round: newRound,
      phase: newPhase,
      scores: newScores,
      round_points: newRoundPoints,
      deck: newDeck,
      captured_cards: capturedByPlayer,
      chkobba_points: chkobbaPoints,
      last_capturer_id: lastCapturerId,
      last_move: move,
    };

    const { error: updateStateError } = await supabase
      .from("game_states")
      .update({
        state_json: newState,
        current_turn: updatedPlayers[nextPlayerIndex]?.id || user.id,
        round: newRound,
      })
      .eq("id", gameStateRecord.id);

    if (updateStateError) throw updateStateError;

    if (newPhase === "game_over") {
      const highestScore = Math.max(...Object.values(newScores) as number[]);
      const winner = updatedPlayers.find((p: any) => newScores[p.id] === highestScore);

      if (winner) {
        await supabase.rpc("increment_wins", { user_id: winner.id });
        for (const p of updatedPlayers) {
          if (p.id !== winner.id) {
            await supabase.rpc("increment_losses", { user_id: p.id });
          }
        }
      }
    }

    return NextResponse.json({ success: true, state: newState });
  } catch (error: any) {
    console.error("Error processing move:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process move" },
      { status: 500 }
    );
  }
}
