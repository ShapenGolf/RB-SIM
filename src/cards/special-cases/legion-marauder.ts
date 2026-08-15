import type { SpecialCaseHandler } from "./types";

/**
 * [Empower] — 1 Energy or Body Rune (pay either cost).
 * [Empowered][>] I have +1 Might.
 *
 * Known gap: the "or Body Rune" alternative payment isn't modeled (EmpowerCost has no OR
 * shape) — only the 1-Energy path is offered, matching the Domain-Rune-only-cost skip
 * convention elsewhere (see docs/data-sourcing.md).
 */
export const legionMarauder: SpecialCaseHandler = {
  cardId: "legion-marauder",
  empowerCost: { energy: 1 },
  staticMightModifier: (ctx) => (ctx.instance.statuses.empowered ? 1 : 0),
};
