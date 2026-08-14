import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";
import { createInstance } from "../../game/setup";

const MAX_ENERGY_COST = 1;

/**
 * When you play me, you may kill a gear with Energy cost no more than 1 Energy. If you do, play
 * a Gold gear token exhausted.
 *
 * Simplification: no player choice of which gear (see docs/data-sourcing.md) — targets the
 * first eligible ENEMY gear found (killing your own gear for a token is rarely a real gain, so
 * this only auto-triggers when there's a genuine target).
 */
export const pickpocket: SpecialCaseHandler = {
  cardId: "pickpocket",
  onPlay: (ctx) => {
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";
    const target = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== opponentId) return false;
      const card = getCard(i.cardId);
      return card.type === "gear" && card.energyCost !== null && card.energyCost <= MAX_ENERGY_COST;
    });
    if (!target) return;
    destroyInstance(ctx.game, getCard, target.instanceId);
    const controller = ctx.instance.controller;
    const token = createInstance(ctx.game, "token-gold-gear", controller);
    token.exhausted = true;
    ctx.game.players[controller].base.push(token.instanceId);
  },
};
