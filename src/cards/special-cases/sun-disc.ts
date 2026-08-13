import type { SpecialCaseHandler } from "./types";
import { KeywordEngine } from "../../keywords/registry";

/** Exhaust: Legion — The next unit you play this turn enters ready. */
export const sunDisc: SpecialCaseHandler = {
  cardId: "sun-disc",
  activatedAbilityCost: { energy: 0, exhaustSelf: true },
  onActivate: (ctx) => {
    if (!KeywordEngine.conditionalTriggerActive(ctx.game, ctx.card, ctx.instance)) return;
    ctx.game.players[ctx.instance.controller].nextUnitEntersReady = true;
  },
};
