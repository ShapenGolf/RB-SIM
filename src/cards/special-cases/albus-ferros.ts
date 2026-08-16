import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

/**
 * When you play me, spend any number of buffs. For each buff spent, channel 1 rune exhausted.
 *
 * Simplification: "any number" auto-resolves to spending every friendly buffed unit's buff (no
 * real downside — see docs/data-sourcing.md), each one channeling 1 exhausted rune.
 */
export const albusFerros: SpecialCaseHandler = {
  cardId: "albus-ferros",
  onPlay: (ctx) => {
    const player = ctx.game.players[ctx.instance.controller];
    let spent = 0;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller || !instance.statuses.buffed) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      instance.statuses.buffed = false;
      spent += 1;
    }
    for (let i = 0; i < spent; i += 1) {
      const rune = player.runeDeck.shift();
      if (rune) {
        rune.exhausted = true;
        player.runePool.push(rune);
      }
    }
  },
};
