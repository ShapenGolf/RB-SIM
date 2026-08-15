import type { SpecialCaseHandler } from "./types";

const MIGHT_BONUS = 1;

/**
 * [Empower] 2 Energy. When I become [Empowered], [Predict 2]. [Empowered][>] I have +1 Might.
 *
 * Simplification: [Predict 2] (look at the top 2 cards, recycle any) is approximated as a single
 * Predict (the generic pendingPredict flag only models looking at 1 card — see game/moves.ts
 * resolvePredict) — a documented gap, matching eclipse.ts's precedent for unmodeled Predict N.
 */
export const apprenticeMage: SpecialCaseHandler = {
  cardId: "apprentice-mage",
  empowerCost: { energy: 2 },
  onBecomeEmpowered: (ctx) => {
    ctx.game.players[ctx.instance.controller].pendingPredict = true;
  },
  staticMightModifier: (ctx) => (ctx.instance.statuses.empowered ? MIGHT_BONUS : 0),
};
