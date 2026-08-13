import type { SpecialCaseHandler } from "./types";

/**
 * When you play me, opponents can't play cards this turn.
 *
 * No-op by construction: the engine's turn structure (see game/game.ts — no
 * `activePlayers`/reaction stages configured) already restricts the `playCard`
 * move to the current player only, so an opponent can never play a card during
 * your turn in the first place. Registered anyway so it's not silently absent
 * from the special-case coverage list.
 */
export const brynhirThundersong: SpecialCaseHandler = {
  cardId: "brynhir-thundersong",
};
