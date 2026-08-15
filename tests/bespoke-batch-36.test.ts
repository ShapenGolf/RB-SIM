import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
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

describe("Lady of Luminosity - Starter (ogs-21)", () => {
  it("draws 1 when a 5+ Energy spell is played", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogs-21", exhausted: false };
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    const spellCard = { ...getCard("unit-doomed-recruit"), type: "spell" as const, energyCost: 5 };

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", spellCard, 1);
    expect(game.players["0"].hand).toEqual(["unit-doomed-recruit"]);
  });

  it("doesn't draw for a cheaper spell", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogs-21", exhausted: false };
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    const spellCard = { ...getCard("unit-doomed-recruit"), type: "spell" as const, energyCost: 3 };

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", spellCard, 1);
    expect(game.players["0"].hand).toEqual([]);
  });
});

describe("Might of Demacia - Starter (ogs-23)", () => {
  it("draws 2 when conquering with 4+ units at that battlefield", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogs-23", exhausted: false };
    game.players["0"].mainDeck = ["unit-doomed-recruit", "token-tentacle"];
    for (let i = 0; i < 4; i += 1) putOnBattlefield(game, "unit-doomed-recruit", "0", 0);

    resolveCombat(game, getCard, 0, "0");
    expect(game.players["0"].hand).toEqual(["unit-doomed-recruit", "token-tentacle"]);
  });

  it("doesn't draw with fewer than 4 units there", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogs-23", exhausted: false };
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    putOnBattlefield(game, "unit-doomed-recruit", "0", 0);

    resolveCombat(game, getCard, 0, "0");
    expect(game.players["0"].hand).toEqual([]);
  });
});

describe("The Boss (ogn-269)", () => {
  it("readies the Legend when its controller conquers", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "ogn-269", exhausted: true };
    putOnBattlefield(game, "unit-doomed-recruit", "0", 0);

    resolveCombat(game, getCard, 0, "0");
    expect(game.players["0"].legend?.exhausted).toBe(false);
  });
});

describe("Voidreaver (unl-201)", () => {
  it("gains 1 XP when its controller wins a combat", () => {
    const game = makeGame();
    game.players["0"].legend = { cardId: "unl-201", exhausted: false };
    putOnBattlefield(game, "unit-blazing-scorcher", "0", 0);
    putOnBattlefield(game, "token-tentacle", "1", 0);

    resolveCombat(game, getCard, 0, "0");
    expect(game.players["0"].xp).toBe(1);
  });
});
