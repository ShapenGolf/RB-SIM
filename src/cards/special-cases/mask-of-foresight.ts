import type { SpecialCaseHandler } from "./types";
import type { CardInstance, GameState } from "../../game/state";

function isAlone(game: GameState, ally: CardInstance): boolean {
  if (ally.battlefieldIndex === null) return false;
  return game.battlefields[ally.battlefieldIndex].units[ally.controller].length === 1;
}

/** When a friendly unit attacks or defends alone, give it +1 Might this turn. */
export const maskOfForesight: SpecialCaseHandler = {
  cardId: "mask-of-foresight",
  attackingMightBonusForAlly: (ctx, ally) => {
    if (ally.controller !== ctx.instance.controller) return 0;
    return isAlone(ctx.game, ally) ? 1 : 0;
  },
  defendingMightBonusForAlly: (ctx, ally) => {
    if (ally.controller !== ctx.instance.controller) return 0;
    return isAlone(ctx.game, ally) ? 1 : 0;
  },
};
