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

describe("Counter Strike (sfd-194)", () => {
  it("prevents the next spell damage to the strongest friendly unit, then draws 1", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-194", "0");
    const unit = putOnBase(game, "unit-blazing-scorcher", "0");
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);
    expect(unit.statuses.preventNextDamageThisTurn).toBe(true);
    expect(game.players["0"].hand).toContain("unit-doomed-recruit");

    dealSpellDamage(game, getCard, unit.instanceId, 5, "1");
    expect(unit.damage).toBe(0);
    expect(unit.statuses.preventNextDamageThisTurn).toBe(false);

    dealSpellDamage(game, getCard, unit.instanceId, 5, "1");
    expect(unit.damage).toBe(5);
  });

  it("also prevents the next combat damage instance", () => {
    const game = makeGame();
    const defender = putOnBattlefield(game, "unit-blazing-scorcher", "0", 0);
    defender.statuses.preventNextDamageThisTurn = true;
    const attacker = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0);
    attacker.exhausted = true;

    resolveCombat(game, getCard, 0, "1");

    expect(defender.damage).toBe(0);
    expect(defender.statuses.preventNextDamageThisTurn).toBe(false);
  });
});
