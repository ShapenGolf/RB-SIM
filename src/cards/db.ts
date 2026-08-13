import type { Card, CardDatabase } from "./types";
import starterSetData from "./data/starter-set.json";

const starterSet = starterSetData as Card[];

export const cardDatabase: CardDatabase = Object.fromEntries(
  starterSet.map((card) => [card.id, card]),
);

export function getCard(cardId: string): Card {
  const card = cardDatabase[cardId];
  if (!card) throw new Error(`Unknown card id: ${cardId}`);
  return card;
}
