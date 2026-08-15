import { describe, it, expect } from "vitest";
import type { FnContext } from "boardgame.io";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { activateLegendAbility, attackBattlefield } from "../src/game/moves";
import { computeMight } from "../src/game/might";
import { legendPseudoInstance } from "../src/game/pseudoInstance";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as FnContext<GameState> & { playerID: string };
}

describe("Bashful Bloom (unl-230)", () => {
  it("costs 4 Energy with no Temporary units, less per friendly Temporary unit", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "unl-230", exhausted: false };
    const card = getCard("unl-230");
    const instance = legendPseudoInstance("unl-230", "0", false);
    expect(SpecialCaseEngine.activatedAbilityCost(game, card, instance)).toEqual({ energy: 4, exhaustSelf: true });

    putOnBase(game, "token-sprite-temporary", "0");
    expect(SpecialCaseEngine.activatedAbilityCost(game, card, instance)).toEqual({ energy: 3, exhaustSelf: true });
  });

  it("plays a ready 3 Might Sprite token via the real activateLegendAbility move", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "unl-230", exhausted: false };
    game.players["0"].runePool.push(
      ...Array.from({ length: 4 }, (_, i) => ({ instanceId: `e${i}`, domain: "Mind" as const, exhausted: false })),
    );

    const result = activateLegendAbility(ctx(game, "0"), { energyRuneIds: ["e0", "e1", "e2", "e3"] });
    expect(result).toBeUndefined();
    const token = Object.values(game.instances).find((i) => i.cardId === "token-sprite-temporary");
    expect(token).toBeDefined();
    expect(token?.exhausted).toBe(false);
  });
});

describe("Emperor of the Sands (sfd-197)", () => {
  it("plays a 2 Might Sand Soldier token to base for 1 Energy", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "sfd-197", exhausted: false };
    game.players["0"].runePool.push({ instanceId: "e0", domain: "Mind", exhausted: false });

    const result = activateLegendAbility(ctx(game, "0"), { energyRuneIds: ["e0"] });
    expect(result).toBeUndefined();
    const token = Object.values(game.instances).find((i) => i.cardId === "token-sand-soldier-2");
    expect(token).toBeDefined();
    expect(game.players["0"].base).toContain(token?.instanceId);
  });
});

describe("Nine-Tailed Fox (ogn-303)", () => {
  it("gives -1 Might to an enemy unit attacking a battlefield the controller holds", () => {
    const game = makeGame();
    game.players["1"].legend = { cardId: "ogn-303", exhausted: false };
    game.battlefields[0].controller = "1";
    const attacker = putOnBase(game, "unit-blazing-scorcher", "0");

    attackBattlefield(ctx(game, "0"), { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });
    expect(computeMight(game, getCard, attacker, "none")).toBe((getCard(attacker.cardId).might ?? 0) - 1);
  });

  it("doesn't reduce Might below 1", () => {
    const game = makeGame();
    game.players["1"].legend = { cardId: "ogn-303", exhausted: false };
    game.battlefields[0].controller = "1";
    const attacker = putOnBase(game, "unit-doomed-recruit", "0"); // Might 1

    attackBattlefield(ctx(game, "0"), { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });
    expect(computeMight(game, getCard, attacker, "none")).toBe(1);
  });

  it("doesn't trigger against a battlefield the attacker's own side controls", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogn-303", exhausted: false };
    game.battlefields[0].controller = "0";
    const attacker = putOnBase(game, "unit-blazing-scorcher", "0");

    attackBattlefield(ctx(game, "0"), { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });
    expect(computeMight(game, getCard, attacker, "none")).toBe(getCard(attacker.cardId).might ?? 0);
  });
});
