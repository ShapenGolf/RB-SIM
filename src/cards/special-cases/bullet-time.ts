import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";
import type { SpecialCaseHandler } from "./types";

/**
 * [Action] (Play on your turn or in showdowns.)
 * Pay any amount of Rune to deal that much damage to all enemy units at a battlefield.
 *
 * [Action] timing isn't modeled — resolves instantly like every other spell. No player choice of
 * "any amount" (established precedent) — spends the entire rune pool, mirroring Power Nexus's
 * domain-less Rune payment (removed from the pool, returned to the rune deck, no exhausted
 * check). No player choice of which battlefield either — auto-picks the one with the most enemy
 * units, to maximize value; does nothing if the pool is empty or no battlefield has enemy units.
 */
export const bulletTime: SpecialCaseHandler = {
  cardId: "bullet-time",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    const amount = player.runePool.length;
    if (amount === 0) return;
    const opponentId = ctx.instance.controller === "0" ? "1" : "0";

    let bestIndex = -1;
    let bestCount = 0;
    ctx.game.battlefields.forEach((slot, index) => {
      const count = slot.units[opponentId].length;
      if (count > bestCount) {
        bestCount = count;
        bestIndex = index;
      }
    });
    if (bestIndex === -1) return;

    for (let i = 0; i < amount; i += 1) {
      const rune = player.runePool.shift();
      if (rune) player.runeDeck.push(rune);
    }
    for (const instanceId of [...ctx.game.battlefields[bestIndex].units[opponentId]]) {
      dealSpellDamage(ctx.game, getCard, instanceId, amount, ctx.instance.controller);
    }
  },
};
