import type { SpecialCaseHandler } from "./types";

/**
 * [Empower] 3 Energy (3 Energy: Empower me. Use only if not Empowered.)
 * [Empowered] I have [Deflect] and [Shield 3].
 * The importer flattened BOTH Deflect and Shield 3 into unconditional printed keywords. Shield's
 * defending Might bonus is cancelled here while not Empowered, same workaround as the Assault
 * cases in earlier batches (no override hook exists to suppress a flawed printed keyword the way
 * hasConditionalGanking does for Ganking). Deflect has no equivalent numeric-delta workaround
 * (extraTargetingCost isn't a Might modifier), so it stays a known, undocumented-elsewhere gap:
 * this card is targetable at the Deflect Rune cost even before it's actually Empowered.
 */
export const sereneAscetic: SpecialCaseHandler = {
  cardId: "serene-ascetic",
  empowerCost: { energy: 3 },
  defendingMightModifier: (ctx) => (ctx.instance.statuses.empowered ? 0 : -3),
};
