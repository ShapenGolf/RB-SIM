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

describe("Cursed Sarcophagus (unl-148)", () => {
  it("banishes all units from trash, leaving other card types", () => {
    const game = makeGame();
    const gear = putOnBase(game, "unl-148", "0");
    game.players["0"].trash = ["unit-doomed-recruit", "sfd-169", "unit-blazing-scorcher"]; // sfd-169 is a gear
    const card = getCard(gear.cardId);

    SpecialCaseEngine.onPlay(game, card, gear);

    expect(game.players["0"].banishment).toEqual(["unit-doomed-recruit", "unit-blazing-scorcher"]);
    expect(game.players["0"].trash).toEqual(["sfd-169"]);
  });

  it("plays a banished unit ignoring cost when activated", () => {
    const game = makeGame();
    const gear = putOnBase(game, "unl-148", "0");
    game.players["0"].banishment = ["unit-doomed-recruit"];
    const card = getCard(gear.cardId);

    SpecialCaseEngine.onActivate(game, card, gear);

    expect(game.players["0"].banishment).toEqual([]);
    const played = Object.values(game.instances).find((i) => i.cardId === "unit-doomed-recruit" && i.controller === "0");
    expect(played).toBeDefined();
  });
});

describe("Forgotten Signpost (unl-45)", () => {
  it("exhausts another ready friendly unit and moves the target to its location", () => {
    const game = makeGame();
    const signpost = putOnBase(game, "unl-45", "0");
    const costUnit = putOnBattlefield(game, "unit-doomed-recruit", "0", 1);
    const target = putOnBattlefield(game, "unit-blazing-scorcher", "0", 0);
    const card = getCard(signpost.cardId);

    SpecialCaseEngine.onActivate(game, card, signpost, target.instanceId);

    expect(costUnit.exhausted).toBe(true);
    expect(target.battlefieldIndex).toBe(1);
  });

  it("does nothing without a valid unit target", () => {
    const game = makeGame();
    const signpost = putOnBase(game, "unl-45", "0");
    const card = getCard(signpost.cardId);
    expect(() => SpecialCaseEngine.onActivate(game, card, signpost)).not.toThrow();
  });
});
