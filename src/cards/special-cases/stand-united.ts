import { getCard } from "../db";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * [Hidden] [Action] Buff a friendly unit. Buffs give an additional +1 Might to friendly units
 * this turn.
 *
 * Known gap: the global "buffs give +1 additional Might this turn" modifier isn't modeled (would
 * require a per-turn flag consulted inside game/might.ts's core buff calc — see
 * docs/data-sourcing.md) — only the buff-a-unit clause is implemented. [Hidden]'s face-down
 * timing isn't modeled. Simplification: no player choice of which unit — buffs the weakest
 * friendly unit without a buff already.
 */
export const standUnited: SpecialCaseHandler = {
  cardId: "stand-united",
  onPlay: (ctx) => {
    let weakest: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller || instance.statuses.buffed) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!weakest) weakest = instance;
    }
    if (weakest) weakest.statuses.buffed = true;
  },
};
