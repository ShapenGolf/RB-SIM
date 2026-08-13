import type { ActivatedAbility, TemplatedEffect } from "./templatedEffects";

/** "Colorless" covers domainless/neutral cards (e.g. some Battlefields), confirmed present in the official card data. */
export type Domain = "Fury" | "Calm" | "Mind" | "Body" | "Chaos" | "Order" | "Colorless";

export type CardType =
  | "legend"
  | "champion"
  | "unit"
  | "spell"
  | "gear"
  | "battlefield"
  | "rune"
  | "token";

/**
 * A single keyword reference on a card. `value` covers keywords parameterized
 * by a number (Shield 2, Assault +1, Accelerate 1). `grantedText` covers
 * Dependent keywords (Empowered) that grant additional card text once active.
 */
export interface KeywordInstance {
  keyword: string;
  value?: number;
  grantedText?: string;
}

export interface PowerCost {
  domain: Domain;
  amount: number;
}

export interface Card {
  id: string;
  name: string;
  type: CardType;
  setCode: string;
  collectorNumber: number;
  rarity?: string;
  domains: Domain[];
  /** Generic Energy cost, paid by exhausting Runes. Null for Runes/Tokens without a cost. */
  energyCost: number | null;
  /** Domain-specific Power cost, paid by recycling matching Runes. */
  powerCost: PowerCost[];
  /** Might for Units/Champions; null for card types without combat stats. */
  might: number | null;
  /** Raw human-readable rules text, kept for reference/UI display. */
  text: string;
  /** Structured keywords this card carries; consumed by the generic keyword engine. */
  keywords: KeywordInstance[];
  tags?: string[];
  /**
   * When set, this card has unique text beyond what the generic keyword
   * engine covers. The id links to a handler in `src/cards/special-cases/`.
   * Cards with unresolved unique text but no handler yet are still playable
   * for their generic parts, but the special-case behavior is a no-op until
   * implemented.
   */
  specialCaseId?: string;
  /**
   * Auto-matched trigger+action(s) for cards whose unique text reduced to a
   * known simple template (see scripts/match-templated-effects.mjs). Mutually
   * exclusive in practice with `specialCaseId`, executed by the generic
   * interpreter in `src/game/templatedEffects.ts` — no bespoke code needed.
   */
  templatedEffect?: TemplatedEffect;
  /** Auto-matched "[Cost,] Exhaust: Effect" activated ability, see scripts/match-activated-abilities.mjs. */
  activatedAbility?: ActivatedAbility;
  /**
   * Provenance note for this data entry. Real cards researched via web
   * search are cited here; cards without a confirmed official source are
   * marked "unverified" and exist only to exercise the keyword engine.
   */
  sourceNote?: string;
}

export interface CardDatabase {
  [cardId: string]: Card;
}
