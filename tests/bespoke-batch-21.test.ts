import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { dealSpellDamage } from "../src/game/spellDamage";
import { runChannel } from "../src/game/turnFlow";
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

describe("Ol' Poro (ven-29)", () => {
  it("blocks self-play on the controller's first three turns", () => {
    const game = makeGame();
    const poro = putOnBase(game, "ven-29", "0");
    const card = getCard(poro.cardId);
    game.players["0"].turnsTaken = 3;
    expect(SpecialCaseEngine.blocksSelfPlay(game, card, poro)).toBe(true);
  });

  it("allows self-play from the fourth turn on", () => {
    const game = makeGame();
    const poro = putOnBase(game, "ven-29", "0");
    const card = getCard(poro.cardId);
    game.players["0"].turnsTaken = 4;
    expect(SpecialCaseEngine.blocksSelfPlay(game, card, poro)).toBe(false);
  });
});

describe("Altar of Memories (sfd-169)", () => {
  it("exhausts to draw 1 and recycle 1 when a friendly unit dies, only if not already exhausted", () => {
    const game = makeGame();
    const altar = putOnBase(game, "sfd-169", "0");
    const diedUnit = putOnBase(game, "unit-doomed-recruit", "0");
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    game.players["0"].hand = ["token-tentacle"];

    SpecialCaseEngine.onAllyUnitDied(game, getCard, "0", diedUnit);
    expect(altar.exhausted).toBe(true);
    expect(game.players["0"].hand).toEqual(["unit-doomed-recruit"]);
    expect(game.players["0"].mainDeck).toEqual(["token-tentacle"]);

    // Already exhausted: does nothing on a second death this turn.
    game.players["0"].mainDeck = ["token-shadow-clone"];
    SpecialCaseEngine.onAllyUnitDied(game, getCard, "0", diedUnit);
    expect(game.players["0"].hand).toEqual(["unit-doomed-recruit"]);
  });
});

describe("Esteemed Hierophant (ven-25)", () => {
  it("takes spell damage from enemies while under the rune threshold", () => {
    const game = makeGame();
    const hierophant = putOnBase(game, "ven-25", "0");
    dealSpellDamage(game, getCard, hierophant.instanceId, 2, "1");
    expect(game.instances[hierophant.instanceId].damage).toBe(2);
  });

  it("prevents all enemy spell damage at 7+ runes", () => {
    const game = makeGame();
    const hierophant = putOnBase(game, "ven-25", "0");
    for (let i = 0; i < 7; i += 1) {
      game.players["0"].runePool.push({ instanceId: `r${i}`, domain: "Mind", exhausted: false });
    }
    dealSpellDamage(game, getCard, hierophant.instanceId, 5, "1");
    expect(game.instances[hierophant.instanceId].damage).toBe(0);
  });

  it("still takes damage from its own controller's spells at 7+ runes", () => {
    const game = makeGame();
    const hierophant = putOnBase(game, "ven-25", "0");
    for (let i = 0; i < 7; i += 1) {
      game.players["0"].runePool.push({ instanceId: `r${i}`, domain: "Mind", exhausted: false });
    }
    dealSpellDamage(game, getCard, hierophant.instanceId, 3, "0");
    expect(game.instances[hierophant.instanceId].damage).toBe(3);
  });
});

describe("Arachnoid Horror (unl-117)", () => {
  it("allows playing itself to a battlefield where the opponent has exactly one unit", () => {
    const game = makeGame();
    putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const horror = putOnBase(game, "unl-117", "0");
    const card = getCard(horror.cardId);
    expect(SpecialCaseEngine.allowsPlayToLoneEnemyBattlefield(game, getCard, card, horror, 0)).toBe(true);
  });

  it("does not allow it when the opponent has two or more units there", () => {
    const game = makeGame();
    putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    putOnBattlefield(game, "token-tentacle", "1", 0);
    const horror = putOnBase(game, "unl-117", "0");
    const card = getCard(horror.cardId);
    expect(SpecialCaseEngine.allowsPlayToLoneEnemyBattlefield(game, getCard, card, horror, 0)).toBe(false);
  });

  it("also grants the permission to other friendly units while Arachnoid Horror is in play", () => {
    const game = makeGame();
    putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    putOnBase(game, "unl-117", "0");
    const other = putOnBase(game, "token-tentacle", "0");
    const otherCard = getCard(other.cardId);
    expect(SpecialCaseEngine.allowsPlayToLoneEnemyBattlefield(game, getCard, otherCard, other, 0)).toBe(true);
  });
});

describe("Acceleration Gate (ven-150)", () => {
  it("readies up to 4 exhausted friendly units/gear/runes, no more", () => {
    const game = makeGame();
    const gate = putOnBase(game, "ven-150", "0");
    const units = Array.from({ length: 5 }, () => putOnBase(game, "unit-doomed-recruit", "0", { exhausted: true }));
    game.players["0"].runePool.push({ instanceId: "r0", domain: "Mind", exhausted: true });
    const card = getCard(gate.cardId);

    SpecialCaseEngine.onPlay(game, card, gate);
    const readiedCount = units.filter((u) => !game.instances[u.instanceId].exhausted).length;
    const runeReadied = game.players["0"].runePool[0].exhausted === false;
    expect(readiedCount + (runeReadied ? 1 : 0)).toBe(4);
  });
});

describe("Ocean Drake (ven-115)", () => {
  it("allows play to an open battlefield", () => {
    const game = makeGame();
    const drake = putOnBase(game, "ven-115", "0");
    const card = getCard(drake.cardId);
    expect(SpecialCaseEngine.allowsPlayToOpenBattlefield(game, card, drake)).toBe(true);
  });

  it("bounces the strongest non-Dragon enemy unit when played", () => {
    const game = makeGame();
    putOnBase(game, "unit-doomed-recruit", "1");
    const strong = putOnBase(game, "unit-blazing-scorcher", "1");
    const drake = putOnBase(game, "ven-115", "0");
    const card = getCard(drake.cardId);

    SpecialCaseEngine.onPlay(game, card, drake);
    expect(game.instances[strong.instanceId]).toBeUndefined();
    expect(game.players["1"].hand).toContain("unit-blazing-scorcher");
  });
});

describe("Sandstone Chimera (ven-36)", () => {
  it("caps Channel Phase gains at 1 rune while at a battlefield, for both players", () => {
    const game = makeGame();
    putOnBattlefield(game, "ven-36", "0", 0);
    game.players["1"].hasTakenFirstTurn = true;
    game.players["1"].runeDeck = Array.from({ length: 5 }, (_, i) => ({
      instanceId: `d${i}`,
      domain: "Mind" as const,
      exhausted: false,
    }));
    runChannel(game, "1");
    expect(game.players["1"].runePool.length).toBe(1);
  });

  it("doesn't cap Channel Phase gains while only on base (not at a battlefield)", () => {
    const game = makeGame();
    putOnBase(game, "ven-36", "0");
    game.players["1"].hasTakenFirstTurn = true;
    game.players["1"].runeDeck = Array.from({ length: 5 }, (_, i) => ({
      instanceId: `d${i}`,
      domain: "Mind" as const,
      exhausted: false,
    }));
    runChannel(game, "1");
    expect(game.players["1"].runePool.length).toBe(2);
  });
});
