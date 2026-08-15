import { computeMight } from "../../game/might";
import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

const MIGHTY_THRESHOLD = 10;

/**
 * 1 Energy: Give me +1 Might this turn.
 * When my Might becomes 10 or more, empower me.
 * [Empowered][>] I have [Ganking] and [Deflect].
 *
 * Known gap: the conditional Deflect grant isn't modeled (no hook for conditionally granting
 * Deflect — see docs/data-sourcing.md); Ganking is covered via hasConditionalGanking.
 */
export const renektonBrute: SpecialCaseHandler = {
  cardId: "renekton-brute",
  activatedAbilityCost: { energy: 1, exhaustSelf: false },
  onActivate: (ctx) => {
    ctx.instance.tempMightBonus += 1;
    if (computeMight(ctx.game, getCard, ctx.instance, "none") >= MIGHTY_THRESHOLD) {
      ctx.instance.statuses.empowered = true;
      ctx.instance.statuses.everEmpowered = true;
    }
  },
  hasConditionalGanking: (ctx) => Boolean(ctx.instance.statuses.empowered),
};
