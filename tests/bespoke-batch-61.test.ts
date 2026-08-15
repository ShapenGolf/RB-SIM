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

describe("Keeper of Masks (unl-81)", () => {
  it("plays 2 copies of itself at the same location", () => {
    const game = makeGame();
    const keeper = putOnBattlefield(game, "unl-81", "0", 1);
    const card = getCard(keeper.cardId);

    SpecialCaseEngine.onPlay(game, card, keeper);

    const copies = Object.values(game.instances).filter(
      (i) => i.cardId === "unl-81" && i.instanceId !== keeper.instanceId && i.controller === "0",
    );
    expect(copies.length).toBe(2);
    for (const copy of copies) {
      expect(copy.zone).toBe("battlefield");
      expect(copy.battlefieldIndex).toBe(1);
      expect(copy.statuses.temporary).toBe(true);
    }
  });
});

describe("Lillia, Fae Fawn (unl-82)", () => {
  it("plays a 3-Might Temporary Sprite token at the battlefield it moved from", () => {
    const game = makeGame();
    const lillia = putOnBattlefield(game, "unl-82", "0", 0);

    moveInstanceToBattlefield(game, lillia.instanceId, 1);

    const token = Object.values(game.instances).find(
      (i) => i.cardId === "token-sprite-temporary" && i.controller === "0",
    );
    expect(token).toBeDefined();
    expect(token!.zone).toBe("battlefield");
    expect(token!.battlefieldIndex).toBe(0);
    expect(token!.statuses.temporary).toBe(true);
  });

  it("also fires when moved to base", () => {
    const game = makeGame();
    const lillia = putOnBattlefield(game, "unl-82", "0", 0);

    moveInstanceToBase(game, getCard, lillia.instanceId);

    const token = Object.values(game.instances).find(
      (i) => i.cardId === "token-sprite-temporary" && i.controller === "0",
    );
    expect(token).toBeDefined();
    expect(token!.battlefieldIndex).toBe(0);
  });
});

describe("Loyal Pup (sfd-126)", () => {
  it("moves itself to the battlefield being attacked", () => {
    const game = makeGame();
    game.battlefields[0].controller = "0";
    const pup = putOnBase(game, "sfd-126", "0");
    const attacker = putOnBattlefield(game, "unit-doomed-recruit", "1", 0);

    SpecialCaseEngine.onEnemyAttackHere(game, getCard, "0", attacker);

    expect(pup.zone).toBe("battlefield");
    expect(pup.battlefieldIndex).toBe(0);
  });
});

describe("Jayce, Brilliant Inventor (ven-68)", () => {
  it("readies the strongest exhausted friendly unit", () => {
    const game = makeGame();
    const jayce = putOnBase(game, "ven-68", "0");
    const weak = putOnBase(game, "unit-doomed-recruit", "0", { exhausted: true });
    const strong = putOnBase(game, "unit-blazing-scorcher", "0", { exhausted: true });
    const card = getCard(jayce.cardId);

    SpecialCaseEngine.onPlay(game, card, jayce);

    expect(strong.exhausted).toBe(false);
    expect(weak.exhausted).toBe(true);
  });
});

describe("Jhin, Murderous Artist (unl-22)", () => {
  it("registers with a no-op handler ([Add] isn't wired)", () => {
    const game = makeGame();
    const jhin = putOnBase(game, "unl-22", "0");
    const card = getCard(jhin.cardId);
    expect(() => SpecialCaseEngine.onMove(game, card, jhin)).not.toThrow();
  });
});

describe("Jayce, Man of Progress reprint (ven-175)", () => {
  it("shares the same handler as sfd-84", () => {
    expect(getCard("ven-175").specialCaseId).toBe(getCard("sfd-84").specialCaseId);
  });
});
