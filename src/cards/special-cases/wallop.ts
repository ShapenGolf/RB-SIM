import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * [Action] As you play this, you may spend a buff as an additional cost. If you do, ignore
 * this spell's cost. Ready a unit.
 *
 * Known gap: the "spend a buff to ignore this spell's cost" additional cost isn't wired up
 * (always paid at full cost — see docs/data-sourcing.md). No player choice of which unit to
 * ready — picks the controller's strongest exhausted friendly unit.
 */
export const wallop: SpecialCaseHandler = {
  cardId: "wallop",
  onPlay: (ctx) => {
    let best: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      if (!instance.exhausted) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion") continue;
      if (!best || computeMight(ctx.game, getCard, instance, "none") > computeMight(ctx.game, getCard, best, "none")) {
        best = instance;
      }
    }
    if (best) best.exhausted = false;
  },
};
