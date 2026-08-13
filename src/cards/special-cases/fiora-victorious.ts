import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { computeMight } from "../../game/might";

const MIGHTY_THRESHOLD = 5;

/**
 * While I'm Mighty (5+ Might), I have Deflect, Ganking, and Shield.
 *
 * Data quirk (see docs/data-sourcing.md "Bekannte Einschränkungen"): the bracket-import can't
 * tell a conditionally-granted keyword from a printed one, so this card's `keywords` array
 * already carries unconditional "ganking" and "shield" (Deflect too, but that's a no-op
 * either way — see Spirit's Refuge). hasConditionalGanking overrides Ganking entirely (see
 * registry.ts); defendingMightModifier cancels the printed Shield's +1 back out when not
 * Mighty, the same pattern used for Raging Soul's mis-imported Assault. Uses role "none" to
 * check Mighty rather than "defending", to avoid recursing back into this same hook.
 */
export const fioraVictorious: SpecialCaseHandler = {
  cardId: "fiora-victorious",
  hasConditionalGanking: (ctx) => computeMight(ctx.game, getCard, ctx.instance, "none") >= MIGHTY_THRESHOLD,
  defendingMightModifier: (ctx) =>
    computeMight(ctx.game, getCard, ctx.instance, "none") >= MIGHTY_THRESHOLD ? 0 : -1,
};
