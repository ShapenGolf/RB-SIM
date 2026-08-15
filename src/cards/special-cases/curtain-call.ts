import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { dealSpellDamage } from "../../game/spellDamage";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const BATTLEFIELD_DAMAGE = 2;

/**
 * [Repeat] — 1 Energy / Rune / 1 Energy Rune (You may pay each additional cost to repeat this
 * spell's effect.) Choose one you haven't already chosen — Draw 1. / Deal 2 to a unit at a
 * battlefield. / Deal 3 to a unit at a base. / Give a unit at a battlefield -4 Might this turn.
 *
 * [Repeat] isn't wired up (~24 occurrences, deliberately not built — see docs/data-sourcing.md)
 * — only a single mode resolves, so the "haven't already chosen" tracking is moot.
 * Simplification: no player choice of mode (see docs/data-sourcing.md) — deals 2 to the weakest
 * enemy unit at a battlefield if one exists, otherwise draws 1.
 */
export const curtainCall: SpecialCaseHandler = {
  cardId: "curtain-call",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    let weakest: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== enemyId || instance.zone !== "battlefield") continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!weakest || computeMight(ctx.game, getCard, instance, "none") < computeMight(ctx.game, getCard, weakest, "none")) {
        weakest = instance;
      }
    }
    if (weakest) {
      dealSpellDamage(ctx.game, getCard, weakest.instanceId, BATTLEFIELD_DAMAGE, ctx.instance.controller);
      return;
    }
    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
