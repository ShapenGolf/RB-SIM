import type { SpecialCaseHandler } from "./types";
import { moveInstanceToBattlefield } from "./move-helpers";

/**
 * [Accelerate] (generic keyword, already wired.)
 * When I attack, you may move any number of your token units to this battlefield.
 *
 * Simplification: the "may" always resolves yes (no real downside) — moves every friendly token
 * unit to this battlefield.
 */
export const azirSovereign: SpecialCaseHandler = {
  cardId: "azir-sovereign",
  onAttack: (ctx) => {
    if (ctx.instance.battlefieldIndex === null) return;
    const battlefieldIndex = ctx.instance.battlefieldIndex;
    const tokenIds = Object.values(ctx.game.instances)
      .filter((i) => i.controller === ctx.instance.controller && i.cardId.startsWith("token-"))
      .map((i) => i.instanceId);
    for (const id of tokenIds) moveInstanceToBattlefield(ctx.game, id, battlefieldIndex);
  },
};
