import type { SpecialCaseContext, SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/**
 * When you play me or when I hold, look at the top 4 cards of your Main Deck. You may reveal a
 * gear from among them and draw it. Then recycle the rest.
 *
 * Simplification: no player choice of which gear (see docs/data-sourcing.md) — takes the first
 * one found. The "may" auto-resolves to taking it when available.
 */
function lookAndTakeGear(ctx: SpecialCaseContext): void {
  const controller = ctx.game.players[ctx.instance.controller];
  const looked = controller.mainDeck.splice(0, 4);
  const gearIdx = looked.findIndex((id) => getCard(id).type === "gear");
  if (gearIdx === -1) {
    for (const id of looked) controller.mainDeck.push(id);
    return;
  }
  const [gear] = looked.splice(gearIdx, 1);
  controller.hand.push(gear);
  for (const id of looked) controller.mainDeck.push(id);
}

export const ornnBlacksmith: SpecialCaseHandler = {
  cardId: "ornn-blacksmith",
  onPlay: (ctx) => lookAndTakeGear(ctx),
  onHold: (ctx) => lookAndTakeGear(ctx),
};
