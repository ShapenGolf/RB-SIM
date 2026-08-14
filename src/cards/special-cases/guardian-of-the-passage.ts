import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/**
 * When I hold, you may return a unit or gear from your trash to your hand.
 *
 * Simplification: no player choice of which card (see docs/data-sourcing.md) — returns the
 * first unit or gear found in trash. The "may" auto-resolves to taking it.
 */
export const guardianOfThePassage: SpecialCaseHandler = {
  cardId: "guardian-of-the-passage",
  onHold: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const idx = controller.trash.findIndex((id) => {
      const type = getCard(id).type;
      return type === "unit" || type === "champion" || type === "gear";
    });
    if (idx === -1) return;
    const [chosen] = controller.trash.splice(idx, 1);
    controller.hand.push(chosen);
  },
};
