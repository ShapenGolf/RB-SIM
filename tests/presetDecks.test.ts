import { describe, it, expect } from "vitest";
import { validateDeck } from "../src/cards/deckValidation";
import { PRESET_DECKS, isPresetDeck } from "../src/decks/presets";

describe("preset decks", () => {
  for (const preset of PRESET_DECKS) {
    it(`"${preset.name}" is a legal deck`, () => {
      expect(validateDeck(preset.deck)).toEqual([]);
    });
  }

  it("every preset id carries the preset- prefix", () => {
    for (const preset of PRESET_DECKS) {
      expect(isPresetDeck(preset.id)).toBe(true);
    }
  });

  it("isPresetDeck is false for a normal saved-deck id", () => {
    expect(isPresetDeck("deck-1700000000000-abc123")).toBe(false);
  });

  it("preset ids are unique", () => {
    const ids = PRESET_DECKS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
