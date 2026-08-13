import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/**
 * When you play me, return a gear from your trash to your hand.
 *
 * Simplification: no player choice of which gear (see docs/data-sourcing.md) — returns the
 * first gear found in trash.
 */
export const aspiringEngineer: SpecialCaseHandler = {
  cardId: "aspiring-engineer",
  onPlay: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const idx = controller.trash.findIndex((id) => getCard(id).type === "gear");
    if (idx === -1) return;
    const [chosen] = controller.trash.splice(idx, 1);
    controller.hand.push(chosen);
  },
};
