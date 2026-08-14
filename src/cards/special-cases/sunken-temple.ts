import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";

const MIGHTY_THRESHOLD = 5;

/**
 * When you conquer here with one or more [Mighty] units, you may pay 1 Energy to draw 1.
 *
 * Simplification: the 1-Energy cost isn't charged (see docs/data-sourcing.md).
 */
export const sunkenTemple: SpecialCaseHandler = {
  cardId: "sunken-temple",
  onConquerHere: (ctx, conqueringUnitIds) => {
    const hasMighty = conqueringUnitIds.some((id) => {
      const instance = ctx.game.instances[id];
      return instance && computeMight(ctx.game, getCard, instance, "none") >= MIGHTY_THRESHOLD;
    });
    if (!hasMighty) return;
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
