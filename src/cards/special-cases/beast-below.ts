import type { SpecialCaseHandler } from "./types";
import type { GameState } from "../../game/state";
import { getCard } from "../db";

function returnToHand(game: GameState, instanceId: string): void {
  const target = game.instances[instanceId];
  if (!target) return;
  if (target.zone === "battlefield" && target.battlefieldIndex !== null) {
    const slot = game.battlefields[target.battlefieldIndex];
    slot.units[target.controller] = slot.units[target.controller].filter((id) => id !== instanceId);
  } else {
    const owner = game.players[target.controller];
    owner.base = owner.base.filter((id) => id !== instanceId);
  }
  delete game.instances[instanceId];
  game.players[target.controller].hand.push(target.cardId);
}

/**
 * When you play me, return another friendly unit and an enemy unit to their owners' hands.
 *
 * Simplification: no player choice of which units (see docs/data-sourcing.md) — picks the
 * first friendly (excluding self) and first enemy unit found.
 */
export const beastBelow: SpecialCaseHandler = {
  cardId: "beast-below",
  onPlay: (ctx) => {
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const friendly = Object.values(ctx.game.instances).find((i) => {
      if (i.instanceId === ctx.instance.instanceId || i.controller !== ctx.instance.controller) return false;
      const type = getCard(i.cardId).type;
      return type === "unit" || type === "champion";
    });
    const enemy = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== opponentId) return false;
      const type = getCard(i.cardId).type;
      return type === "unit" || type === "champion";
    });
    if (friendly) returnToHand(ctx.game, friendly.instanceId);
    if (enemy) returnToHand(ctx.game, enemy.instanceId);
  },
};
