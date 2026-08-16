import type { SpecialCaseHandler } from "./types";

/**
 * [Accelerate] (You may pay 1 EnergyBody Rune as an additional cost to have me enter ready.)
 * [Assault] (+1 Might while I'm an attacker.)
 * As you play me, you may spend any number of buffs as an additional cost. Reduce my cost by
 * Body Rune for each buff you spend.
 *
 * [Accelerate]/[Assault] are printed keywords, already generic. The buff-spending clause only
 * ever reduces the Domain-Rune portion of the cost, which this project's established
 * simplification already never charges (crescent-guardian.ts precedent) — so there's nothing
 * left to implement: the discount is already "free" regardless of whether buffs are spent.
 */
export const krakenHunter: SpecialCaseHandler = {
  cardId: "kraken-hunter",
};
