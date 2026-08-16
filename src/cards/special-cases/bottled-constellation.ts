import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { destroyInstance } from "../../game/combat";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

const KILL_COUNT = 3;

/**
 * At the start of your Main Phase, you may kill 3 other friendly units and/or gear to score 1
 * point.
 *
 * "You may" with a real cost auto-resolves as always-yes when payable (established precedent) —
 * skipped if fewer than 3 other eligible units/gear exist. No player choice of which 3
 * (established precedent) — kills the 3 weakest (units ranked by Might, gear treated as
 * weakest/last since it has no Might).
 */
export const bottledConstellation: SpecialCaseHandler = {
  cardId: "bottled-constellation",
  onMainPhaseStart: (ctx) => {
    const candidates: CardInstance[] = [];
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller || instance.instanceId === ctx.instance.instanceId) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion" && t !== "gear") continue;
      candidates.push(instance);
    }
    if (candidates.length < KILL_COUNT) return;
    candidates.sort((a, b) => computeMight(ctx.game, getCard, a, "none") - computeMight(ctx.game, getCard, b, "none"));
    for (const instance of candidates.slice(0, KILL_COUNT)) {
      destroyInstance(ctx.game, getCard, instance.instanceId);
    }
    ctx.game.players[ctx.instance.controller].points += 1;
  },
};
