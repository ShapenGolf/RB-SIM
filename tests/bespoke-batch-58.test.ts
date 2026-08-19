import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
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

describe("Dramatic Visionary (unl-62)", () => {
  it("sets pendingPredict on destroy (Deathknell)", () => {
    const game = makeGame();
    const unit = putOnBase(game, "unl-62", "0");
    const card = getCard(unit.cardId);
    SpecialCaseEngine.onDestroy(game, card, unit);
    expect(game.players["0"].pendingPredict).toBe(2);
  });
});

describe("Emperor's Divide (sfd-43)", () => {
  it("moves all friendly units at a battlefield to base", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-43", "0");
    const u1 = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    const u2 = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(u1.zone).toBe("base");
    expect(u2.zone).toBe("base");
  });
});

describe("Edge of Night (sfd-139)", () => {
  it("registers with a no-op handler (Equip already works generically)", () => {
    const game = makeGame();
    const gear = putOnBase(game, "sfd-139", "0");
    const card = getCard(gear.cardId);
    expect(() => SpecialCaseEngine.onPlay(game, card, gear)).not.toThrow();
  });
});

describe("Existential Dread (unl-134)", () => {
  it("stuns an enemy unit at a battlefield", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-134", "0");
    const enemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(enemy.statuses.stunned).toBe(true);
  });

  it("returns an already-stunned enemy unit to hand instead", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-134", "0");
    const enemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    enemy.statuses.stunned = true;
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.instances[enemy.instanceId]).toBeUndefined();
    expect(game.players["1"].hand).toContain("unit-doomed-recruit");
  });
});

describe("Facebreaker (ogn-220)", () => {
  it("stuns a friendly and an enemy unit at the same battlefield", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-220", "0");
    const friendly = putOnBattlefield(game, "unit-doomed-recruit", "0", 0);
    const enemy = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(friendly.statuses.stunned).toBe(true);
    expect(enemy.statuses.stunned).toBe(true);
  });
});

describe("Forecaster (sfd-65)", () => {
  it("sets pendingPredict when a friendly Mech is played", () => {
    const game = makeGame();
    putOnBase(game, "sfd-65", "0");
    const mechCard = getCard("ogn-56"); // Adaptatron, tagged Mech
    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", mechCard, 1);
    expect(game.players["0"].pendingPredict).toBe(1);
  });

  it("doesn't trigger for non-Mech units", () => {
    const game = makeGame();
    putOnBase(game, "sfd-65", "0");
    const unitCard = getCard("unit-doomed-recruit");
    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", unitCard, 1);
    expect(game.players["0"].pendingPredict).toBe(0);
  });
});

describe("Fresh Beans (unl-11)", () => {
  it("exhausts itself to draw 1 when a unit is played", () => {
    const game = makeGame();
    const beans = putOnBase(game, "unl-11", "0");
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    const unitCard = getCard("unit-doomed-recruit");

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", unitCard, 1);

    expect(beans.exhausted).toBe(true);
    expect(game.players["0"].hand).toContain("unit-doomed-recruit");
  });
});

describe("Guards! (sfd-154)", () => {
  it("plays a ready 2-Might Sand Soldier token", () => {
    const game = makeGame();
    const spell = putOnBase(game, "sfd-154", "0");
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    const token = Object.values(game.instances).find((i) => i.cardId === "token-sand-soldier-2" && i.controller === "0");
    expect(token).toBeDefined();
    expect(token!.exhausted).toBe(false);
  });
});

describe("Guerilla Warfare (ogn-264)", () => {
  it("returns up to 2 Hidden cards from trash to hand", () => {
    const game = makeGame();
    const spell = putOnBase(game, "ogn-264", "0");
    game.players["0"].trash = ["ogn-97", "unit-doomed-recruit", "ogn-97"]; // Blastcone Fae has Hidden
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.players["0"].hand.filter((id) => id === "ogn-97").length).toBe(2);
    expect(game.players["0"].trash).toEqual(["unit-doomed-recruit"]);
  });
});

describe("Heedless Resurrection (unl-142)", () => {
  it("kills the weakest friendly unit and plays the priciest eligible unit from trash, ignoring cost", () => {
    const game = makeGame();
    const spell = putOnBase(game, "unl-142", "0");
    const weak = putOnBase(game, "unit-doomed-recruit", "0"); // 1 Energy
    game.players["0"].trash = ["unit-doomed-recruit"]; // 1 Energy, eligible
    const card = getCard(spell.cardId);

    SpecialCaseEngine.onPlay(game, card, spell);

    expect(game.instances[weak.instanceId]).toBeUndefined();
    // destroyInstance trashes the killed unit's own card, so exactly one "unit-doomed-recruit"
    // remains in trash (the one just killed) after the pre-set trash copy is played from.
    expect(game.players["0"].trash).toEqual(["unit-doomed-recruit"]);
    const played = Object.values(game.instances).find((i) => i.cardId === "unit-doomed-recruit" && i.controller === "0");
    expect(played).toBeDefined();
  });
});
