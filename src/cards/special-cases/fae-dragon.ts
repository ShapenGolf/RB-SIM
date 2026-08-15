import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

const MAX_BUFFED = 4;

/**
 * When you play me, buff up to four friendly units.
 * When you spend a buff, play a Gold gear token exhausted.
 *
 * Known gap: "When you spend a buff, play a Gold gear token exhausted" isn't modeled — no
 * onAllyBuffSpent broadcast hook exists in this engine (see docs/data-sourcing.md). Only the
 * onPlay buff effect is implemented.
 */
export const faeDragon: SpecialCaseHandler = {
  cardId: "fae-dragon",
  onPlay: (ctx) => {
    let buffed = 0;
    for (const instance of Object.values(ctx.game.instances)) {
      if (buffed >= MAX_BUFFED) break;
      if (instance.controller !== ctx.instance.controller) continue;
      if (instance.statuses.buffed) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      instance.statuses.buffed = true;
      buffed += 1;
    }
  },
};
