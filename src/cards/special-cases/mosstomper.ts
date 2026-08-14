import type { SpecialCaseHandler } from "./types";

const LEVEL_THRESHOLD = 3;

/**
 * [Hunt 2] [Level 3] I have +1 Might and [Deflect].
 *
 * Only the Might half is implemented — conditionally granting Deflect (a numeric
 * extra-targeting-cost keyword) has no override mechanism yet, unlike Ganking's
 * `hasConditionalGanking` (see docs/data-sourcing.md).
 */
export const mosstomper: SpecialCaseHandler = {
  cardId: "mosstomper",
  staticMightModifier: (ctx) =>
    ctx.game.players[ctx.instance.controller].xp >= LEVEL_THRESHOLD ? 1 : 0,
};
