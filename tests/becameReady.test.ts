import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { readyInstance } from "../src/cards/special-cases/ready-helpers";
import { runTurnStart } from "../src/game/turnFlow";
import { makeGame, putOnBase } from "./helpers";

/**
 * The "became ready" broadcast (cards/special-cases/ready-helpers.ts readyInstance,
 * game/turnFlow.ts runAwaken) — see those files' doc comments for the chokepoint design.
 * Exercised here via the 5 cards that previously had no-op handlers for exactly this reason.
 */
describe("became ready broadcast", () => {
  it("Fretful Feline (ven-71): +2 Might when readied by an effect", () => {
    const game = makeGame();
    const feline = putOnBase(game, "ven-71", "0", { exhausted: true });

    readyInstance(game, getCard, feline.instanceId);

    expect(feline.exhausted).toBe(false);
    expect(feline.tempMightBonus).toBe(2);
  });

  it("Fretful Feline (ven-71): +2 Might when readied at Awaken", () => {
    const game = makeGame();
    const feline = putOnBase(game, "ven-71", "0", { exhausted: true });

    runTurnStart(game, "0");

    expect(feline.exhausted).toBe(false);
    expect(feline.tempMightBonus).toBe(2);
  });

  it("Fretful Feline (ven-71): no double-fire — readying an already-ready instance is a no-op", () => {
    const game = makeGame();
    const feline = putOnBase(game, "ven-71", "0", { exhausted: false });

    const result = readyInstance(game, getCard, feline.instanceId);

    expect(result).toBe(false);
    expect(feline.tempMightBonus).toBe(0);
  });

  it("Pirates Haven (ogn-143): +1 Might to another friendly unit readied by an effect, not to Pirates Haven itself", () => {
    const game = makeGame();
    putOnBase(game, "ogn-143", "0");
    const ally = putOnBase(game, "unit-plain-footman", "0", { exhausted: true });

    readyInstance(game, getCard, ally.instanceId);

    expect(ally.tempMightBonus).toBe(1);
  });

  it("Pirates Haven (ogn-143): does not buff an enemy unit becoming ready", () => {
    const game = makeGame();
    putOnBase(game, "ogn-143", "0");
    const enemy = putOnBase(game, "unit-plain-footman", "1", { exhausted: true });

    readyInstance(game, getCard, enemy.instanceId);

    expect(enemy.tempMightBonus).toBe(0);
  });

  it("Jayce, Hammer in Hand (ven-88): grants Assault 2 this turn when readied", () => {
    const game = makeGame();
    const jayce = putOnBase(game, "ven-88", "0", { exhausted: true });

    readyInstance(game, getCard, jayce.instanceId);

    expect(jayce.grantedThisTurn).toContainEqual({ keyword: "assault", value: 2 });
  });

  it("Irelia, Fervent (sfd-225): +1 Might when readied, and when chosen by her OWN controller", () => {
    const game = makeGame();
    const irelia = putOnBase(game, "sfd-225", "0", { exhausted: true });

    readyInstance(game, getCard, irelia.instanceId);
    expect(irelia.tempMightBonus).toBe(1);

    SpecialCaseEngine.onChosen(game, getCard, "0", irelia.instanceId, getCard("unit-plain-footman"));
    expect(irelia.tempMightBonus).toBe(2);
  });

  it("Irelia, Fervent (sfd-225): NOT buffed when the OPPONENT chooses her", () => {
    const game = makeGame();
    const irelia = putOnBase(game, "sfd-225", "0", { exhausted: false });

    SpecialCaseEngine.onChosen(game, getCard, "1", irelia.instanceId, getCard("unit-plain-footman"));

    expect(irelia.tempMightBonus).toBe(0);
  });

  it("Mageseeker Warden (ogn-70): blocks an effect from readying an enemy unit while she's at a battlefield", () => {
    const game = makeGame();
    const warden = putOnBase(game, "ogn-70", "0");
    game.battlefields[0].units["0"].push(warden.instanceId);
    warden.zone = "battlefield";
    warden.battlefieldIndex = 0;
    const enemy = putOnBase(game, "unit-plain-footman", "1", { exhausted: true });

    const result = readyInstance(game, getCard, enemy.instanceId);

    expect(result).toBe(false);
    expect(enemy.exhausted).toBe(true);
  });

  it("Mageseeker Warden (ogn-70): does not block a FRIENDLY unit's ready", () => {
    const game = makeGame();
    const warden = putOnBase(game, "ogn-70", "0");
    game.battlefields[0].units["0"].push(warden.instanceId);
    warden.zone = "battlefield";
    warden.battlefieldIndex = 0;
    const ally = putOnBase(game, "unit-plain-footman", "0", { exhausted: true });

    const result = readyInstance(game, getCard, ally.instanceId);

    expect(result).toBe(true);
    expect(ally.exhausted).toBe(false);
  });

  it("Mageseeker Warden (ogn-70): does not block while she's at base (not a battlefield)", () => {
    const game = makeGame();
    putOnBase(game, "ogn-70", "0"); // stays at base, never moved to a battlefield
    const enemy = putOnBase(game, "unit-plain-footman", "1", { exhausted: true });

    const result = readyInstance(game, getCard, enemy.instanceId);

    expect(result).toBe(true);
    expect(enemy.exhausted).toBe(false);
  });

  it("Mageseeker Warden (ogn-70): does NOT block the enemy's normal Awaken readying (not \"spells and abilities\")", () => {
    const game = makeGame();
    const warden = putOnBase(game, "ogn-70", "0");
    game.battlefields[0].units["0"].push(warden.instanceId);
    warden.zone = "battlefield";
    warden.battlefieldIndex = 0;
    const enemy = putOnBase(game, "unit-plain-footman", "1", { exhausted: true });

    runTurnStart(game, "1");

    expect(enemy.exhausted).toBe(false);
  });
});
