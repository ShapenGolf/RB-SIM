import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { dealSpellDamage } from "../../game/spellDamage";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const DAMAGE = 6;

/**
 * [Reaction] Choose an enemy unit. Deal 6 to it unless its controller has you draw 2.
 *
 * Simplification: the opponent's alternative choice ("have you draw 2 instead") isn't modeled —
 * always resolves the primary damage effect (see docs/data-sourcing.md). Reaction timing isn't
 * modeled either. No player choice of which enemy unit — targets the strongest one.
 */
export const shakedown: SpecialCaseHandler = {
  cardId: "shakedown",
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
    if (strongest) dealSpellDamage(ctx.game, getCard, strongest.instanceId, DAMAGE, ctx.instance.controller);
  },
};
