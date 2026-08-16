import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { destroyInstance, resolveCombat } from "../src/game/combat";
import { dealSpellDamage } from "../src/game/spellDamage";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function putOnBattlefield(game: GameState, cardId: string, controller: "0" | "1", battlefieldIndex: number) {
  const instance = putOnBase(game, cardId, controller);
  game.players[controller].base = game.players[controller].base.filter((id) => id !== instance.instanceId);
  instance.zone = "battlefield";
  instance.battlefieldIndex = battlefieldIndex;
  game.battlefields[battlefieldIndex].units[controller].push(instance.instanceId);
  return instance;
}

describe("Highlander (ogs-20)", () => {
  it("recalls the strongest friendly unit exhausted instead of letting it die (direct kill)", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogs-20", "0");
    const unit = putOnBattlefield(game, "unit-blazing-scorcher", "0", 0);
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);
    expect(unit.statuses.preventNextDeathThisTurn).toBe(true);

    destroyInstance(game, getCard, unit.instanceId);

    expect(game.instances[unit.instanceId]).toBeDefined();
    expect(unit.zone).toBe("base");
    expect(unit.exhausted).toBe(true);
    expect(unit.damage).toBe(0);
    expect(unit.statuses.preventNextDeathThisTurn).toBe(false);
  });

  it("doesn't fire Deathknell effects for the recalled unit", () => {
    const game = makeGame();
    const ekko = putOnBase(game, "ogn-110", "0"); // Ekko, Recurrent — recycles self + readies runes on death
    ekko.statuses.preventNextDeathThisTurn = true;
    game.players["0"].runePool.push({ instanceId: "r0", domain: "Mind", exhausted: true });

    destroyInstance(game, getCard, ekko.instanceId);

    expect(game.instances[ekko.instanceId]).toBeDefined();
    expect(game.players["0"].runePool[0].exhausted).toBe(true); // unchanged — Deathknell didn't fire
    expect(game.players["0"].mainDeck).not.toContain("ogn-110"); // recycleSelfOnDestroy didn't fire either
  });

  it("saves a unit from lethal spell damage", () => {
    const game = makeGame();
    const unit = putOnBase(game, "unit-doomed-recruit", "0");
    unit.statuses.preventNextDeathThisTurn = true;

    dealSpellDamage(game, getCard, unit.instanceId, 5, "1");

    expect(game.instances[unit.instanceId]).toBeDefined();
    expect(unit.zone).toBe("base");
  });

  it("saves a unit from lethal combat damage", () => {
    const game = makeGame();
    const defender = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    defender.statuses.preventNextDeathThisTurn = true;
    const attacker = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0);
    attacker.exhausted = true;

    resolveCombat(game, getCard, 0, "1");

    expect(game.instances[defender.instanceId]).toBeDefined();
    expect(defender.zone).toBe("base");
  });
});

describe("Tactical Retreat (unl-175)", () => {
  it("heals, exhausts, and recalls the strongest friendly unit instead of letting it die", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-175", "0");
    const unit = putOnBattlefield(game, "unit-blazing-scorcher", "0", 0);
    unit.damage = 2;
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);
    destroyInstance(game, getCard, unit.instanceId);

    expect(game.instances[unit.instanceId]).toBeDefined();
    expect(unit.zone).toBe("base");
    expect(unit.exhausted).toBe(true);
    expect(unit.damage).toBe(0);
  });
});
