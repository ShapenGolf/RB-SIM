import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { makeGame, putOnBase } from "./helpers";

describe("onAllyCardPlayed broadcast mechanism", () => {
  it("Ravenbloom Student (ogn-103): buffs on an ally spell, ignores an ally unit", () => {
    const game = makeGame();
    const student = putOnBase(game, "ogn-103", "0");

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", getCard("unit-plain-footman"), 1);
    expect(student.tempMightBonus).toBe(0);

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", getCard("ogn-5"), 2); // Disintegrate, a spell
    expect(student.tempMightBonus).toBe(1);
  });

  it("Pit Crew (ogn-91): readies when an ally gear is played", () => {
    const game = makeGame();
    const pitCrew = putOnBase(game, "ogn-91", "0", { exhausted: true });

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", getCard("unit-plain-footman"), 1);
    expect(pitCrew.exhausted).toBe(true);

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", getCard("gear-tactical-banner"), 2);
    expect(pitCrew.exhausted).toBe(false);
  });

  it("Lux, Illuminated (ogs-6): only triggers on a 5+ Energy spell", () => {
    const game = makeGame();
    const lux = putOnBase(game, "ogs-6", "0");
    const cheapSpell = getCard("ogn-5"); // Disintegrate, Energy 4
    const expensiveSpell = getCard("ogn-22"); // Thermo Beam, Energy 5

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", cheapSpell, 1);
    expect(lux.tempMightBonus).toBe(0);

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", expensiveSpell, 2);
    expect(lux.tempMightBonus).toBe(3);
  });

  it("Diana, No Longer Human: both printings share identical behavior", () => {
    const game = makeGame();
    const venDiana = putOnBase(game, "ven-183", "0");
    const unlDiana = putOnBase(game, "unl-149", "1");

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", getCard("ogn-5"), 1);
    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "1", getCard("ogn-5"), 1);

    expect(venDiana.tempMightBonus).toBe(2);
    expect(unlDiana.tempMightBonus).toBe(2);
  });

  it("Revna the Lorekeeper: readies only on a 4+ Energy spell", () => {
    const game = makeGame();
    const revna = putOnBase(game, "unl-5", "0", { exhausted: true });

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", getCard("unit-plain-footman"), 1); // Energy 1 unit
    expect(revna.exhausted).toBe(true);

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", getCard("ogn-22"), 2); // Thermo Beam, Energy 5 spell
    expect(revna.exhausted).toBe(false);
  });
});
