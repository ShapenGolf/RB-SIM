import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";

/**
 * When this leaves the board, draw 1 and channel 1 rune exhausted.
 * Chaos Rune, Exhaust: Kill this.
 */
export const treasureTrove: SpecialCaseHandler = {
  cardId: "treasure-trove",
  onDestroy: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const drawn = controller.mainDeck.shift();
    if (drawn) controller.hand.push(drawn);
    const rune = controller.runeDeck.shift();
    if (rune) {
      rune.exhausted = true;
      controller.runePool.push(rune);
    }
  },
  activatedAbilityCost: { energy: 0, runeDomain: "Chaos", exhaustSelf: true },
  onActivate: (ctx) => {
    destroyInstance(ctx.game, getCard, ctx.instance.instanceId);
  },
};
