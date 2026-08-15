import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

const XP_COST = 2;

/**
 * When you play me, choose an opponent. They reveal their hand. You may pay 2 XP to choose a
 * card from their hand. If you do, they discard that card and draw 1.
 *
 * Simplification: always pays if the controller has 2+ XP (clear value — see
 * docs/data-sourcing.md); discards the opponent's highest-Energy-cost card (highest impact).
 */
export const insightfulInvestigator: SpecialCaseHandler = {
  cardId: "insightful-investigator",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    if (player.xp < XP_COST) return;
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    const enemy = ctx.game.players[enemyId];
    if (enemy.hand.length === 0) return;

    let bestIdx = 0;
    let bestCost = getCard(enemy.hand[0]).energyCost ?? 0;
    for (let i = 1; i < enemy.hand.length; i += 1) {
      const cost = getCard(enemy.hand[i]).energyCost ?? 0;
      if (cost > bestCost) {
        bestCost = cost;
        bestIdx = i;
      }
    }

    player.xp -= XP_COST;
    const [discarded] = enemy.hand.splice(bestIdx, 1);
    enemy.trash.push(discarded);
    const drawn = enemy.mainDeck.shift();
    if (drawn) enemy.hand.push(drawn);
  },
};
