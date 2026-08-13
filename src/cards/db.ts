import type { Card, CardDatabase } from "./types";
import type { ActivatedAbility, TemplatedEffect } from "./templatedEffects";
import starterSetData from "./data/starter-set.json";
import officialCatalogData from "./data/official-catalog.json";
import templatedEffectsData from "./data/templated-effects.json";
import activatedAbilitiesData from "./data/activated-abilities.json";

const starterSet = starterSetData as Card[];
// Imported from the official Riftbound card gallery, all 5 sets (Origins,
// Proving Grounds, Spiritforged, Unleashed, Vendetta) — see docs/data-sourcing.md
// and scripts/import-cards.mjs. Cards with unique text beyond the generic
// keyword engine are catalogued in src/cards/data/special-cases-todo.json
// rather than implemented all at once.
const officialCatalog = officialCatalogData as Card[];
// Auto-matched trigger+action effects and activated abilities, keyed by card
// id — see scripts/match-templated-effects.mjs,
// scripts/match-activated-abilities.mjs, and src/game/templatedEffectEngine.ts.
const templatedEffects = templatedEffectsData as Record<string, TemplatedEffect>;
const activatedAbilities = activatedAbilitiesData as Record<string, ActivatedAbility>;

export const cardDatabase: CardDatabase = Object.fromEntries(
  [...officialCatalog, ...starterSet].map((card) => {
    const extras: Partial<Card> = {};
    if (templatedEffects[card.id]) extras.templatedEffect = templatedEffects[card.id];
    if (activatedAbilities[card.id]) extras.activatedAbility = activatedAbilities[card.id];
    return [card.id, Object.keys(extras).length > 0 ? { ...card, ...extras } : card];
  }),
);

export function getCard(cardId: string): Card {
  const card = cardDatabase[cardId];
  if (!card) throw new Error(`Unknown card id: ${cardId}`);
  return card;
}
