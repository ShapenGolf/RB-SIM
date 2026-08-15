import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";

/** When you play me, if you control 7 or more runes, choose an enemy gear. If it's [Empowered], disempower it. Otherwise, kill it. */
export const tombRaiderBarbara: SpecialCaseHandler = {
  cardId: "tomb-raider-barbara",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (ctx.game.players[ctx.instance.controller].runePool.length < 7) return;
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller === ctx.instance.controller) return;
    if (getCard(target.cardId).type !== "gear") return;
    if (target.statuses.empowered) {
      target.statuses.empowered = false;
    } else {
      destroyInstance(ctx.game, getCard, targetInstanceId);
    }
  },
};
