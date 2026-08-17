import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";
import type { SpecialCaseHandler } from "./types";

/**
 * [Hidden] The next time a friendly unit would die, kill this instead. Recall that unit
 * exhausted. (Send it to base. This isn't a move.)
 *
 * Armed as soon as it's in play (from hand or from Hidden alike). Uses `preventsAllyDeathHere`,
 * checked at the top of game/combat.ts destroyInstance; destroying
 * itself here (a nested destroyInstance call) both pays "kill this instead" and makes the ward
 * naturally single-use — once gone, it's no longer found by later would-die checks this turn.
 */
export const zhonyasHourglass: SpecialCaseHandler = {
  cardId: "zhonyas-hourglass",
  preventsAllyDeathHere: (ctx) => {
    destroyInstance(ctx.game, getCard, ctx.instance.instanceId);
    return true;
  },
};
