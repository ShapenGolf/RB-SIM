import type { SpecialCaseHandler } from "./types";

/**
 * When a player plays a unit here, they may pay 1 Energy to [Buff] it. (Give it a +1 Might buff
 * if it doesn't have one.)
 *
 * Simplification: the 1-Energy cost isn't charged (established precedent, see treasure-hoard.ts)
 * — always buffs. Uses the new onCardPlayedHere broadcast (game/moves.ts resolvePlayedCard).
 */
export const valleyOfIdols: SpecialCaseHandler = {
  cardId: "valley-of-idols",
  onCardPlayedHere: (_ctx, playedCard, playedInstance) => {
    if (playedCard.type !== "unit" && playedCard.type !== "champion") return;
    if (playedInstance.statuses.buffed) return;
    playedInstance.statuses.buffed = true;
  },
};
