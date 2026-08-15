import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { dealSpellDamage } from "../../game/spellDamage";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const DAMAGE = 2;

/**
 * Spend my buff: Choose one you've not chosen this turn — Deal 2 to a unit at a battlefield. /
 * Stun a unit at a battlefield. / Ready me. / Give me [Ganking] this turn.
 *
 * "Not chosen this turn" rotation isn't tracked (see docs/data-sourcing.md) — always resolves the
 * damage mode, the most broadly useful one. No player choice of which unit — targets the
 * strongest enemy unit at a battlefield.
 */
export const udyrWildman: SpecialCaseHandler = {
  cardId: "udyr-wildman",
  activatedAbilityCost: { energy: 0, exhaustSelf: false, spendBuff: true },
  onActivate: (ctx) => {
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
  },
};
