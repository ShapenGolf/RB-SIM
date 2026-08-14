import type { SpecialCaseHandler } from "./types";

/**
 * [Action] Choose an enemy unit at a battlefield. Its owner places it on the top or bottom of
 * their Main Deck.
 *
 * Simplification: always the bottom (see docs/data-sourcing.md) — no choice-UI for top/bottom.
 */
export const keepersVerdict: SpecialCaseHandler = {
  cardId: "keepers-verdict",
  needsPlayTarget: true,
  onPlay: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.zone !== "battlefield" || target.battlefieldIndex === null) return;
    if (target.controller === ctx.instance.controller) return;

    const slot = ctx.game.battlefields[target.battlefieldIndex];
    slot.units[target.controller] = slot.units[target.controller].filter((id) => id !== targetInstanceId);
    delete ctx.game.instances[targetInstanceId];
    ctx.game.players[target.controller].mainDeck.push(target.cardId);
  },
};
