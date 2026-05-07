import { Card, Suit } from "@/types";
import { v4 as uuidv4 } from "uuid";

const SUITS: Suit[] = ["coupe", "carreau", "trefle", "pique"];

const CARD_LABELS: Record<number, { ar: string; fr: string }> = {
  1: { ar: "آس", fr: "As" },
  2: { ar: "اثنان", fr: "Deux" },
  3: { ar: "ثلاثة", fr: "Trois" },
  4: { ar: "أربعة", fr: "Quatre" },
  5: { ar: "خمسة", fr: "Cinq" },
  6: { ar: "ستة", fr: "Six" },
  7: { ar: "سبعة", fr: "Sept" },
  8: { ar: "دامة", fr: "Dame" },
  9: { ar: "وزير", fr: "Ministre" },
  10: { ar: "الكبير", fr: "Kbir" },
};

const SUIT_SYMBOLS: Record<Suit, string> = {
  coupe: "♥",
  carreau: "♦",
  trefle: "♣",
  pique: "♠",
};

export function generateDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of SUITS) {
    for (let value = 1; value <= 10; value++) {
      const labels = CARD_LABELS[value];
      deck.push({
        id: uuidv4(),
        value,
        suit,
        label_ar: labels.ar,
        label_fr: labels.fr,
        image_asset: `${suit}_${value}`,
      });
    }
  }

  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck: Card[], numPlayers: number, cardsPerPlayer: number = 10): Card[][] {
  const hands: Card[][] = Array.from({ length: numPlayers }, () => []);
  let cardIndex = 0;

  for (let round = 0; round < cardsPerPlayer; round++) {
    for (let player = 0; player < numPlayers; player++) {
      if (cardIndex < deck.length) {
        hands[player].push(deck[cardIndex]);
        cardIndex++;
      }
    }
  }

  return hands;
}

export function getSuitSymbol(suit: Suit): string {
  return SUIT_SYMBOLS[suit];
}

export function getCardDisplayValue(value: number): string {
  if (value === 1) return "A";
  if (value === 8) return "D";
  if (value === 9) return "M";
  if (value === 10) return "K";
  return value.toString();
}
