import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

const MIGHT_BONUS = 1;

/**
 * [Reaction] [Repeat] 1 Energy Rune (You may pay the additional cost to repeat this spell's
 * effect.) Give your Mechs +1 Might this turn.
 *
 * [Repeat] isn't wired up (~24 occurrences, deliberately not built — see docs/data-sourcing.md)
 * — only the base single resolution is implemented. Reaction timing isn't modeled.
 */
export const dangerZone: SpecialCaseHandler = {
  cardId: "danger-zone",
  onPlay: (ctx) => {
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      if (!(getCard(instance.cardId).tags ?? []).includes("Mech")) continue;
      instance.tempMightBonus += MIGHT_BONUS;
    }
  },
};
