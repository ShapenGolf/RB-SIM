import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/**
 * [Accelerate] (generic keyword, already wired.)
 * When I move from a location, play a 3 Might Sprite unit token with [Temporary] there.
 *
 * Uses the fromBattlefieldIndex now passed to onMoveFromBattlefield (see move-helpers.ts).
 */
export const lilliaFaeFawn: SpecialCaseHandler = {
  cardId: "lillia-fae-fawn",
  onMoveFromBattlefield: (ctx, fromBattlefieldIndex) => {
    const token = playTokenToBase(ctx.game, "token-sprite-temporary", ctx.instance.controller);
    ctx.game.players[ctx.instance.controller].base = ctx.game.players[ctx.instance.controller].base.filter(
      (id) => id !== token.instanceId,
    );
    token.zone = "battlefield";
    token.battlefieldIndex = fromBattlefieldIndex;
    ctx.game.battlefields[fromBattlefieldIndex].units[ctx.instance.controller].push(token.instanceId);
  },
};
