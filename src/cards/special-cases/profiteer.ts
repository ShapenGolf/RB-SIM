import { getCard } from "../db";
import { computeMight } from "../../game/might";
import type { CardInstance } from "../../game/state";
import type { SpecialCaseHandler } from "./types";

/**
 * When you play me, you may disempower something you control to empower a legend, unit, or
 * gear.
 *
 * Known gap: the Legend can't be chosen as the disempower source or the empower target (no
 * clean way to pick between a live CardInstance and the Legend pseudo-state with a single
 * "strongest" heuristic — see docs/data-sourcing.md). Simplification: always does it if
 * eligible — disempowers any empowered friendly unit/gear, empowers the controller's strongest
 * not-yet-empowered friendly unit/gear.
 */
export const profiteer: SpecialCaseHandler = {
  cardId: "profiteer",
  onPlay: (ctx) => {
    const source = Object.values(ctx.game.instances).find(
      (i) => i.controller === ctx.instance.controller && i.statuses.empowered,
    );
    if (!source) return;

    let target: CardInstance | undefined;
    for (const instance of Object.values(ctx.game.instances)) {
      if (instance.controller !== ctx.instance.controller) continue;
      if (instance.instanceId === source.instanceId) continue;
      if (instance.statuses.empowered) continue;
      const t = getCard(instance.cardId).type;
      if (t !== "unit" && t !== "champion" && t !== "gear") continue;
      if (!target || computeMight(ctx.game, getCard, instance, "none") > computeMight(ctx.game, getCard, target, "none")) {
        target = instance;
      }
    }
    if (!target) return;

    source.statuses.empowered = false;
    target.statuses.empowered = true;
    target.statuses.everEmpowered = true;
  },
};
