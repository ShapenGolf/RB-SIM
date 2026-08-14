import type { SpecialCaseHandler } from "./types";

const LEVEL_THRESHOLD = 6;

/**
 * [Hunt 2] [Level 6] I have [Deflect] and [Ganking].
 *
 * Only the Ganking half is implemented (see mosstomper.ts for why Deflect can't be
 * conditionally granted yet).
 */
export const masterYiTempered: SpecialCaseHandler = {
  cardId: "master-yi-tempered",
  hasConditionalGanking: (ctx) => ctx.game.players[ctx.instance.controller].xp >= LEVEL_THRESHOLD,
};
