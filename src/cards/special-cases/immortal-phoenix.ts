import type { SpecialCaseHandler } from "./types";
import { SpecialCaseEngine } from "./registry";
import { playCardIgnoringCost } from "../../game/playFree";

/** [Assault 2] When you kill a unit with a spell, you may pay 1 Energy+Fury Rune to play me from your trash. */
export const immortalPhoenix: SpecialCaseHandler = {
  cardId: "immortal-phoenix",
  onTrashKillWithSpell: (game, playerId, cardId) => {
    if (game.pendingOptionalCost) return;
    SpecialCaseEngine.offerOptionalCost(
      game,
      playerId,
      "immortal-phoenix",
      { energy: 1, runeDomain: "Fury" },
      cardId,
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
