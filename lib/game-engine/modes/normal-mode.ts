import { GameMode, GameState, Move, Player, Card } from "@/types";
import { generateDeck, shuffleDeck, dealCards } from "@/lib/game-engine/deck";

export const NormalMode: GameMode = {
  name: "Normal Mode",

  init(players: Player[]): GameState['state_json'] {
    const deck = shuffleDeck(generateDeck());
    const hands = dealCards(deck, players.length, 10);

    const gamePlayers = players.map((player, index) => ({
      ...player,
      hand: hands[index] || [],
    }));

    return {
      players: gamePlayers,
      current_player_index: 0,
      center_pile: [],
      round: 1,
      phase: 'waiting',
      scores: players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {}),
      deck: deck.slice(players.length * 10),
      trump_suit: undefined,
      mode: "normal",
    };
  },

  onCardPlay(state: GameState['state_json'], move: Move): GameState['state_json'] {
    const playerIndex = state.players.findIndex((p) => p.id === move.user_id);
    if (playerIndex === -1) return state;

    const player = state.players[playerIndex];
    const cardIndex = player.hand.findIndex(
      (c) => c.id === move.card_played.id
    );

    if (cardIndex === -1) return state;

    // Remove card from player's hand
    const updatedHand = [...player.hand];
    updatedHand.splice(cardIndex, 1);

    const updatedPlayers = [...state.players];
    updatedPlayers[playerIndex] = {
      ...player,
      hand: updatedHand,
    };

    return {
      ...state,
      players: updatedPlayers,
      center_pile: [...state.center_pile, move.card_played],
      last_move: move,
    };
  },

  onTurnEnd(state: GameState['state_json']): GameState['state_json'] {
    const nextIndex = (state.current_player_index + 1) % state.players.length;

    // Check if round is complete (all players played)
    if (nextIndex === 0 && state.center_pile.length > 0) {
      // Determine round winner based on highest card value
      const winningCard = state.center_pile.reduce((highest, card) =>
        card.value > highest.value ? card : highest
      );

      const roundWinner = state.players.find((p) =>
        p.hand.length < 10 - state.round // Approximate logic
      );

      // Award points
      const points = state.center_pile.reduce((sum, card) => sum + card.value, 0);
      const winnerId = state.last_move?.user_id;

      if (winnerId) {
        return {
          ...state,
          current_player_index: nextIndex,
          scores: {
            ...state.scores,
            [winnerId]: (state.scores[winnerId] || 0) + points,
          },
        };
      }
    }

    return {
      ...state,
      current_player_index: nextIndex,
    };
  },

  onRoundEnd(state: GameState['state_json']): GameState['state_json'] {
    const newRound = state.round + 1;

    // Check if any player has no cards left
    const emptyHandPlayer = state.players.find((p) => p.hand.length === 0);

    if (emptyHandPlayer) {
      return {
        ...state,
        round: newRound,
        center_pile: [],
        phase: 'game_over',
      };
    }

    return {
      ...state,
      round: newRound,
      center_pile: [],
      current_player_index: 0,
    };
  },

  checkWin(state: GameState['state_json']): Player | null {
    // Game ends when a player reaches target score or all cards are played
    const targetScore = 100;
    const winner = state.players.find((p) => (state.scores[p.id] || 0) >= targetScore);

    if (winner) return winner;

    // Or when all players have empty hands
    const allEmpty = state.players.every((p) => p.hand.length === 0);
    if (allEmpty) {
      const highestScore = Math.max(...Object.values(state.scores));
      return state.players.find((p) => state.scores[p.id] === highestScore) || null;
    }

    return null;
  },
};
