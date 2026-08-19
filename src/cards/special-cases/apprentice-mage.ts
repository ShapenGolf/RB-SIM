import type { SpecialCaseHandler } from "./types";

const MIGHT_BONUS = 1;

/**
 * [Empower] 2 Energy. When I become [Empowered], [Predict 2]. [Empowered][>] I have +1 Might.
 */
export const apprenticeMage: SpecialCaseHandler = {
  cardId: "apprentice-mage",
  empowerCost: { energy: 2 },
  onBecomeEmpowered: (ctx) => {
    ctx.game.players[ctx.instance.controller].pendingPredict = 2;
  },
  staticMightModifier: (ctx) => (ctx.instance.statuses.empowered ? MIGHT_BONUS : 0),
};
