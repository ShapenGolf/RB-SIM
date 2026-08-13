import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";
import { applyStun } from "./stun";

/**
 * When I attack, reveal the top rune of your rune deck, then recycle it. Do one of the
 * following based on its domain: Fury Rune — Deal 2 to an enemy unit here and 1 to all other
 * enemy units here. Mind Rune — Draw 1. Order Rune — Stun an enemy unit.
 *
 * Simplification: no player choice of which unit to target (see docs/data-sourcing.md); the
 * Order branch's "an enemy unit" (no "here" qualifier in the text) picks the first enemy unit
 * found at any battlefield.
 */
export const twistedFateGambler: SpecialCaseHandler = {
  cardId: "twisted-fate-gambler",
  onAttack: (ctx) => {
    const controller = ctx.game.players[ctx.instance.controller];
    const revealed = controller.runeDeck.shift();
    if (!revealed) return;
    controller.runeDeck.push(revealed);

    const opponentId = ctx.instance.controller === "0" ? "1" : "0";

    if (revealed.domain === "Fury") {
      if (ctx.instance.battlefieldIndex === null) return;
      const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
      const enemiesHere = [...slot.units[opponentId]];
      const [first, ...rest] = enemiesHere;
      if (first && ctx.game.instances[first]) {
        dealSpellDamage(ctx.game, getCard, first, 2, ctx.instance.controller);
      }
      for (const id of rest) {
        if (!ctx.game.instances[id]) continue;
        dealSpellDamage(ctx.game, getCard, id, 1, ctx.instance.controller);
      }
    } else if (revealed.domain === "Mind") {
      const drawn = controller.mainDeck.shift();
      if (drawn) controller.hand.push(drawn);
    } else if (revealed.domain === "Order") {
      let enemyId: string | undefined;
      for (const slot of ctx.game.battlefields) {
        enemyId = slot.units[opponentId][0];
        if (enemyId) break;
      }
      if (enemyId) {
        const enemy = ctx.game.instances[enemyId];
        if (enemy) applyStun(ctx.game, getCard, enemy, ctx.instance.controller);
      }
    }
  },
};
