import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { moveInstanceToBase, moveInstanceToBattlefield } from "../src/cards/special-cases/move-helpers";
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

describe("Harpoon Squad (sfd-137)", () => {
  it("gains +2 Might this turn when it moves from a battlefield to base", () => {
    const game = makeGame();
    const squad = putOnBattlefield(game, "sfd-137", "0", 0);
    moveInstanceToBase(game, getCard, squad.instanceId);
    expect(squad.tempMightBonus).toBe(2);
  });

  it("does not trigger when moving from base (there's nothing to leave)", () => {
    const game = makeGame();
    const squad = putOnBase(game, "sfd-137", "0");
    moveInstanceToBase(game, getCard, squad.instanceId); // already in base: no-op
    expect(squad.tempMightBonus).toBe(0);
  });

  it("also triggers on a direct battlefield-to-battlefield relocation", () => {
    const game = makeGame();
    const squad = putOnBattlefield(game, "sfd-137", "0", 0);
    moveInstanceToBattlefield(game, squad.instanceId, 1);
    expect(squad.tempMightBonus).toBe(2);
  });
});

describe("Kato the Arm (sfd-112)", () => {
  it("gives the strongest other friendly unit its keywords and +Might equal to its own Might", () => {
    const game = makeGame();
    const weak = putOnBase(game, "unit-doomed-recruit", "0");
    const strong = putOnBase(game, "unit-blazing-scorcher", "0");
    const kato = putOnBattlefield(game, "sfd-112", "0", 0);
    const card = getCard(kato.cardId);
    const katoMight = card.might ?? 0;

    SpecialCaseEngine.onMove(game, card, kato);
    expect(strong.tempMightBonus).toBe(katoMight);
    expect(weak.tempMightBonus).toBe(0);
    expect(strong.grantedThisTurn.some((k) => k.keyword === "deflect")).toBe(true);
  });
});

describe("Conscription (unl-140)", () => {
  it("takes control of the strongest eligible (<=3 Might) enemy unit at a battlefield, exhausted, recalled to base", () => {
    const game = makeGame();
    const conscript = putOnBase(game, "unl-140", "0");
    const eligible = putOnBattlefield(game, "unit-doomed-recruit", "1", 0); // Might 1
    const tooStrong = (() => {
      const inst = putOnBattlefield(game, "unit-blazing-scorcher", "1", 0);
      inst.tempMightBonus = 10; // push well above the 3-Might threshold
      return inst;
    })();
    const card = getCard(conscript.cardId);

    SpecialCaseEngine.onPlay(game, card, conscript);
    expect(eligible.controller).toBe("0");
    expect(eligible.zone).toBe("base");
    expect(eligible.exhausted).toBe(true);
    expect(game.players["0"].base).toContain(eligible.instanceId);
    expect(game.battlefields[0].units["1"]).not.toContain(eligible.instanceId);
    expect(tooStrong.controller).toBe("1");
  });

  it("does nothing if no eligible enemy unit exists", () => {
    const game = makeGame();
    const conscript = putOnBase(game, "unl-140", "0");
    const card = getCard(conscript.cardId);
    expect(() => SpecialCaseEngine.onPlay(game, card, conscript)).not.toThrow();
  });
});
