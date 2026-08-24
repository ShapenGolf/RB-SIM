import type { Card, CardDatabase, Domain } from "./types";
import type { ActivatedAbility, TemplatedEffect } from "./templatedEffects";
import starterSetData from "./data/starter-set.json";
import tokensData from "./data/tokens.json";
import officialCatalogData from "./data/official-catalog.json";
import homebrewSetData from "./data/homebrew-set.json";
import templatedEffectsData from "./data/templated-effects.json";
import activatedAbilitiesData from "./data/activated-abilities.json";
import specialCaseAssignmentsData from "./data/special-case-assignments.json";

const starterSet = starterSetData as Card[];
/**
 * Original, hand-authored cards for this simulator's own "Corvenna" class (Legend, 2 Champions,
 * supporting Units/Spells/Gear) — NOT part of the official Riftbound catalog, and not meant to
 * look like it: every entry carries a "Homebrew" sourceNote, uses the "hb-" id prefix and "HB"
 * setCode (kept out of officialCardIds below, same as starterSet/tokens), and every mechanic used
 * is an EXISTING keyword/templatedEffect/activatedAbility shape already supported by the engine —
 * see src/keywords/handlers/ and cards/templatedEffects.ts — so no bespoke game-logic code was
 * needed to make it playable. Exposed to the deck builder via listPlayableCards() below (unlike
 * starterSet's synthetic fixtures, which stay hidden — this is real, complete, intentional content
 * a player can actually build a legal deck around).
 */
const homebrewSet = homebrewSetData as Card[];
// Synthetic unit tokens created directly by card effects (e.g. "play a 3 Might Sprite unit
// token") — not part of the official card gallery, since tokens don't have real print IDs.
// See src/cards/data/tokens.json and game/setup.ts createInstance.
const tokens = tokensData as Card[];
// Imported from the official Riftbound card gallery, all 5 sets (Origins,
// Proving Grounds, Spiritforged, Unleashed, Vendetta) — see docs/data-sourcing.md
// and scripts/import-cards.mjs. Cards with unique text beyond the generic
// keyword engine are catalogued in src/cards/data/special-cases-todo.json
// rather than implemented all at once.
const officialCatalog = officialCatalogData as Card[];
// Auto-matched trigger+action effects and activated abilities, keyed by card
// id — see scripts/match-templated-effects.mjs,
// scripts/match-activated-abilities.mjs, and src/game/templatedEffectEngine.ts.
const templatedEffects = templatedEffectsData as Record<string, TemplatedEffect>;
const activatedAbilities = activatedAbilitiesData as Record<string, ActivatedAbility>;
// Hand-implemented special-case handlers (src/cards/special-cases/), keyed by
// card id. Kept separate from official-catalog.json so re-running the
// importer (new sets, bug fixes) never clobbers this work — see
// src/cards/data/special-cases-todo.json for what's still unassigned.
const specialCaseAssignments = specialCaseAssignmentsData as Record<string, string>;

const RUNE_DOMAINS: Domain[] = ["Fury", "Calm", "Mind", "Body", "Chaos", "Order"];

/**
 * Parses the "equip" keyword's `grantedText` (the cost to attach an Equipment gear to a unit)
 * for the two common shapes: "<Domain> Rune" and "N Energy<Domain> Rune". Anything else (a bare
 * domain-less "Rune", or text with an additional non-Rune cost like "Kill a friendly unit") is
 * left unmatched — those Equipment cards need a hand-written special case instead. See
 * cards/types.ts `Card.equipCost`.
 */
function parseEquipCost(grantedText: string): { energy: number; runeDomain?: Domain } | undefined {
  const domainPattern = RUNE_DOMAINS.join("|");
  const withEnergy = grantedText.match(new RegExp(`^(\\d+) Energy(${domainPattern}) Rune$`));
  if (withEnergy) return { energy: Number(withEnergy[1]), runeDomain: withEnergy[2] as Domain };
  const runeOnly = grantedText.match(new RegExp(`^(${domainPattern}) Rune$`));
  if (runeOnly) return { energy: 0, runeDomain: runeOnly[1] as Domain };
  return undefined;
}

/**
 * Parses the "repeat" keyword's `grantedText` (rule 820's Repeat cost) for the common shapes: "N
 * Energy", "<Domain> Rune", and "N Energy<Domain> Rune" — same spirit as parseEquipCost, plus the
 * Energy-only case (Equip costs always include a Rune; Repeat costs often don't). Anything else
 * (a bare "Rune" with no domain, a discard cost, or a cost defined relative to the spell's own
 * printed cost like "equal to its cost") is left unmatched. See cards/types.ts `Card.repeatCost`.
 */
function parseRepeatCost(grantedText: string): { energy: number; runeDomain?: Domain } | undefined {
  const trimmed = grantedText.replace(/\.$/, "").trim();
  const domainPattern = RUNE_DOMAINS.join("|");
  const withEnergy = trimmed.match(new RegExp(`^(\\d+) Energy(${domainPattern}) Rune$`));
  if (withEnergy) return { energy: Number(withEnergy[1]), runeDomain: withEnergy[2] as Domain };
  const energyOnly = trimmed.match(/^(\d+) Energy$/);
  if (energyOnly) return { energy: Number(energyOnly[1]) };
  const runeOnly = trimmed.match(new RegExp(`^(${domainPattern}) Rune$`));
  if (runeOnly) return { energy: 0, runeDomain: runeOnly[1] as Domain };
  return undefined;
}

/**
 * Parses the "flow" keyword's `grantedText` (play this spell from your trash for this cost
 * instead) for its 5 observed shapes: "N Energy", "N Energy<Domain> Rune", "N Energy<Domain>
 * Rune<Domain> Rune" (same domain twice), "N EnergyRune" and "N EnergyRuneRune" (domain-less —
 * pay a Rune of ANY domain per slot, unlike every other cost in this card pool). See
 * cards/types.ts `Card.flowCost`.
 */
function parseFlowCost(
  grantedText: string,
): { energy: number; runeDomain?: Domain; runeDomainCount: number; anyDomainRuneCount: number } | undefined {
  const trimmed = grantedText.replace(/\.$/, "").trim();
  const domainPattern = RUNE_DOMAINS.join("|");
  const sameDomainTwice = trimmed.match(new RegExp(`^(\\d+) Energy(${domainPattern}) Rune\\2 Rune$`));
  if (sameDomainTwice) {
    return { energy: Number(sameDomainTwice[1]), runeDomain: sameDomainTwice[2] as Domain, runeDomainCount: 2, anyDomainRuneCount: 0 };
  }
  const namedDomainOnce = trimmed.match(new RegExp(`^(\\d+) Energy(${domainPattern}) Rune$`));
  if (namedDomainOnce) {
    return { energy: Number(namedDomainOnce[1]), runeDomain: namedDomainOnce[2] as Domain, runeDomainCount: 1, anyDomainRuneCount: 0 };
  }
  const anyDomainTwice = trimmed.match(/^(\d+) EnergyRuneRune$/);
  if (anyDomainTwice) return { energy: Number(anyDomainTwice[1]), runeDomainCount: 0, anyDomainRuneCount: 2 };
  const anyDomainOnce = trimmed.match(/^(\d+) EnergyRune$/);
  if (anyDomainOnce) return { energy: Number(anyDomainOnce[1]), runeDomainCount: 0, anyDomainRuneCount: 1 };
  const energyOnly = trimmed.match(/^(\d+) Energy$/);
  if (energyOnly) return { energy: Number(energyOnly[1]), runeDomainCount: 0, anyDomainRuneCount: 0 };
  return undefined;
}

export const cardDatabase: CardDatabase = Object.fromEntries(
  [...officialCatalog, ...starterSet, ...tokens, ...homebrewSet].map((card) => {
    const extras: Partial<Card> = {};
    if (templatedEffects[card.id]) extras.templatedEffect = templatedEffects[card.id];
    if (activatedAbilities[card.id]) extras.activatedAbility = activatedAbilities[card.id];
    if (specialCaseAssignments[card.id]) extras.specialCaseId = specialCaseAssignments[card.id];
    const equipKeyword = card.keywords.find((k) => k.keyword === "equip");
    if (equipKeyword?.grantedText) {
      const cost = parseEquipCost(equipKeyword.grantedText);
      if (cost) extras.equipCost = cost;
    }
    const repeatKeyword = card.keywords.find((k) => k.keyword === "repeat");
    if (repeatKeyword?.grantedText) {
      const cost = parseRepeatCost(repeatKeyword.grantedText);
      if (cost) extras.repeatCost = cost;
    }
    const flowKeyword = card.keywords.find((k) => k.keyword === "flow");
    if (flowKeyword?.grantedText) {
      const cost = parseFlowCost(flowKeyword.grantedText);
      if (cost) extras.flowCost = cost;
    }
    return [card.id, Object.keys(extras).length > 0 ? { ...card, ...extras } : card];
  }),
);

/**
 * Placeholder cardId game/playerView.ts substitutes for a card in a zone it redacts (an
 * opponent's hand/mainDeck/runeDeck/hiddenZone/battlefieldPool) — see that file's doc comment. A
 * boardgame.io client applies every move OPTIMISTICALLY against its own local copy of G for
 * instant UI feedback, before the authoritative server/master response (built from the TRUE,
 * unredacted G) reconciles it — and that local copy has the OPPONENT's private zones redacted the
 * same way. Ordinary rules logic that legitimately reads an opponent's hand/deck for something
 * other than its own identity (e.g. moves.ts's hasReactionCardInHand, deciding whether a Showdown
 * needs to pause for a reaction window; special-cases/insightful-investigator.ts's "look at their
 * hand, take a card") runs into this placeholder purely as a side effect of that optimistic
 * client-side pass — not a real data bug — so `getCard` treats it specially instead of throwing.
 */
export const REDACTED_CARD_ID = "hidden";

/**
 * Safe stand-in for REDACTED_CARD_ID: no keywords, no type-specific behavior, so a check like
 * `KeywordEngine.hasKeyword(getCard(id), "reaction")` on a redacted opponent-hand entry correctly
 * comes back false during an optimistic client-side pass instead of crashing — the authoritative
 * server-side execution (against the true G) still sees the REAL card and behaves correctly; the
 * client just self-corrects once that response arrives, same as any other optimistic-update
 * misprediction in this architecture.
 */
const REDACTED_CARD_STANDIN: Card = {
  id: REDACTED_CARD_ID,
  name: "(redacted)",
  type: "spell",
  setCode: "",
  collectorNumber: 0,
  domains: [],
  energyCost: 0,
  powerCost: [],
  might: null,
  text: "",
  keywords: [],
};

export function getCard(cardId: string): Card {
  if (cardId === REDACTED_CARD_ID) return REDACTED_CARD_STANDIN;
  const card = cardDatabase[cardId];
  if (!card) throw new Error(`Unknown card id: ${cardId}`);
  return card;
}

const runeCardsByDomain = new Map<Domain, Card>();
for (const card of Object.values(cardDatabase)) {
  if (card.type !== "rune") continue;
  for (const domain of card.domains) {
    if (!runeCardsByDomain.has(domain)) runeCardsByDomain.set(domain, card);
  }
}

/**
 * The one official Rune card printed for a domain (one per domain, e.g. "Calm Rune") — used to
 * show a Rune Pool entry's real card art/symbol instead of a plain text domain label (see
 * ui/Board.tsx). `RuneInstance` (game/state.ts) only stores a `domain`, not a `cardId`, since
 * Rune cards of the same domain are otherwise interchangeable (no printed text, no unique id
 * that matters gameplay-wise) — this derives the matching card back from that domain.
 */
export function getRuneCardForDomain(domain: Domain): Card {
  const card = runeCardsByDomain.get(domain);
  if (!card) throw new Error(`No Rune card found for domain: ${domain}`);
  return card;
}

const officialCardIds = new Set(officialCatalog.map((c) => c.id));
const homebrewCardIds = new Set(homebrewSet.map((c) => c.id));

/**
 * Real, official Riftbound cards only — excludes src/cards/data/starter-set.json's synthetic
 * test fixtures (unverified placeholders built to exercise the keyword engine before the real
 * catalog existed, e.g. "(Test Fixture) Plain Footman"), tokens.json's play-generated unit
 * tokens, and homebrewSet (see listPlayableCards below).
 */
export function listOfficialCards(): Card[] {
  return Object.values(cardDatabase).filter((c) => officialCardIds.has(c.id));
}

/**
 * Every card a player should be able to actually build a deck with: the official catalog plus
 * this simulator's own homebrewSet — but still never starterSet's synthetic fixtures or tokens'
 * play-generated tokens, same reasoning as listOfficialCards above (a real player should never
 * see fixture cards when building a deck). Use this (not `cardDatabase` or `listOfficialCards`)
 * for the deck builder's card pool.
 */
export function listPlayableCards(): Card[] {
  return Object.values(cardDatabase).filter((c) => officialCardIds.has(c.id) || homebrewCardIds.has(c.id));
}
