import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { readyInstance } from "./ready-helpers";

/**
 * When you conquer here, you may ready a friendly gear. If it's an Equipment, you may detach it.
 *
 * Simplification: readies the first exhausted friendly gear found (see docs/data-sourcing.md);
 * the optional detach isn't taken (no clear default — detaching isn't strictly better).
 */
export const veiledTemple: SpecialCaseHandler = {
  cardId: "veiled-temple",
  onConquerHere: (ctx) => {
    const target = Object.values(ctx.game.instances).find(
      (i) => i.controller === ctx.instance.controller && i.exhausted && getCard(i.cardId).type === "gear",
    );
    if (target) readyInstance(ctx.game, getCard, target.instanceId);
  },
};
