import type { SpecialCaseHandler } from "./types";

const LEVEL_MIGHT_THRESHOLD = 6;
const LEVEL_READY_THRESHOLD = 11;
const MIGHT_BONUS = 1;

/** [Level 6] Your units have +1 Might. [Level 11] Your units enter ready. */
export const wujuMaster: SpecialCaseHandler = {
  cardId: "wuju-master",
  // staticMightModifierForAlly excludes self (see registry.ts), so the self-buff needs its own
  // check to make "Your units" (which includes Wuju Master herself) fully accurate.
  staticMightModifier: (ctx) =>
    ctx.game.players[ctx.instance.controller].xp >= LEVEL_MIGHT_THRESHOLD ? MIGHT_BONUS : 0,
  staticMightModifierForAlly: (ctx) =>
    ctx.game.players[ctx.instance.controller].xp >= LEVEL_MIGHT_THRESHOLD ? MIGHT_BONUS : 0,
  othersEnterReady: (ctx) => ctx.game.players[ctx.instance.controller].xp >= LEVEL_READY_THRESHOLD,
};
