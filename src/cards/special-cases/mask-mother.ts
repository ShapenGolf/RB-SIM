import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const MIGHT_BONUS = 2;

/**
 * When you discard me, you may pay 1 Energy to give a friendly unit +2 Might this turn.
 *
 * Simplification: the "may" always resolves yes when the controller can afford it and has a
 * legal target — approximated as always paying if a friendly unit exists (see
 * docs/data-sourcing.md, no real UI decision point at discard time). No player choice of which
 * unit — buffs the strongest friendly unit.
 */
export const maskMother: SpecialCaseHandler = {
  cardId: "mask-mother",
  onSelfDiscarded: (game, playerId) => {
    let strongest: CardInstance | undefined;
    for (const instance of Object.values(game.instances)) {
      if (instance.controller !== playerId) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!strongest || computeMight(game, getCard, instance, "none") > computeMight(game, getCard, strongest, "none")) {
        strongest = instance;
      }
    }
    if (strongest) strongest.tempMightBonus += MIGHT_BONUS;
  },
};
