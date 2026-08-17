import { describe, it, expect } from "vitest";
import { getRuneCardForDomain } from "../src/cards/db";

const ALL_DOMAINS = ["Fury", "Calm", "Mind", "Body", "Order", "Chaos"] as const;

describe("getRuneCardForDomain", () => {
  it("returns the official Rune card for every domain, with real card art", () => {
    for (const domain of ALL_DOMAINS) {
      const card = getRuneCardForDomain(domain);
      expect(card.type).toBe("rune");
      expect(card.domains).toContain(domain);
      expect(card.imageUrl).toBeTruthy();
    }
  });
});
