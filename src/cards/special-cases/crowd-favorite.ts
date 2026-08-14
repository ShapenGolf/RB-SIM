import type { SpecialCaseHandler } from "./types";

/** [Hunt] Spend 2 XP: [Buff] me. */
export const crowdFavorite: SpecialCaseHandler = {
  cardId: "crowd-favorite",
  activatedAbilityCost: { energy: 0, exhaustSelf: false, spendXP: 2 },
  onActivate: (ctx) => {
    ctx.instance.statuses.buffed = true;
  },
};
