import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";

const MAX_MIGHT = 3;

/** [Reaction] Return a unit at a battlefield with 3 Might or less to its owner's hand. */
export const gust: SpecialCaseHandler = {
  cardId: "gust",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.zone !== "battlefield" || target.battlefieldIndex === null) return;
    if (computeMight(ctx.game, getCard, target, "none") > MAX_MIGHT) return;

    const slot = ctx.game.battlefields[target.battlefieldIndex];
    slot.units[target.controller] = slot.units[target.controller].filter((id) => id !== targetInstanceId);
    delete ctx.game.instances[targetInstanceId];
    ctx.game.players[target.controller].hand.push(target.cardId);
  },
};
