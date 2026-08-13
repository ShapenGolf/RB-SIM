import type { SpecialCaseHandler } from "./types";
import { createInstance } from "../../game/setup";

/** When you play me, play a ready 3 Might Sprite unit token with Temporary here. */
export const spriteMother: SpecialCaseHandler = {
  cardId: "sprite-mother",
  onPlay: (ctx) => {
    const token = createInstance(ctx.game, "token-sprite-temporary", ctx.instance.controller);
    token.exhausted = false;
    if (ctx.instance.zone === "battlefield" && ctx.instance.battlefieldIndex !== null) {
      token.zone = "battlefield";
      token.battlefieldIndex = ctx.instance.battlefieldIndex;
      ctx.game.battlefields[ctx.instance.battlefieldIndex].units[ctx.instance.controller].push(token.instanceId);
    } else {
      ctx.game.players[ctx.instance.controller].base.push(token.instanceId);
    }
  },
};
