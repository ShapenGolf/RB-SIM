import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { readyInstance } from "./ready-helpers";

/** [Weaponmaster] The first time I conquer each turn, ready me. */
export const lucianMerciless: SpecialCaseHandler = {
  cardId: "lucian-merciless",
  onConquer: (ctx) => {
    if (ctx.instance.statuses.conqueredOnceThisTurn) return;
    ctx.instance.statuses.conqueredOnceThisTurn = true;
    readyInstance(ctx.game, getCard, ctx.instance.instanceId);
  },
};
