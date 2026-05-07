import { Card } from "@/types";
import { generateDeck, shuffleDeck } from "@/lib/game-engine/deck";

export interface ChkobbaPlayerState {
  id: string;
  username: string;
  avatar_url?: string;
  seat: number;
  hand: Card[];
  is_ready: boolean;
  has_cigarette: boolean;
  team?: number;
}

export interface ChkobbaState {
  players: ChkobbaPlayerState[];
  current_player_index: number;
  center_pile: Card[]; // cards on table
  round: number;
  phase: "waiting" | "playing" | "round_end" | "game_over";
  scores: Record<string, number>; // match score to 21
  round_points?: Record<string, number>;
  deck: Card[];
  mode: string;
  captured_cards: Record<string, Card[]>;
  chkobba_points?: Record<string, number>;
  last_capturer_id?: string;
}

const TARGET_SCORE = 21;

function combinationsThatSum(cards: Card[], target: number): Card[][] {
  const result: Card[][] = [];
  const n = cards.length;
  for (let mask = 1; mask < (1 << n); mask++) {
    const combo: Card[] = [];
    let sum = 0;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        combo.push(cards[i]);
        sum += cards[i].value;
      }
    }
    if (sum === target) result.push(combo);
  }
  return result;
}

function pickBestCombo(combos: Card[][]): Card[] {
  if (combos.length === 0) return [];
  return [...combos].sort((a, b) => b.length - a.length)[0];
}

export function getOpeningDeal(players: ChkobbaPlayerState[]) {
  const deck = shuffleDeck(generateDeck());
  const sortedPlayers = [...players].sort((a, b) => a.seat - b.seat);
  const p1 = sortedPlayers[0];
  const p2 = sortedPlayers[1];

  if (!p1 || !p2) {
    throw new Error("Chkobba currently supports exactly 2 players.");
  }

  // Requested flow: 3 cards first player, 4 cards on table, 3 cards second player.
  const p1Hand = deck.slice(0, 3);
  const table = deck.slice(3, 7);
  const p2Hand = deck.slice(7, 10);
  const remainingDeck = deck.slice(10);

  return {
    p1Id: p1.id,
    p2Id: p2.id,
    handsById: {
      [p1.id]: p1Hand,
      [p2.id]: p2Hand,
    } as Record<string, Card[]>,
    table,
    remainingDeck,
  };
}

export function resolveCapture(tableCards: Card[], playedCard: Card): Card[] {
  const exact = tableCards.filter((c) => c.value === playedCard.value);
  if (exact.length > 0) return exact;
  const combos = combinationsThatSum(tableCards, playedCard.value);
  return pickBestCombo(combos);
}

function countBy(cards: Card[], predicate: (c: Card) => boolean): number {
  return cards.reduce((acc, c) => (predicate(c) ? acc + 1 : acc), 0);
}

export function computeRoundPoints(
  players: ChkobbaPlayerState[],
  capturedByPlayer: Record<string, Card[]>,
  chkobbaPoints: Record<string, number> = {}
): Record<string, number> {
  const p1 = players[0]?.id;
  const p2 = players[1]?.id;
  if (!p1 || !p2) return {};

  const c1 = capturedByPlayer[p1] || [];
  const c2 = capturedByPlayer[p2] || [];
  const points: Record<string, number> = { [p1]: 0, [p2]: 0 };

  // Chkobba (sweep/clear table) points accumulated during tricks.
  points[p1] += chkobbaPoints[p1] || 0;
  points[p2] += chkobbaPoints[p2] || 0;

  // 1) Most captured cards
  if (c1.length > c2.length) points[p1] += 1;
  else if (c2.length > c1.length) points[p2] += 1;

  // 2) Seven of diamonds bonus
  if (c1.some((c) => c.suit === "carreau" && c.value === 7)) points[p1] += 1;
  if (c2.some((c) => c.suit === "carreau" && c.value === 7)) points[p2] += 1;

  // 3) Most diamonds
  const d1 = countBy(c1, (c) => c.suit === "carreau");
  const d2 = countBy(c2, (c) => c.suit === "carreau");
  if (d1 > d2) points[p1] += 1;
  else if (d2 > d1) points[p2] += 1;

  // 4) Most 7s, tie-break with 6s
  const s71 = countBy(c1, (c) => c.value === 7);
  const s72 = countBy(c2, (c) => c.value === 7);
  if (s71 > s72) points[p1] += 1;
  else if (s72 > s71) points[p2] += 1;
  else {
    const s61 = countBy(c1, (c) => c.value === 6);
    const s62 = countBy(c2, (c) => c.value === 6);
    if (s61 > s62) points[p1] += 1;
    else if (s62 > s61) points[p2] += 1;
  }

  return points;
}

export function hasMatchWinner(scores: Record<string, number>): string | null {
  let winner: string | null = null;
  let high = -1;
  for (const [playerId, score] of Object.entries(scores)) {
    if (score >= TARGET_SCORE && score > high) {
      winner = playerId;
      high = score;
    }
  }
  return winner;
}
