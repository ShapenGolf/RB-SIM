import { getCard } from "../db";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] Choose one — Empower a unit, disempower it at end of turn. / Disempower a unit
 * that's [Empowered], empower it at end of turn.
 *
 * Reaction timing isn't modeled. Simplification: always picks the first mode (empower a friendly
 * unit now, disempower it at end of turn) — the strictly beneficial-to-self option (see
 * docs/data-sourcing.md). No player choice of which unit — picks the strongest friendly unit not
 * already Empowered.
 */
export const sanction: SpecialCaseHandler = {
  cardId: "sanction",
  onPlay: (ctx) => {
    let best: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller || instance.statuses.empowered) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!best) best = instance;
    }
    if (!best) return;
    best.statuses.empowered = true;
    ctx.game.pendingDisempowerAtEndOfTurn.push(best.instanceId);
  },
};
