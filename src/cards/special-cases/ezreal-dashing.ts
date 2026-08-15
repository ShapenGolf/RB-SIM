import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { dealSpellDamage } from "../../game/spellDamage";
import { moveInstanceToBase } from "./move-helpers";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseContext, SpecialCaseHandler } from "./types";

/**
 * When I attack or defend, deal damage equal to my Might to an enemy unit here. I don't deal
 * combat damage. Mind Rune: [Action] — Move me to your base.
 *
 * Simplification: no player choice of which enemy unit (see docs/data-sourcing.md) — picks the
 * strongest one at the same battlefield. The Domain-Rune-only activated ability cost is never
 * charged (established precedent, see crescent-guardian.ts).
 */
function dealMightDamageHere(ctx: SpecialCaseContext): void {
  if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return;
  const enemyId = ctx.instance.controller === "0" ? "1" : "0";
  const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
  let strongest: CardInstance | undefined;
  for (const id of slot.units[enemyId]) {
    const instance = ctx.game.instances[id];
    if (!instance) continue;
    if (!strongest || computeMight(ctx.game, getCard, instance, "none") > computeMight(ctx.game, getCard, strongest, "none")) {
      strongest = instance;
    }
  }
  if (!strongest) return;
  const might = computeMight(ctx.game, getCard, ctx.instance, "none");
  dealSpellDamage(ctx.game, getCard, strongest.instanceId, might, ctx.instance.controller);
}

export const ezrealDashing: SpecialCaseHandler = {
  cardId: "ezreal-dashing",
  onAttack: (ctx) => dealMightDamageHere(ctx),
  onDefend: (ctx) => dealMightDamageHere(ctx),
  preventsCombatDamage: () => true,
  activatedAbilityCost: { energy: 0, runeDomain: "Mind", exhaustSelf: false },
  onActivate: (ctx) => {
    moveInstanceToBase(ctx.game, getCard, ctx.instance.instanceId);
  },
};
