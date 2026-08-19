import { getCard } from "../db";
import { readyInstance } from "./ready-helpers";
import type { SpecialCaseHandler } from "./types";

const MAX_READIED = 4;

/**
 * Ready up to 4 units, gear, and/or runes.
 *
 * Simplification: no player choice of which — always beneficial, so readies up to 4 exhausted
 * friendly units/gear/runes found, in no particular priority order (see docs/data-sourcing.md).
 */
export const accelerationGate: SpecialCaseHandler = {
  cardId: "acceleration-gate",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    let readied = 0;
    for (const instance of Object.values(ctx.game.instances)) {
      if (readied >= MAX_READIED) break;
      if (instance.controller !== ctx.instance.controller) continue;
      if (!instance.exhausted) continue;
      const type = getCard(instance.cardId).type;
      if (type !== "unit" && type !== "champion" && type !== "gear") continue;
      readyInstance(ctx.game, getCard, instance.instanceId);
      readied += 1;
    }
    for (const rune of player.runePool) {
      if (readied >= MAX_READIED) break;
      if (!rune.exhausted) continue;
      rune.exhausted = false;
      readied += 1;
    }
  },
};
