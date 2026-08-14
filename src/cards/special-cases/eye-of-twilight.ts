import type { SpecialCaseHandler } from "./types";

/** [Action] Exhaust: Give a friendly unit [Tank] this turn. */
export const eyeOfTwilight: SpecialCaseHandler = {
  cardId: "eye-of-twilight",
  activatedAbilityCost: { energy: 0, exhaustSelf: true },
  activateNeedsTarget: true,
  onActivate: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller) return;
    target.grantedThisTurn.push({ keyword: "tank" });
  },
};
