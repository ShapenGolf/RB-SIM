import type { SpecialCaseHandler } from "./types";

/**
 * [Empower] 3 Energy+Body Rune (3 Energy+Body Rune: Empower me. Use only if not Empowered.)
 * [Empowered] I have +3 Might and can't be dealt damage unless I'm in combat.
 * Simplification: only the Might bonus is modeled — a "can't be dealt non-combat damage" immunity
 * needs a new engine hook (checked from spellDamage.ts) the codebase doesn't have yet (see
 * docs/data-sourcing.md).
 */
export const ambessaTheWolf: SpecialCaseHandler = {
  cardId: "ambessa-the-wolf",
  empowerCost: { energy: 3, runeDomain: "Body" },
  staticMightModifier: (ctx) => (ctx.instance.statuses.empowered ? 3 : 0),
};
