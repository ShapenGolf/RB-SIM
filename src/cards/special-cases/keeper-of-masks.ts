import { createInstance } from "../../game/setup";
import type { SpecialCaseHandler } from "./types";

const COPY_COUNT = 2;

/**
 * [Hidden] [Temporary] (already generic — Keeper of Masks itself is printed with [Temporary].)
 * When you play me, play two Reflection unit tokens here. They become copies of me.
 *
 * Simplification: rather than a generic blank "Reflection" token that transforms, this directly
 * creates fresh instances of Keeper of Masks's own card (matching name/Might/keywords exactly,
 * the practical meaning of "a copy") — matching mirror-image.ts's precedent. [Hidden]'s face-down
 * timing isn't modeled.
 */
export const keeperOfMasks: SpecialCaseHandler = {
  cardId: "keeper-of-masks",
  onPlay: (ctx) => {
    const controller = ctx.instance.controller;
    for (let i = 0; i < COPY_COUNT; i += 1) {
      const token = createInstance(ctx.game, ctx.instance.cardId, controller);
      if (ctx.instance.zone === "battlefield" && ctx.instance.battlefieldIndex !== null) {
        token.zone = "battlefield";
        token.battlefieldIndex = ctx.instance.battlefieldIndex;
        ctx.game.battlefields[ctx.instance.battlefieldIndex].units[controller].push(token.instanceId);
      } else {
        ctx.game.players[controller].base.push(token.instanceId);
      }
    }
  },
};
