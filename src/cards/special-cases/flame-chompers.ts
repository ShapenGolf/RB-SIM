import type { SpecialCaseHandler } from "./types";
import { SpecialCaseEngine } from "./registry";
import { playCardIgnoringCost } from "../../game/playFree";

/** When you discard me, you may pay Fury Rune to play me. */
export const flameChompers: SpecialCaseHandler = {
  cardId: "flame-chompers",
  onSelfDiscarded: (game, playerId) => {
    if (game.pendingOptionalCost) return;
    SpecialCaseEngine.offerOptionalCost(
      game,
      playerId,
      "flame-chompers",
      { energy: 0, runeDomain: "Fury" },
      "ogn-6",
    );
  },
  onOptionalCostPaid: (game, playerId, payload) => {
    if (!payload) return;
    const player = game.players[playerId];
    const idx = player.trash.indexOf(payload);
    if (idx === -1) return;
    player.trash.splice(idx, 1);
    playCardIgnoringCost(game, playerId, payload);
  },
};
