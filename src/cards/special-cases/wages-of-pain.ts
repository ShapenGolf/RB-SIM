import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { dealSpellDamage } from "../../game/spellDamage";
import { playTokenToBase } from "./token-helpers";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const DAMAGE = 3;

/**
 * [Hidden] [Action] Deal 3 to a unit at a battlefield. Play a Gold gear token exhausted.
 *
 * [Hidden]'s face-down timing isn't modeled. No player choice of which unit — targets the
 * strongest enemy unit at a battlefield.
 */
export const wagesOfPain: SpecialCaseHandler = {
  cardId: "wages-of-pain",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    let strongest: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== enemyId || instance.zone !== "battlefield") continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!strongest || computeMight(ctx.game, getCard, instance, "none") > computeMight(ctx.game, getCard, strongest, "none")) {
        strongest = instance;
      }
    }
    if (strongest) dealSpellDamage(ctx.game, getCard, strongest.instanceId, DAMAGE, ctx.instance.controller);
    playTokenToBase(ctx.game, "token-gold-gear", ctx.instance.controller);
  },
};
