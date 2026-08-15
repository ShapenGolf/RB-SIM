import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { computeMight } from "../src/game/might";
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

describe("Forbidding Waste (unl-210)", () => {
  it("gives a lone defender -2 Might", () => {
    const game = makeGame();
    game.battlefields[0] = { cardId: "unl-210", units: { "0": [], "1": [] }, controller: null };
    const defender = putOnBattlefield(game, "unit-plain-footman", "0", 0);

    expect(computeMight(game, getCard, defender, "defending")).toBe((getCard(defender.cardId).might ?? 0) - 2);
    expect(computeMight(game, getCard, defender, "attacking")).toBe(getCard(defender.cardId).might ?? 0);
  });

  it("gives no penalty when another friendly unit is also there", () => {
    const game = makeGame();
    game.battlefields[0] = { cardId: "unl-210", units: { "0": [], "1": [] }, controller: null };
    const defender = putOnBattlefield(game, "unit-plain-footman", "0", 0);
    putOnBattlefield(game, "unit-doomed-recruit", "0", 0);

    expect(computeMight(game, getCard, defender, "defending")).toBe(getCard(defender.cardId).might ?? 0);
  });
});

describe("Affectionate Poro (ven-24)", () => {
  it("draws a card after surviving combat undamaged this turn", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    const poro = putOnBattlefield(game, "ven-24", "0", 0);
    const card = getCard(poro.cardId);

    SpecialCaseEngine.onSurviveCombat(game, card, poro);

    expect(game.players["0"].hand).toEqual(["unit-doomed-recruit"]);
  });

  it("doesn't draw if it took damage this turn", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["unit-doomed-recruit"];
    const poro = putOnBattlefield(game, "ven-24", "0", 0);
    poro.statuses.tookDamageThisTurn = true;
    const card = getCard(poro.cardId);

    SpecialCaseEngine.onSurviveCombat(game, card, poro);

    expect(game.players["0"].hand).toEqual([]);
  });
});

describe("Kinkou Lifeblade (ven-93)", () => {
  it("has no bonus and no Ganking while not Empowered", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-93", "0");
    const card = getCard(unit.cardId);

    expect(SpecialCaseEngine.staticMightModifier(game, card, unit)).toBe(0);
    expect(SpecialCaseEngine.hasConditionalGanking(game, card, unit)).toBe(false);
  });

  it("gets +1 Might and Ganking once Empowered", () => {
    const game = makeGame();
    const unit = putOnBase(game, "ven-93", "0");
    unit.statuses.empowered = true;
    const card = getCard(unit.cardId);

    expect(SpecialCaseEngine.staticMightModifier(game, card, unit)).toBe(1);
    expect(SpecialCaseEngine.hasConditionalGanking(game, card, unit)).toBe(true);
  });
});

describe("Chemtech Cask (sfd-63)", () => {
  it("exhausts itself to play a Gold gear token when a spell is played on the opponent's turn", () => {
    const game = makeGame();
    const cask = putOnBase(game, "sfd-63", "0");
    game.activePlayer = "1"; // opponent's turn
    const spellCard = getCard("ven-150"); // any real spell card, just needs type === "spell"

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", spellCard, 1);

    expect(cask.exhausted).toBe(true);
    const tokenId = game.players["0"].base.find((id) => game.instances[id].cardId === "token-gold-gear");
    expect(tokenId).toBeDefined();
    expect(game.instances[tokenId!].exhausted).toBe(true);
  });

  it("doesn't trigger on the controller's own turn", () => {
    const game = makeGame();
    const cask = putOnBase(game, "sfd-63", "0");
    game.activePlayer = "0"; // controller's own turn
    const spellCard = getCard("ven-150");

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", spellCard, 1);

    expect(cask.exhausted).toBe(false);
  });

  it("doesn't trigger for a non-spell card", () => {
    const game = makeGame();
    const cask = putOnBase(game, "sfd-63", "0");
    game.activePlayer = "1";
    const unitCard = getCard("unit-plain-footman");

    SpecialCaseEngine.onAllyCardPlayed(game, getCard, "0", unitCard, 1);

    expect(cask.exhausted).toBe(false);
  });
});

describe("Leona, Determined (ven-184, reused leona-determined handler)", () => {
  it("resolves to the shared handler", () => {
    const card = getCard("ven-184");
    expect(card.specialCaseId).toBe("leona-determined");
  });
});
