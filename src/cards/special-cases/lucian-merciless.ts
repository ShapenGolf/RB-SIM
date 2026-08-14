import type { SpecialCaseHandler } from "./types";

/** [Weaponmaster] The first time I conquer each turn, ready me. */
export const lucianMerciless: SpecialCaseHandler = {
  cardId: "lucian-merciless",
  onConquer: (ctx) => {
    if (ctx.instance.statuses.conqueredOnceThisTurn) return;
    ctx.instance.statuses.conqueredOnceThisTurn = true;
    ctx.instance.exhausted = false;
  },
};
