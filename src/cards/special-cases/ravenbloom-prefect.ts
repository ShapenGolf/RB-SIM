import type { SpecialCaseHandler } from "./types";
import type { GameState, CardInstance } from "../../game/state";

function banish(game: GameState, instance: CardInstance): void {
  if (instance.zone === "battlefield" && instance.battlefieldIndex !== null) {
    const slot = game.battlefields[instance.battlefieldIndex];
    slot.units[instance.controller] = slot.units[instance.controller].filter((id) => id !== instance.instanceId);
  } else {
    const owner = game.players[instance.controller];
    owner.base = owner.base.filter((id) => id !== instance.instanceId);
  }
  delete game.instances[instance.instanceId];
  game.players[instance.controller].banishment.push(instance.cardId);
}

/**
 * When an opponent plays a gear, you may banish me to banish it. Always taken when able (a 1-for-1
 * removal trade for an enemy gear investment is close to strictly good — see docs/data-sourcing.md
 * no-real-choice simplification).
 */
export const ravenbloomPrefect: SpecialCaseHandler = {
  cardId: "ravenbloom-prefect",
  onEnemyCardPlayed: (ctx, playedCard, playedInstance) => {
    if (playedCard.type !== "gear") return;
    banish(ctx.game, playedInstance);
    banish(ctx.game, ctx.instance);
  },
};
