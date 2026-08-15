import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

/**
 * When you play me, you may spend a buff to buff me and ready me. (If I don't have a buff, I
 * get a +1 Might buff.)
 *
 * Simplification: no player choice — spends another friendly unit's buff (arbitrary pick) if
 * one exists, since readying itself for free on top of a wash on total buff count is close to
 * strictly beneficial (see docs/data-sourcing.md).
 */
export const wildclawShaman: SpecialCaseHandler = {
  cardId: "wildclaw-shaman",
  onPlay: (ctx) => {
    const source = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== ctx.instance.controller) return false;
      if (i.instanceId === ctx.instance.instanceId) return false;
      if (!i.statuses.buffed) return false;
      const t = getCard(i.cardId).type;
      return t === "unit" || t === "champion";
    });
    if (!source) return;
    source.statuses.buffed = false;
    ctx.instance.statuses.buffed = true;
    ctx.instance.exhausted = false;
  },
};
