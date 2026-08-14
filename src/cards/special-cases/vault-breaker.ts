import type { SpecialCaseHandler } from "./types";

/** [Action] Give a unit [Assault 2] and [Ganking] this turn. */
export const vaultBreaker: SpecialCaseHandler = {
  cardId: "vault-breaker",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target) return;
    target.grantedThisTurn.push({ keyword: "assault", value: 2 }, { keyword: "ganking" });
  },
};
