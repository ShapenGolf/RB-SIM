import type { SpecialCaseHandler } from "./types";

/**
 * When I move from a battlefield, give me +2 Might this turn.
 *
 * Known gap: only covers direct "move to base"/"move to another battlefield" effects (see
 * move-helpers.ts) — a Ganking attack move (game/moves.ts attackBattlefield) doesn't go through
 * those helpers and isn't covered.
 */
export const harpoonSquad: SpecialCaseHandler = {
  cardId: "harpoon-squad",
  onMoveFromBattlefield: (ctx) => {
    ctx.instance.tempMightBonus += 2;
  },
};
