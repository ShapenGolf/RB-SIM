import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/**
 * Your Mechs have [Deflect] and [Ganking].
 * I enter ready if you control another Mech.
 * Simplification: only the second clause (a conditional self-ready check) is modeled — granting
 * Deflect/Ganking to every ally with the "Mech" tag needs a new tag-scoped keyword-grant hook the
 * engine doesn't have yet (see docs/data-sourcing.md).
 */
export const breakneckMech: SpecialCaseHandler = {
  cardId: "breakneck-mech",
  selfEntersReady: (ctx) => {
    return Object.values(ctx.game.instances).some(
      (i) =>
        i.instanceId !== ctx.instance.instanceId &&
        i.controller === ctx.instance.controller &&
        getCard(i.cardId).tags?.includes("Mech"),
    );
  },
};
