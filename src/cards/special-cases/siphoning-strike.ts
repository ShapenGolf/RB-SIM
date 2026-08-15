import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { dealSpellDamage } from "../../game/spellDamage";

/**
 * Deal 4 to a unit at a battlefield. If you control 7 or more runes, deal 7 to it instead.
 * When it dies this turn, channel 1 rune exhausted.
 * Simplification: the delayed "when it dies this turn" clause isn't modeled — the engine has no
 * generic per-cast delayed-trigger watcher (see docs/data-sourcing.md); the immediate damage is
 * the primary effect and is fully covered.
 */
export const siphoningStrike: SpecialCaseHandler = {
  cardId: "siphoning-strike",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.zone !== "battlefield") return;
    const runeCount = ctx.game.players[ctx.instance.controller].runePool.length;
    const amount = runeCount >= 7 ? 7 : 4;
    dealSpellDamage(ctx.game, getCard, targetInstanceId, amount, ctx.instance.controller);
  },
};
