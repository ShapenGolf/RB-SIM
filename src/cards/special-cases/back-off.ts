import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * [Hidden] [Stun] a unit. If you played this from your hand, draw 1.
 *
 * [Hidden]'s face-down/react-later timing isn't modeled — resolves immediately, always "played
 * from hand" in this engine, so the draw always applies. Simplification: no player choice of
 * which unit (see docs/data-sourcing.md) — Stuns the strongest enemy unit.
 */
export const backOff: SpecialCaseHandler = {
  cardId: "back-off",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    let strongest: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== enemyId) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!strongest || computeMight(ctx.game, getCard, instance, "none") > computeMight(ctx.game, getCard, strongest, "none")) {
        strongest = instance;
      }
    }
    if (strongest) strongest.statuses.stunned = true;

    const player = ctx.game.players[ctx.instance.controller];
    const drawn = player.mainDeck.shift();
    if (drawn) player.hand.push(drawn);
  },
};
