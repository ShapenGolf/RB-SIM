import type { SpecialCaseHandler } from "./types";

const RUNE_THRESHOLD = 7;

/** While you control 7 or more runes, prevent all damage that enemy spells and abilities would deal to me. */
export const esteemedHierophant: SpecialCaseHandler = {
  cardId: "esteemed-hierophant",
  preventsEnemySpellDamage: (ctx) =>
    ctx.game.players[ctx.instance.controller].runePool.length >= RUNE_THRESHOLD,
};
