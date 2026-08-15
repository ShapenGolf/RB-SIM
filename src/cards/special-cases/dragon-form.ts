import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const TARGET_MIGHT = 5;

/**
 * Choose a unit. Its base Might becomes 5 this turn.
 * Flow (play from trash for its Flow cost, then banish) isn't wired up yet — see
 * docs/data-sourcing.md; this covers the card's baseline effect.
 *
 * Simplification: no player choice — picks the controller's weakest friendly unit (biggest
 * relative gain). Approximated as a temporary Might delta bringing current Might to 5, rather
 * than a true base-Might override (see docs/data-sourcing.md).
 */
export const dragonForm: SpecialCaseHandler = {
  cardId: "dragon-form",
  onPlay: (ctx) => {
    let weakest: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!weakest || computeMight(ctx.game, getCard, instance, "none") < computeMight(ctx.game, getCard, weakest, "none")) {
        weakest = instance;
      }
    }
    if (!weakest) return;
    const current = computeMight(ctx.game, getCard, weakest, "none");
    weakest.tempMightBonus += TARGET_MIGHT - current;
  },
};
