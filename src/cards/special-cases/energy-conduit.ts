import type { SpecialCaseHandler } from "./types";

/**
 * Exhaust: [Reaction] — [Add] 1 Energy.
 *
 * Same as dragonsoul-sage.ts: fully handled generically via activated-abilities.json, whose
 * domain bug for this card is now fixed. Same [Reaction]-on-an-ability scope note.
 */
export const energyConduit: SpecialCaseHandler = {
  cardId: "energy-conduit",
};
