import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { dealSpellDamage } from "../../game/spellDamage";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * [Empower] 2 EnergyFury Rune.
 * When I move, you may deal 1 to a unit at a battlefield I moved to or from. If I'm
 * [Empowered], deal 2 instead.
 * [Empowered][>] I have +1 Might.
 *
 * Known gap: only "moved to" is modeled — by the time onMove fires the instance's previous
 * location is no longer tracked, so "or from" isn't reachable (see docs/data-sourcing.md).
 * Simplification: always deals the damage if a target exists (no real downside); hits the
 * weakest enemy unit at the destination battlefield.
 */
export const akaliDeadlyWeapon: SpecialCaseHandler = {
  cardId: "akali-deadly-weapon",
  empowerCost: { energy: 2, runeDomain: "Fury" },
  staticMightModifier: (ctx) => (ctx.instance.statuses.empowered ? 1 : 0),
  onMove: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    let target: CardInstance | undefined;
    for (const id of slot.units[enemyId]) {
      const instance = ctx.game.instances[id];
      if (!instance) continue;
      if (!target || computeMight(ctx.game, getCard, instance, "none") < computeMight(ctx.game, getCard, target, "none")) {
        target = instance;
      }
    }
    if (!target) return;
    const damage = ctx.instance.statuses.empowered ? 2 : 1;
    dealSpellDamage(ctx.game, getCard, target.instanceId, damage, ctx.instance.controller);
  },
};
