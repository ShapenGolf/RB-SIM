import type { SpecialCaseHandler } from "./types";
import { playTokenToBase } from "./token-helpers";

/**
 * Play a 3 Might Mech unit token.
 * [Flow] is now wired generically (see game/moves.ts playFromTrash, cards/db.ts parseFlowCost) —
 * this handler's onPlay is reused verbatim whether played from hand or from trash via Flow.
 */
export const iterativeDesign: SpecialCaseHandler = {
  cardId: "iterative-design",
  onPlay: (ctx) => {
    playTokenToBase(ctx.game, "token-mech-3", ctx.instance.controller);
  },
};
