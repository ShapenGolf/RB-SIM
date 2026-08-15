import type { Card, Domain } from "./types";
import { getCard } from "./db";

/** A deck as the player has assembled it — card ids only, duplicates allowed where the rules permit them. */
export interface DeckList {
  legendId: string;
  /** Must also appear in mainDeck (it counts toward its own name's copy limit) — see docs/deck-building-rules.md. */
  chosenChampionId: string;
  mainDeck: string[];
  runeDeck: string[];
  /** Exactly 3, no duplicate names. */
  battlefields: string[];
}

export interface DeckValidationIssue {
  code: string;
  message: string;
}

export const MAIN_DECK_MIN = 40;
/** No sideboard mechanic yet — main deck is capped at exactly the minimum. */
export const MAIN_DECK_MAX = 40;
export const RUNE_DECK_SIZE = 12;
export const BATTLEFIELD_COUNT = 3;
export const MAX_COPIES_PER_NAME = 3;
export const MAX_SIGNATURE_CARDS = 3;

/** True if `card`'s domains are all covered by the Legend's Domain Identity ("Colorless" always passes). */
function fitsDomainIdentity(card: Card, legendDomains: Domain[]): boolean {
  return card.domains.every((d) => d === "Colorless" || legendDomains.includes(d));
}

/** True if `card` carries every one of the Legend's tags — the empirically-derived "champion tag matches" rule, see docs/deck-building-rules.md. */
function matchesLegendTag(card: Card, legendTags: string[]): boolean {
  const cardTags = card.tags ?? [];
  return legendTags.every((t) => cardTags.includes(t));
}

/** Max legal copies of `card` by name: 1 for [Unique] cards, MAX_COPIES_PER_NAME otherwise. Exported for the deck builder UI's add/remove controls. */
export function copyLimitFor(card: Card): number {
  return card.keywords.some((k) => k.keyword === "unique") ? 1 : MAX_COPIES_PER_NAME;
}

/**
 * Validates a deck against the official construction rules (docs/deck-building-rules.md).
 * Returns an empty array if the deck is legal. `getCardFn` defaults to the real card database;
 * overridable for tests.
 */
export function validateDeck(deck: DeckList, getCardFn: (id: string) => Card = getCard): DeckValidationIssue[] {
  const issues: DeckValidationIssue[] = [];

  let legend: Card | undefined;
  try {
    legend = getCardFn(deck.legendId);
  } catch {
    issues.push({ code: "legend-missing", message: "Keine gültige Legend gewählt." });
    return issues;
  }
  if (legend.type !== "legend") {
    issues.push({ code: "legend-wrong-type", message: `"${legend.name}" ist keine Legend-Karte.` });
    return issues;
  }
  const legendDomains = legend.domains;
  const legendTags = legend.tags ?? [];

  // ---- Main Deck ----
  if (deck.mainDeck.length < MAIN_DECK_MIN) {
    issues.push({
      code: "main-deck-too-small",
      message: `Main Deck hat ${deck.mainDeck.length} Karten, mindestens ${MAIN_DECK_MIN} nötig.`,
    });
  }
  if (deck.mainDeck.length > MAIN_DECK_MAX) {
    issues.push({
      code: "main-deck-too-large",
      message: `Main Deck hat ${deck.mainDeck.length} Karten, maximal ${MAIN_DECK_MAX} erlaubt (kein Sideboard).`,
    });
  }

  const countByName = new Map<string, number>();
  let signatureCount = 0;
  for (const cardId of deck.mainDeck) {
    const card = getCardFn(cardId);
    if (card.type !== "unit" && card.type !== "champion" && card.type !== "gear" && card.type !== "spell") {
      issues.push({ code: "main-deck-wrong-type", message: `"${card.name}" gehört nicht ins Main Deck (${card.type}).` });
      continue;
    }
    if (!fitsDomainIdentity(card, legendDomains)) {
      issues.push({
        code: "domain-mismatch",
        message: `"${card.name}" (${card.domains.join("/")}) passt nicht zur Domain Identity von ${legend.name} (${legendDomains.join("/")}).`,
      });
    }
    countByName.set(card.name, (countByName.get(card.name) ?? 0) + 1);
    if (card.isSignature) signatureCount += 1;
    if (card.isSignature && !matchesLegendTag(card, legendTags)) {
      issues.push({
        code: "signature-wrong-legend",
        message: `Signature-Karte "${card.name}" gehört nicht zu ${legend.name}.`,
      });
    }
  }
  for (const [name, count] of countByName) {
    const sample = deck.mainDeck.map((id) => getCardFn(id)).find((c) => c.name === name)!;
    const limit = copyLimitFor(sample);
    if (count > limit) {
      issues.push({
        code: "too-many-copies",
        message:
          limit === 1
            ? `"${name}" ist [Unique] — nur 1 Kopie erlaubt, ${count} im Deck.`
            : `"${name}": ${count} Kopien im Deck, maximal ${limit} erlaubt.`,
      });
    }
  }
  if (signatureCount > MAX_SIGNATURE_CARDS) {
    issues.push({
      code: "too-many-signatures",
      message: `${signatureCount} Signature-Karten im Deck, maximal ${MAX_SIGNATURE_CARDS} erlaubt.`,
    });
  }

  // ---- Chosen Champion ----
  let champion: Card | undefined;
  try {
    champion = getCardFn(deck.chosenChampionId);
  } catch {
    issues.push({ code: "champion-missing", message: "Kein Chosen Champion gewählt." });
  }
  if (champion) {
    if (champion.type !== "champion") {
      issues.push({ code: "champion-wrong-type", message: `"${champion.name}" ist kein Champion.` });
    } else if (!matchesLegendTag(champion, legendTags)) {
      issues.push({
        code: "champion-wrong-legend",
        message: `"${champion.name}" passt nicht zu Legend ${legend.name} (Champion-Tag stimmt nicht überein).`,
      });
    }
    if (!deck.mainDeck.includes(deck.chosenChampionId)) {
      issues.push({
        code: "champion-not-in-deck",
        message: `Chosen Champion "${champion.name}" muss auch im Main Deck liegen.`,
      });
    }
  }

  // ---- Rune Deck ----
  if (deck.runeDeck.length !== RUNE_DECK_SIZE) {
    issues.push({
      code: "rune-deck-wrong-size",
      message: `Rune Deck hat ${deck.runeDeck.length} Karten, genau ${RUNE_DECK_SIZE} nötig.`,
    });
  }
  for (const cardId of deck.runeDeck) {
    const card = getCardFn(cardId);
    if (card.type !== "rune") {
      issues.push({ code: "rune-deck-wrong-type", message: `"${card.name}" ist keine Rune.` });
      continue;
    }
    if (!fitsDomainIdentity(card, legendDomains)) {
      issues.push({
        code: "rune-domain-mismatch",
        message: `${card.name} (${card.domains.join("/")}) passt nicht zur Domain Identity von ${legend.name}.`,
      });
    }
  }

  // ---- Battlefields ----
  if (deck.battlefields.length !== BATTLEFIELD_COUNT) {
    issues.push({
      code: "battlefield-wrong-count",
      message: `${deck.battlefields.length} Battlefields gewählt, genau ${BATTLEFIELD_COUNT} nötig.`,
    });
  }
  const battlefieldNames = new Set<string>();
  for (const cardId of deck.battlefields) {
    const card = getCardFn(cardId);
    if (card.type !== "battlefield") {
      issues.push({ code: "battlefield-wrong-type", message: `"${card.name}" ist kein Battlefield.` });
      continue;
    }
    if (battlefieldNames.has(card.name)) {
      issues.push({ code: "duplicate-battlefield", message: `Battlefield "${card.name}" ist doppelt gewählt.` });
    }
    battlefieldNames.add(card.name);
  }

  return issues;
}

export function isDeckLegal(deck: DeckList, getCardFn: (id: string) => Card = getCard): boolean {
  return validateDeck(deck, getCardFn).length === 0;
}
