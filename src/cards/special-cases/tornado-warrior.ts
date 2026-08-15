import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * [Hidden] When you play me from face down, you may empower something here. Disempower it at
 * end of turn.
 *
 * [Hidden]'s face-down timing isn't modeled — "played from face down" is approximated as always
 * true. Simplification: no player choice of what to empower — picks the strongest friendly unit
 * (other than itself) at the same battlefield that isn't already Empowered.
 */
export const tornadoWarrior: SpecialCaseHandler = {
  cardId: "tornado-warrior",
  onPlay: (ctx) => {
    if (ctx.instance.zone !== "battlefield" || ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    let best: CardInstance | undefined;
    for (const id of slot.units[ctx.instance.controller]) {
      if (id === ctx.instance.instanceId) continue;
      const instance = ctx.game.instances[id];
      if (!instance || instance.statuses.empowered) continue;
      if (!best || computeMight(ctx.game, getCard, instance, "none") > computeMight(ctx.game, getCard, best, "none")) {
        best = instance;
      }
    }
    if (!best) return;
    best.statuses.empowered = true;
    ctx.game.pendingDisempowerAtEndOfTurn.push(best.instanceId);
  },
};
