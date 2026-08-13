import type { SpecialCaseHandler } from "./types";

/**
 * When you play a card on an opponent's turn, play a 1 Might Recruit unit token in your base.
 *
 * No-op by construction: the engine's turn structure (see game/game.ts — no
 * `activePlayers`/reaction stages configured) already restricts the `playCard` move to the
 * current player only, so a player can never play a card during their opponent's turn in the
 * first place. Same reasoning as Brynhir Thundersong (ogn-26).
 */
export const viktor: SpecialCaseHandler = {
  cardId: "viktor",
};
