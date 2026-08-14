import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

const TAGS = ["Bird", "Cat", "Dog", "Poro"];

/**
 * When you play me, return a Bird, Cat, Dog, or Poro from your trash to your hand.
 *
 * Simplification: no player choice of which card (see docs/data-sourcing.md) — returns the
 * first eligible one found.
 */
export const starhound: SpecialCaseHandler = {
  cardId: "starhound",
  onPlay: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const idx = controller.trash.findIndex((id) => {
      const tags = getCard(id).tags ?? [];
      return tags.some((t) => TAGS.includes(t));
    });
    if (idx === -1) return;
    const [chosen] = controller.trash.splice(idx, 1);
    controller.hand.push(chosen);
  },
};
