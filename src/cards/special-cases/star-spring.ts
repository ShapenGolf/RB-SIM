import { getCard } from "../db";
import { moveInstanceToBase } from "./move-helpers";
import type { SpecialCaseHandler } from "./types";

/**
 * The first time a player plays a non-token unit here each turn, they may move another unit
 * they control here to its base.
 *
 * Uses BattlefieldSlot.chosenHereTriggeredThisTurn (same per-player, per-turn gate as The
 * Dreaming Tree's identical "first time each turn" shape — this field's name predates Star
 * Spring but isn't scoped to "chosen", just "first triggered here this turn per player") and the
 * onCardPlayedHere broadcast (see valley-of-idols.ts). Simplification: "you may" auto-resolves
 * to always moving a unit when one is available (established precedent) — no player choice of
 * which OTHER friendly unit here to send home, picks the first one found (excluding the unit
 * that was just played).
 */
export const starSpring: SpecialCaseHandler = {
  cardId: "star-spring",
  onCardPlayedHere: (ctx, playedCard, playedInstance, playingPlayer) => {
    // "Non-token unit" needs no extra filtering: tokens are created via token-helpers.ts
    // (playTokenHere/playTokenToBase), which never fires onCardPlayedHere — only a genuine
    // hand-played card reaches this hook at all. Champions don't count per the printed text.
    if (playedCard.type !== "unit") return;
    if (ctx.instance.battlefieldIndex === null) return;
    const slot = ctx.game.battlefields[ctx.instance.battlefieldIndex];
    if (!slot || slot.chosenHereTriggeredThisTurn?.[playingPlayer]) return;
    slot.chosenHereTriggeredThisTurn = { ...slot.chosenHereTriggeredThisTurn, [playingPlayer]: true };

    const otherId = slot.units[playingPlayer].find((id) => id !== playedInstance.instanceId);
    if (otherId) moveInstanceToBase(ctx.game, getCard, otherId);
  },
};
