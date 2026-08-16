import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { dealSpellDamage } from "../src/game/spellDamage";
import { resolveCombat } from "../src/game/combat";
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

describe("Imperial Decree (ogn-221)", () => {
  it("sets the anyDamageKillsThisTurn flag on play", () => {
    const game = makeGame();
    const decree = putOnBase(game, "ogn-221", "0");
    const card = getCard(decree.cardId);

    expect(game.anyDamageKillsThisTurn).toBe(false);
    SpecialCaseEngine.onPlay(game, card, decree);
    expect(game.anyDamageKillsThisTurn).toBe(true);
  });

  it("kills a unit that takes even 1 spell damage this turn", () => {
    const game = makeGame();
    game.anyDamageKillsThisTurn = true;
    const tough = putOnBase(game, "unit-blazing-scorcher", "1"); // Might 3, would survive 1 damage normally

    dealSpellDamage(game, getCard, tough.instanceId, 1, "0");

    expect(game.instances[tough.instanceId]).toBeUndefined();
  });

  it("doesn't kill a unit that takes 0 damage (fully absorbed)", () => {
    const game = makeGame();
    game.anyDamageKillsThisTurn = true;
    const shielded = putOnBase(game, "unit-doomed-recruit", "1");
    shielded.damagePreventionPool = 5;

    dealSpellDamage(game, getCard, shielded.instanceId, 1, "0");

    expect(game.instances[shielded.instanceId]).toBeDefined();
  });

  it("kills any unit that takes combat damage this turn, regardless of toughness", () => {
    const game = makeGame();
    game.anyDamageKillsThisTurn = true;
    putOnBattlefield(game, "unit-doomed-recruit", "0", 0); // Might 1, attacker
    const tough = putOnBattlefield(game, "ven-118", "1", 0); // Might 6, would easily survive 1 damage

    resolveCombat(game, getCard, 0, "0");

    expect(game.instances[tough.instanceId]).toBeUndefined();
  });

  it("doesn't affect units that take no damage this turn", () => {
    const game = makeGame();
    game.anyDamageKillsThisTurn = true;
    const untouched = putOnBase(game, "unit-doomed-recruit", "0");

    expect(game.instances[untouched.instanceId]).toBeDefined();
    expect(untouched.damage).toBe(0);
  });
});
