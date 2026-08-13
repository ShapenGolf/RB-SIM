import type { SpecialCaseHandler } from "./types";

/** Give a unit Assault 3 this turn. (+3 Might while it's an attacker.) */
export const cleave: SpecialCaseHandler = {
  cardId: "cleave",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    target.grantedThisTurn.push({ keyword: "assault", value: 3 });
  },
};
