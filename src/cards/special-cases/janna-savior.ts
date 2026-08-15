import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] (Play any time, even before spells and abilities resolve, including to a
 * battlefield you control.)
 * When you play me, heal your units here, then move an enemy unit from here to its base.
 *
 * Simplification: only applies "here" when Janna is played directly to a Battlefield (via
 * Ambush) — a normal play to base has no "here" location to heal/bounce from. No player choice
 * of which enemy unit to bounce — picks the strongest.
 */
export const jannaSavior: SpecialCaseHandler = {
  cardId: "janna-savior",
  onPlay: (ctx) => {
    if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    const controller = ctx.instance.controller;
    const enemyId = controller === "0" ? "1" : "0";

    for (const id of slot.units[controller]) {
      const instance = ctx.game.instances[id];
      if (instance) instance.damage = 0;
    }

    let strongest: string | undefined;
    let strongestMight = -Infinity;
    for (const id of slot.units[enemyId]) {
      const instance = ctx.game.instances[id];
      if (!instance) continue;
      const might = getCard(instance.cardId).might ?? 0;
      if (might > strongestMight) {
        strongestMight = might;
        strongest = id;
      }
    }
    if (!strongest) return;
    slot.units[enemyId] = slot.units[enemyId].filter((id) => id !== strongest);
    const target = ctx.game.instances[strongest];
    target.zone = "base";
    target.battlefieldIndex = null;
    ctx.game.players[enemyId].base.push(strongest);
  },
};
