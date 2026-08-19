import type { SpecialCaseHandler } from "./types";

/**
 * I have all Exhaust abilities of all friendly legends, units, and gear.
 *
 * Moot — full ability-sharing/copying isn't modeled. Unlike the "became ready"/"becomes Mighty"
 * gaps (fixed this session via bounded checkpoint chokepoints — see ready-helpers.ts,
 * mightTransition.ts), this needs every consumer of `getCard(instance.cardId)` across the WHOLE
 * engine (KeywordEngine, SpecialCaseEngine's activatedAbilityCost/onActivate resolution,
 * computeMight's static modifiers, the templated-effect engine, and the UI's card art/text
 * rendering) to instead resolve an "effective card" that can vary per-instance and per-attached-
 * card — not one well-defined action's aftermath, but a property checked at dozens of unrelated
 * call sites scattered through the entire codebase. A partial implementation (respecting the
 * override at only SOME of those sites) would be actively worse than this documented no-op: it
 * would silently work for some interactions and not others, in a way the existing test suite
 * wouldn't reliably catch (deferred, see docs/data-sourcing.md — same category as Svellsongur/
 * Shady Spectacles/The Zero Drive's ability-copying). No fallback mode.
 */
export const heimerdingerInventor: SpecialCaseHandler = {
  cardId: "heimerdinger-inventor",
};
