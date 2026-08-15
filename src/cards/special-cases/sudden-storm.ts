import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { dealSpellDamage } from "../../game/spellDamage";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const DAMAGE = 2;

/**
 * [Hidden] [Action] Deal 2 to a unit at a battlefield. If it's attacking, deal 4 to it instead.
 *
 * [Hidden]'s face-down timing isn't modeled. "Attacking" is a momentary combat-role concept this
 * engine doesn't persist outside combat resolution (see docs/data-sourcing.md) — always deals the
 * base 2. No player choice of which unit — targets the strongest enemy unit at a battlefield.
 */
export const suddenStorm: SpecialCaseHandler = {
  cardId: "sudden-storm",
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
  },
};
