import type { SpecialCaseHandler } from "./types";
import { createInstance } from "../../game/setup";

/**
 * When you play this, play a 1 Might Recruit unit token at your base.
 * Kill this: Recycle up to 4 cards from trashes.
 *
 * Assumption: "trashes" (plural) is read as the controller's own trash — unclear whether it
 * means both players' trash piles combined; no rules citation available to confirm.
 */
export const forgeOfTheFuture: SpecialCaseHandler = {
  cardId: "forge-of-the-future",
  onPlay: (ctx) => {
    const token = createInstance(ctx.game, "token-recruit", ctx.instance.controller);
    ctx.game.players[ctx.instance.controller].base.push(token.instanceId);
  },
  activatedAbilityCost: { energy: 0, exhaustSelf: false, killSelf: true },
  onActivate: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    for (let i = 0; i < 4; i += 1) {
      const recycled = controller.trash.shift();
      if (recycled) controller.mainDeck.push(recycled);
    }
  },
};
