import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/**
 * When you play me, return a spell from your trash to your hand.
 *
 * Simplification: no player choice of which spell (see docs/data-sourcing.md) — returns the
 * first spell found in trash.
 */
export const annieStubborn: SpecialCaseHandler = {
  cardId: "annie-stubborn",
  onPlay: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const idx = controller.trash.findIndex((id) => getCard(id).type === "spell");
    if (idx === -1) return;
    const [chosen] = controller.trash.splice(idx, 1);
    controller.hand.push(chosen);
  },
};
