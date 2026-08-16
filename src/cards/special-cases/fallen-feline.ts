import type { SpecialCaseHandler } from "./types";

/**
 * When you play me, name a spell.
 * While I'm at a battlefield, opponents can't play spells with that name.
 *
 * Moot — "name a spell" has no reasonable auto-pick heuristic and no player-choice UI (deferred,
 * see the-list.ts's identical note). No fallback mode.
 */
export const fallenFeline: SpecialCaseHandler = {
  cardId: "fallen-feline",
};
