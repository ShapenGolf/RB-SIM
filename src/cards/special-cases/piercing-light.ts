import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { dealSpellDamage } from "../../game/spellDamage";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const DAMAGE = 2;

/**
 * Deal 2 to a unit at a battlefield, then deal 2 to up to one other unit.
 * Repeat (pay 2 EnergyFury Rune to repeat) isn't wired up yet — see docs/data-sourcing.md; this
 * covers the card's baseline single effect.
 *
 * Simplification: no player choice of targets — hits the weakest enemy unit at a battlefield,
 * then (if it survives being hit or another exists) the weakest remaining enemy unit anywhere.
 */
export const piercingLight: SpecialCaseHandler = {
  cardId: "piercing-light",
  onPlay: (ctx) => {
    const enemyId = ctx.instance.controller === "0" ? "1" : "0";
    let primary: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== enemyId || instance.zone !== "battlefield") continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!primary || computeMight(ctx.game, getCard, instance, "none") < computeMight(ctx.game, getCard, primary, "none")) {
        primary = instance;
      }
    }
    if (primary) dealSpellDamage(ctx.game, getCard, primary.instanceId, DAMAGE, ctx.instance.controller);

    let secondary: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== enemyId) continue;
      if (primary && instance.instanceId === primary.instanceId) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!secondary || computeMight(ctx.game, getCard, instance, "none") < computeMight(ctx.game, getCard, secondary, "none")) {
        secondary = instance;
      }
    }
    if (secondary) dealSpellDamage(ctx.game, getCard, secondary.instanceId, DAMAGE, ctx.instance.controller);
  },
};
