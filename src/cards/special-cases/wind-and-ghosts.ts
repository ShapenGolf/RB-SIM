import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { banishInstance } from "./banish-helpers";
import { returnInstanceToHand } from "./bounce-helpers";

/** [Action] Choose a unit at a battlefield. If it has 3 Might or less, banish it. Otherwise, return it to its owner's hand. */
export const windAndGhosts: SpecialCaseHandler = {
  cardId: "wind-and-ghosts",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.zone !== "battlefield") return;
    const might = computeMight(ctx.game, getCard, target, "none");
    if (might <= 3) {
      banishInstance(ctx.game, target);
    } else {
      returnInstanceToHand(ctx.game, targetInstanceId);
    }
  },
};
