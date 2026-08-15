import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction] [Assault 2] (generic keyword, already wired.)
 * I can be played to a battlefield you're attacking.
 *
 * "A battlefield you're attacking" is a momentary combat-role concept this engine doesn't
 * persist outside combat resolution — no play-time hook can check it (see
 * docs/data-sourcing.md). Reaction timing isn't modeled either. Nothing left to implement once
 * both are skipped.
 */
export const rengarPouncing: SpecialCaseHandler = {
  cardId: "rengar-pouncing",
};
