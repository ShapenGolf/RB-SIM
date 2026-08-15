import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

/**
 * This enters exhausted. Exhaust: Empower another gear. (It becomes Empowered if it's not
 * already.)
 *
 * "This enters exhausted" needs no bespoke code — every new instance already enters exhausted by
 * default (see game/setup.ts createInstance). Simplification: no player choice of which other
 * gear (see docs/data-sourcing.md) — picks the first non-Empowered friendly gear found.
 */
export const hextechFormula: SpecialCaseHandler = {
  cardId: "hextech-formula",
  activatedAbilityCost: { energy: 0, exhaustSelf: true },
  onActivate: (ctx) => {
    const target = Object.values(ctx.game.instances).find((i) => {
      if (i.controller !== ctx.instance.controller || i.instanceId === ctx.instance.instanceId) return false;
      return getCard(i.cardId).type === "gear" && !i.statuses.empowered;
    });
    if (target) target.statuses.empowered = true;
  },
};
