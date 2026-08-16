import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { makeGame, putOnBase } from "./helpers";

describe("Grandmaster at Arms (sfd-245 / sfd-193)", () => {
  it("attaches a detached friendly Equipment to a friendly unit on activation", () => {
    const game = makeGame();
    const legend = putOnBase(game, "sfd-245", "0");
    const gear = putOnBase(game, "sfd-161", "0"); // B.F. Sword
    const unit = putOnBase(game, "unit-doomed-recruit", "0");
    const card = getCard(legend.cardId);

    SpecialCaseEngine.onActivate(game, card, legend);

    expect(gear.attachedTo).toBe(unit.instanceId);
    expect(unit.equipment).toContain(gear.instanceId);
  });

  it("shares the same handler between both reprints", () => {
    expect(getCard("sfd-245").specialCaseId).toBe(getCard("sfd-193").specialCaseId);
  });
});
