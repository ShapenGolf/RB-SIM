import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * You may pay 1 Energy as an additional cost to play me. When you play me, if you paid the
 * additional cost, banish a card from any trash to give a unit [Assault 2] this turn.
 *
 * Simplification: no player choice — banishes the front card of the controller's own trash if
 * it has one, otherwise the opponent's (see docs/data-sourcing.md); grants Assault 2 to the
 * controller's strongest ready friendly unit.
 */
export const gustMonk: SpecialCaseHandler = {
  cardId: "gust-monk",
  additionalPlayCostEnergy: () => 1,
  onPlay: (ctx) => {
    if (!ctx.instance.statuses.paidAdditionalCostThisTurn) return;
    const player = ctx.game.players[ctx.instance.controller];
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const enemy = ctx.game.players[enemyId];
    if (player.trash.length > 0) {
      player.trash.shift();
    } else if (enemy.trash.length > 0) {
      enemy.trash.shift();
    } else {
      return;
    }

    let best: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      if (instance.exhausted) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!best || computeMight(ctx.game, getCard, instance, "none") > computeMight(ctx.game, getCard, best, "none")) {
        best = instance;
      }
    }
    if (best) best.grantedThisTurn.push({ keyword: "assault", value: 2 });
  },
};
