import type { Card, CardDatabase } from "./types";
import starterSetData from "./data/starter-set.json";
import officialCatalogData from "./data/official-catalog.json";

const starterSet = starterSetData as Card[];
// Imported from the official Riftbound card gallery, all 5 sets (Origins,
// Proving Grounds, Spiritforged, Unleashed, Vendetta) — see docs/data-sourcing.md
// and scripts/import-cards.mjs. Cards with unique text beyond the generic
// keyword engine are catalogued in src/cards/data/special-cases-todo.json
// rather than implemented all at once.
const officialCatalog = officialCatalogData as Card[];

export const cardDatabase: CardDatabase = Object.fromEntries(
  [...officialCatalog, ...starterSet].map((card) => [card.id, card]),
);

export function getCard(cardId: string): Card {
  const card = cardDatabase[cardId];
  if (!card) throw new Error(`Unknown card id: ${cardId}`);
  return card;
}
