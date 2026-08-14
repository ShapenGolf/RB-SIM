import { describe, it, expect } from "vitest";
import type { Card, CardType } from "../src/cards/types";
import { validateDeck, isDeckLegal, type DeckList } from "../src/cards/deckValidation";

/** Builds a minimal fixture Card, filling in fields validateDeck doesn't care about. */
function card(overrides: Partial<Card> & { id: string; name: string; type: CardType }): Card {
  return {
    setCode: "TST",
    collectorNumber: 1,
    domains: [],
    energyCost: null,
    powerCost: [],
    might: null,
    text: "",
    keywords: [],
    tags: [],
    ...overrides,
  };
}

const LEGEND = card({ id: "legend-1", name: "Test Legend", type: "legend", domains: ["Fury", "Calm"], tags: ["Test"] });
const CHAMPION = card({ id: "champ-1", name: "Champion One", type: "champion", domains: ["Fury"], tags: ["Test", "Extra"] });
const CHAMPION_WRONG_LEGEND = card({ id: "champ-2", name: "Champion Two", type: "champion", domains: ["Fury"], tags: ["Other"] });
const NOT_A_CHAMPION = card({ id: "notchamp-1", name: "Not A Champion", type: "unit", domains: ["Fury"], tags: ["Test"] });
const SIGNATURE_OK = card({ id: "sig-1", name: "Signature One", type: "spell", domains: ["Fury"], tags: ["Test"], isSignature: true });
const SIGNATURE_WRONG_LEGEND = card({ id: "sig-2", name: "Signature Two", type: "spell", domains: ["Fury"], tags: ["Other"], isSignature: true });
const UNIQUE = card({ id: "uniq-1", name: "Unique One", type: "unit", domains: ["Fury"], keywords: [{ keyword: "unique" }] });
const BAD_DOMAIN = card({ id: "bad-domain-1", name: "Bad Domain One", type: "unit", domains: ["Mind"] });
const RUNE_FURY = card({ id: "rune-fury", name: "Fury Rune", type: "rune", domains: ["Fury"] });
const RUNE_MIND = card({ id: "rune-mind", name: "Mind Rune", type: "rune", domains: ["Mind"] });
const BF1 = card({ id: "bf-1", name: "Battlefield One", type: "battlefield", domains: ["Colorless"] });
const BF2 = card({ id: "bf-2", name: "Battlefield Two", type: "battlefield", domains: ["Colorless"] });
const BF3 = card({ id: "bf-3", name: "Battlefield Three", type: "battlefield", domains: ["Colorless"] });

const FILLERS: Card[] = Array.from({ length: 40 }, (_, i) =>
  card({ id: `filler-${i}`, name: `Filler ${i}`, type: "unit", domains: ["Fury"] }),
);

const CARDS = new Map<string, Card>(
  [LEGEND, CHAMPION, CHAMPION_WRONG_LEGEND, NOT_A_CHAMPION, SIGNATURE_OK, SIGNATURE_WRONG_LEGEND, UNIQUE, BAD_DOMAIN, RUNE_FURY, RUNE_MIND, BF1, BF2, BF3, ...FILLERS].map(
    (c) => [c.id, c],
  ),
);

function getCardFn(id: string): Card {
  const found = CARDS.get(id);
  if (!found) throw new Error(`Unknown test card id: ${id}`);
  return found;
}

/** A deck that satisfies every rule, used as the baseline for single-violation mutations. */
function legalDeck(): DeckList {
  const mainDeck = [CHAMPION.id, SIGNATURE_OK.id, ...FILLERS.slice(0, 38).map((c) => c.id)];
  return {
    legendId: LEGEND.id,
    chosenChampionId: CHAMPION.id,
    mainDeck,
    runeDeck: Array.from({ length: 12 }, () => RUNE_FURY.id),
    battlefields: [BF1.id, BF2.id, BF3.id],
  };
}

describe("validateDeck", () => {
  it("returns no issues for a fully legal deck", () => {
    expect(validateDeck(legalDeck(), getCardFn)).toEqual([]);
    expect(isDeckLegal(legalDeck(), getCardFn)).toBe(true);
  });

  it("flags a missing legend", () => {
    const deck = { ...legalDeck(), legendId: "does-not-exist" };
    const issues = validateDeck(deck, getCardFn);
    expect(issues).toEqual([{ code: "legend-missing", message: expect.any(String) }]);
  });

  it("flags a legend id pointing at a non-legend card", () => {
    const deck = { ...legalDeck(), legendId: CHAMPION.id };
    const issues = validateDeck(deck, getCardFn);
    expect(issues.map((i) => i.code)).toEqual(["legend-wrong-type"]);
  });

  it("flags a main deck under the 40-card minimum", () => {
    const deck = { ...legalDeck(), mainDeck: legalDeck().mainDeck.slice(0, 39) };
    const issues = validateDeck(deck, getCardFn);
    expect(issues.map((i) => i.code)).toContain("main-deck-too-small");
  });

  it("flags a main deck card whose type doesn't belong there", () => {
    const deck = legalDeck();
    deck.mainDeck = [...deck.mainDeck.slice(0, -1), RUNE_FURY.id];
    const issues = validateDeck(deck, getCardFn);
    expect(issues.map((i) => i.code)).toContain("main-deck-wrong-type");
  });

  it("flags a domain mismatch against the Legend's Domain Identity", () => {
    const deck = legalDeck();
    deck.mainDeck = [...deck.mainDeck.slice(0, -1), BAD_DOMAIN.id];
    const issues = validateDeck(deck, getCardFn);
    expect(issues.map((i) => i.code)).toContain("domain-mismatch");
  });

  it("flags more than 3 copies of the same card name", () => {
    const deck = legalDeck();
    deck.mainDeck = [...deck.mainDeck.slice(0, -3), FILLERS[0].id, FILLERS[0].id, FILLERS[0].id];
    const issues = validateDeck(deck, getCardFn);
    expect(issues.map((i) => i.code)).toContain("too-many-copies");
  });

  it("flags more than 1 copy of a [Unique] card", () => {
    const deck = legalDeck();
    deck.mainDeck = [...deck.mainDeck.slice(0, -2), UNIQUE.id, UNIQUE.id];
    const issues = validateDeck(deck, getCardFn);
    expect(issues.map((i) => i.code)).toContain("too-many-copies");
  });

  it("flags more than 3 signature cards total", () => {
    const extraSignatures = [
      card({ id: "sig-3", name: "Signature Three", type: "spell", domains: ["Fury"], tags: ["Test"], isSignature: true }),
      card({ id: "sig-4", name: "Signature Four", type: "spell", domains: ["Fury"], tags: ["Test"], isSignature: true }),
      card({ id: "sig-5", name: "Signature Five", type: "spell", domains: ["Fury"], tags: ["Test"], isSignature: true }),
    ];
    for (const c of extraSignatures) CARDS.set(c.id, c);
    const deck = legalDeck();
    deck.mainDeck = [...deck.mainDeck.slice(0, -3), ...extraSignatures.map((c) => c.id)];
    const issues = validateDeck(deck, getCardFn);
    expect(issues.map((i) => i.code)).toContain("too-many-signatures");
    for (const c of extraSignatures) CARDS.delete(c.id);
  });

  it("flags a signature card that doesn't bear the Legend's tag", () => {
    const deck = legalDeck();
    deck.mainDeck = [...deck.mainDeck.slice(0, -1), SIGNATURE_WRONG_LEGEND.id];
    const issues = validateDeck(deck, getCardFn);
    expect(issues.map((i) => i.code)).toContain("signature-wrong-legend");
  });

  it("flags a Chosen Champion that isn't a champion card", () => {
    const deck = { ...legalDeck(), chosenChampionId: NOT_A_CHAMPION.id, mainDeck: [...legalDeck().mainDeck.slice(0, -1), NOT_A_CHAMPION.id] };
    const issues = validateDeck(deck, getCardFn);
    expect(issues.map((i) => i.code)).toContain("champion-wrong-type");
  });

  it("flags a Chosen Champion whose tag doesn't match the Legend", () => {
    const deck = { ...legalDeck(), chosenChampionId: CHAMPION_WRONG_LEGEND.id, mainDeck: [...legalDeck().mainDeck.slice(0, -1), CHAMPION_WRONG_LEGEND.id] };
    const issues = validateDeck(deck, getCardFn);
    expect(issues.map((i) => i.code)).toContain("champion-wrong-legend");
  });

  it("flags a Chosen Champion that isn't actually in the Main Deck", () => {
    const deck = { ...legalDeck(), mainDeck: legalDeck().mainDeck.filter((id) => id !== CHAMPION.id) };
    const issues = validateDeck(deck, getCardFn);
    expect(issues.map((i) => i.code)).toContain("champion-not-in-deck");
  });

  it("flags a rune deck that isn't exactly 12 cards", () => {
    const deck = { ...legalDeck(), runeDeck: Array.from({ length: 11 }, () => RUNE_FURY.id) };
    const issues = validateDeck(deck, getCardFn);
    expect(issues.map((i) => i.code)).toContain("rune-deck-wrong-size");
  });

  it("flags a non-rune card in the rune deck", () => {
    const deck = legalDeck();
    deck.runeDeck = [...deck.runeDeck.slice(0, -1), FILLERS[0].id];
    const issues = validateDeck(deck, getCardFn);
    expect(issues.map((i) => i.code)).toContain("rune-deck-wrong-type");
  });

  it("flags a rune outside the Legend's Domain Identity", () => {
    const deck = legalDeck();
    deck.runeDeck = [...deck.runeDeck.slice(0, -1), RUNE_MIND.id];
    const issues = validateDeck(deck, getCardFn);
    expect(issues.map((i) => i.code)).toContain("rune-domain-mismatch");
  });

  it("flags a battlefield count other than 3", () => {
    const deck = { ...legalDeck(), battlefields: [BF1.id, BF2.id] };
    const issues = validateDeck(deck, getCardFn);
    expect(issues.map((i) => i.code)).toContain("battlefield-wrong-count");
  });

  it("flags a non-battlefield card among the battlefields", () => {
    const deck = { ...legalDeck(), battlefields: [BF1.id, BF2.id, FILLERS[0].id] };
    const issues = validateDeck(deck, getCardFn);
    expect(issues.map((i) => i.code)).toContain("battlefield-wrong-type");
  });

  it("flags duplicate battlefield names", () => {
    const deck = { ...legalDeck(), battlefields: [BF1.id, BF1.id, BF2.id] };
    const issues = validateDeck(deck, getCardFn);
    expect(issues.map((i) => i.code)).toContain("duplicate-battlefield");
  });
});
