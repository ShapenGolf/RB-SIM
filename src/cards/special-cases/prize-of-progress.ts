import type { SpecialCaseHandler } from "./types";

/**
 * When you use an activated ability of a gear, give me +1 Might this turn.
 *
 * Uses the new onAllyActivatedGearAbility broadcast (game/moves.ts activateAbility, gated on
 * card.type === "gear") — fires for both data-driven TemplatedActions and bespoke onActivate
 * gear abilities alike.
 */
export const prizeOfProgress: SpecialCaseHandler = {
  cardId: "prize-of-progress",
  onAllyActivatedGearAbility: (ctx) => {
    ctx.instance.tempMightBonus += 1;
  },
};
