import type { SpecialCaseHandler } from "./types";

/**
 * When a combat that I was in ends, empower me. (I become Empowered if I'm not already.)
 * [Empowered][>] I have +2 Might.
 *
 * This Empower is free and automatic (not player-paid), so it's granted directly here rather
 * than through the empowerCost/empowerInstance flow — onSurviveCombat fires exactly when a
 * Showdown this instance was part of ends and it's still alive.
 */
export const mournfulWitness: SpecialCaseHandler = {
  cardId: "mournful-witness",
  onSurviveCombat: (ctx) => {
    ctx.instance.statuses.empowered = true;
    ctx.instance.statuses.everEmpowered = true;
  },
  staticMightModifier: (ctx) => (ctx.instance.statuses.empowered ? 2 : 0),
};
