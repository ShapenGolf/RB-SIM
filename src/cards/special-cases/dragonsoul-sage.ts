import type { SpecialCaseHandler } from "./types";

/**
 * [Reaction][>] Exhaust: [Add] 1 Energy.
 *
 * Fully handled generically via the auto-matched activated ability in
 * cards/data/activated-abilities.json (Cost: Exhaust, Effect: gainRune) — no bespoke code needed.
 * That data entry previously had a bug (domain "Body", the card's own printed domain, instead of
 * "Colorless" for plain Energy — found and fixed alongside this session's rules-audit work; see
 * game/templatedEffectEngine.ts's addRuneToPool doc comment). The [Reaction] tag on the ability
 * itself (letting it activate during another spell/ability's resolution, rule 429.3) isn't
 * modeled — this is activatable only as a normal ability on the controller's own turn, same
 * simplification level as every other activated ability in this engine.
 */
export const dragonsoulSage: SpecialCaseHandler = {
  cardId: "dragonsoul-sage",
};
