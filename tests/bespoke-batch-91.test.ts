import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";

describe("[Add]-gated cards (moot no-op registrations)", () => {
  const cases: [string, string][] = [
    ["sfd-117", "ancient-henge"],
    ["ven-141", "butcher-of-the-sands"],
    ["ven-190", "butcher-of-the-sands"],
    ["ogn-299", "daughter-of-the-void"],
    ["ogn-247", "daughter-of-the-void"],
    ["unl-93", "dragonsoul-sage"],
    ["ogn-98", "energy-conduit"],
    ["sfd-244", "fire-below-the-mountain"],
    ["sfd-189", "fire-below-the-mountain"],
    ["ogn-302", "hand-of-noxus"],
    ["ogn-253", "hand-of-noxus"],
    ["sfd-83", "hextech-anomaly"],
    ["unl-49", "honeyfruit"],
    ["ogs-14", "lux-crownguard"],
    ["ogn-113", "malzahar-fanatic"],
    ["ven-75", "platewyrm-egg"],
    ["unl-234", "scorn-of-the-moon"],
    ["unl-197", "scorn-of-the-moon"],
  ];

  for (const [cardId, specialCaseId] of cases) {
    it(`${cardId} resolves to the ${specialCaseId} handler`, () => {
      expect(getCard(cardId).specialCaseId).toBe(specialCaseId);
    });
  }
});
