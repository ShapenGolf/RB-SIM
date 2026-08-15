import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * Give a friendly unit +1 Might this turn. It can't be chosen by enemy spells and abilities
 * this turn.
 * Flow (play from trash for its Flow cost, then banish) isn't wired up yet — see
 * docs/data-sourcing.md; this covers the card's baseline effect.
 *
 * Known gap: the target-immunity clause isn't modeled (no hook for "can't be chosen" — see
 * docs/data-sourcing.md). Simplification: no player choice of target — picks the controller's
 * strongest ready friendly unit.
 */
export const twilightShroud: SpecialCaseHandler = {
  cardId: "twilight-shroud",
  onPlay: (ctx) => {
    let best: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      if (instance.exhausted) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!best || computeMight(ctx.game, getCard, instance, "none") > computeMight(ctx.game, getCard, best, "none")) {
        best = instance;
      }
    }
    if (best) best.tempMightBonus += 1;
  },
};
