import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";

describe("Reaction/Counter cards (moot no-op registrations)", () => {
  const cases: [string, string][] = [
    ["unl-131", "abandon"],
    ["ven-39", "crumbling-sands"],
    ["ogn-45", "defy"],
    ["sfd-136", "hard-bargain"],
    ["unl-190", "lilting-lullaby"],
    ["sfd-45", "not-so-fast"],
    ["unl-106", "repulse"],
    ["ogn-64", "wind-wall"],
    ["ogn-80", "mystic-reversal"],
    ["ven-152", "rebuttal"],
    ["sfd-206", "riposte"],
  ];

  for (const [cardId, specialCaseId] of cases) {
    it(`${cardId} resolves to the ${specialCaseId} handler`, () => {
      expect(getCard(cardId).specialCaseId).toBe(specialCaseId);
    });
  }
});
