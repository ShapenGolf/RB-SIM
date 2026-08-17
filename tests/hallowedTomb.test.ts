import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { battlefieldPseudoInstance } from "../src/game/pseudoInstance";
import { makeGame } from "./helpers";

/**
 * Hallowed Tomb (ogn-281): "When you hold here, you may return your Chosen Champion from your
 * trash to your Champion Zone if it is empty." Was registered as a moot no-op before the Champion
 * Zone existed as real game state (see game/state.ts's championZone/chosenChampionId) — now real.
 */
describe("Hallowed Tomb (ogn-281)", () => {
  it("returns the Chosen Champion from trash to the (empty) Champion Zone on hold", () => {
    const game = makeGame();
    game.battlefields[0] = { cardId: "ogn-281", units: { "0": [], "1": [] }, controller: "0" };
    game.players["0"].chosenChampionId = "ogn-66"; // Ahri, Alluring
    game.players["0"].championZone = null;
    game.players["0"].trash = ["unit-plain-footman", "ogn-66"];
    const card = getCard("ogn-281");

    SpecialCaseEngine.onBeginningWhileHeld(game, card, battlefieldPseudoInstance("ogn-281", "0", 0));

    expect(game.players["0"].championZone).toBe("ogn-66");
    expect(game.players["0"].trash).toEqual(["unit-plain-footman"]);
  });

  it("matches by name, not exact cardId — any copy of the Chosen Champion counts", () => {
    const game = makeGame();
    game.battlefields[0] = { cardId: "ogn-281", units: { "0": [], "1": [] }, controller: "0" };
    game.players["0"].chosenChampionId = "ogn-66";
    game.players["0"].championZone = null;
    // A different printing of the same name (Ahri, Alluring) should still count as a match.
    game.players["0"].trash = ["ogn-66"];
    const card = getCard("ogn-281");

    SpecialCaseEngine.onBeginningWhileHeld(game, card, battlefieldPseudoInstance("ogn-281", "0", 0));

    expect(game.players["0"].championZone).toBe("ogn-66");
  });

  it("does nothing if the Champion Zone isn't empty", () => {
    const game = makeGame();
    game.battlefields[0] = { cardId: "ogn-281", units: { "0": [], "1": [] }, controller: "0" };
    game.players["0"].chosenChampionId = "ogn-66";
    game.players["0"].championZone = "ogn-66"; // still there
    game.players["0"].trash = ["ogn-66"];
    const card = getCard("ogn-281");

    SpecialCaseEngine.onBeginningWhileHeld(game, card, battlefieldPseudoInstance("ogn-281", "0", 0));

    expect(game.players["0"].trash).toEqual(["ogn-66"]); // untouched
  });

  it("does nothing if the Chosen Champion isn't in trash", () => {
    const game = makeGame();
    game.battlefields[0] = { cardId: "ogn-281", units: { "0": [], "1": [] }, controller: "0" };
    game.players["0"].chosenChampionId = "ogn-66";
    game.players["0"].championZone = null;
    game.players["0"].trash = ["unit-plain-footman"];
    const card = getCard("ogn-281");

    SpecialCaseEngine.onBeginningWhileHeld(game, card, battlefieldPseudoInstance("ogn-281", "0", 0));

    expect(game.players["0"].championZone).toBeNull();
  });
});
