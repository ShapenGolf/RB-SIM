import type { SpecialCaseHandler } from "./types";

/**
 * While I'm in combat, friendly spells cost 1 EnergyRune less to a minimum of 1 Energy, and
 * enemy spells cost 1 EnergyRune more.
 *
 * Moot — "while I'm in combat" (a Showdown-scoped, self-location condition tied to attack/defend
 * state rather than a simple "at a battlefield" check) isn't modeled as a queryable condition
 * this session's cost-reduction infra could gate on cleanly (deferred, see
 * docs/data-sourcing.md). No fallback mode.
 */
export const vexCheerless: SpecialCaseHandler = {
  cardId: "vex-cheerless",
};
