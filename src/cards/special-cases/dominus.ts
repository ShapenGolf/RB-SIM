import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * [Action] This turn, double a unit's Might and give it "Rune Rune: Ready me."
 *
 * Known gap: granting a new activated ability to an arbitrary unit isn't modeled (no generic
 * "grant an activated ability" mechanic — see docs/data-sourcing.md); only the Might-doubling is
 * implemented. Simplification: no player choice of which unit — doubles the controller's
 * strongest friendly unit, for the biggest impact.
 */
export const dominus: SpecialCaseHandler = {
  cardId: "dominus",
  onPlay: (ctx) => {
    let strongest: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!strongest || computeMight(ctx.game, getCard, instance, "none") > computeMight(ctx.game, getCard, strongest, "none")) {
        strongest = instance;
      }
    }
    if (!strongest) return;
    const might = computeMight(ctx.game, getCard, strongest, "none");
    strongest.tempMightBonus += might;
  },
};
