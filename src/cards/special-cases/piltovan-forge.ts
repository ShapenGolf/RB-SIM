import type { SpecialCaseHandler } from "./types";

/**
 * While you control this battlefield, the first friendly gear activated ability played each turn
 * costs 1 Energy less.
 *
 * Moot — activated-ability cost has no equivalent of the play-cost reduction chain (costReduction/
 * costReductionFromAllies/costReductionFromControlledBattlefields) this session built for
 * game/moves.ts playCard; game/moves.ts activateAbility computes its own fixed cost object with
 * no reduction hooks at all. Extending that path for one card is out of scope right now
 * (deferred, see docs/data-sourcing.md). No fallback mode.
 */
export const piltovanForge: SpecialCaseHandler = {
  cardId: "piltovan-forge",
};
