import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { activateAbility } from "../src/game/moves";
import { makeGame, putOnBase } from "./helpers";
import type { FnContext } from "boardgame.io";
import type { GameState } from "../src/game/state";

function ctx(G: GameState, playerID: "0" | "1") {
  return { G, playerID } as unknown as FnContext<GameState> & { playerID: string };
}

describe("Baited Hook (ogn-242)", () => {
  it("kills the weakest other friendly unit, then banishes and plays an eligible unit from the top 5", () => {
    const game = makeGame();
    const hook = putOnBase(game, "ogn-242", "0");
    const weak = putOnBase(game, "unit-doomed-recruit", "0"); // Might 1
    game.players["0"].runePool.push(
      { instanceId: "r0", domain: "Mind", exhausted: false },
      { instanceId: "r1", domain: "Order", exhausted: false },
    );
    game.players["0"].mainDeck = [
      "unit-blazing-scorcher", // Might 3, exceeds killed(1)+1=2 -> ineligible
      "unit-farsighted-scout", // Might 1, eligible
      "unit-doomed-recruit",
      "unit-doomed-recruit",
      "unit-doomed-recruit",
    ];

    const result = activateAbility(ctx(game, "0"), {
      instanceId: hook.instanceId,
      energyRuneIds: ["r0"],
      powerRuneId: "r1",
    });

    expect(result).toBeUndefined();
    expect(game.instances[weak.instanceId]).toBeUndefined();
    const played = Object.values(game.instances).find(
      (i) => i.cardId === "unit-farsighted-scout" && i.controller === "0",
    );
    expect(played).toBeDefined();
  });

  it("does nothing if no other friendly unit exists to kill", () => {
    const game = makeGame();
    const hook = putOnBase(game, "ogn-242", "0");
    game.players["0"].runePool.push(
      { instanceId: "r0", domain: "Mind", exhausted: false },
      { instanceId: "r1", domain: "Order", exhausted: false },
    );

    const result = activateAbility(ctx(game, "0"), {
      instanceId: hook.instanceId,
      energyRuneIds: ["r0"],
      powerRuneId: "r1",
    });

    expect(result).toBeUndefined();
  });
});

describe("Here to Help (sfd-111)", () => {
  it("plays a unit from hand to a controlled battlefield, ignoring cost", () => {
    const game = makeGame();
    const help = putOnBase(game, "sfd-111", "0");
    game.battlefields[0].controller = "0";
    game.players["0"].hand = ["unit-blazing-scorcher"];
    const card = getCard(help.cardId);

    SpecialCaseEngine.onPlay(game, card, help);

    expect(game.players["0"].hand).toEqual([]);
    const played = Object.values(game.instances).find(
      (i) => i.cardId === "unit-blazing-scorcher" && i.controller === "0",
    );
    expect(played).toBeDefined();
    expect(played?.zone).toBe("battlefield");
    expect(played?.battlefieldIndex).toBe(0);
  });

  it("does nothing without a controlled battlefield", () => {
    const game = makeGame();
    const help = putOnBase(game, "sfd-111", "0");
    game.players["0"].hand = ["unit-blazing-scorcher"];
    const card = getCard(help.cardId);

    SpecialCaseEngine.onPlay(game, card, help);

    expect(game.players["0"].hand).toEqual(["unit-blazing-scorcher"]);
  });
});

describe("Special-cases-todo.json is fully closed out", () => {
  const finalNoOpCases: [string, string][] = [
    ["unl-205", "abandoned-hall"],
    ["unl-57", "alpha-wildclaw"],
    ["unl-206", "altar-of-blood"],
    ["unl-169", "ashe-focused"],
    ["unl-170", "atakhan"],
    ["sfd-50", "azir-ascendant"],
    ["ogn-278", "bandle-tree"],
    ["sfd-121", "black-market-broker"],
    ["unl-139", "bone-skewer"],
    ["ogn-231", "commander-ledros"],
    ["unl-235", "deceiver"],
    ["unl-199", "deceiver"],
    ["ogn-244", "divine-judgment"],
    ["ven-157", "dragon-roost"],
    ["ogn-167", "ember-monk"],
    ["ven-132", "fallen-feline"],
    ["sfd-208", "forge-of-the-fluft"],
    ["ven-71", "fretful-feline"],
    ["unl-74", "frigid-jewel"],
    ["ven-86", "gangplank-naval"],
    ["ven-181", "gangplank-naval"],
    ["sfd-68", "gearhead"],
    ["ven-133", "glowstone"],
    ["unl-195", "green-father"],
    ["unl-233", "green-father"],
    ["ven-197", "heart-of-the-tempest"],
    ["ven-155", "heart-of-the-tempest"],
    ["ven-125", "hungry-wolf"],
    ["sfd-57", "irelia-fervent"],
    ["sfd-225", "irelia-fervent"],
    ["ven-174", "irelia-fervent"],
    ["sfd-54", "jax-unmatched"],
    ["ven-88", "jayce-hammer-in-hand"],
    ["unl-23", "katarina-reckless"],
    ["ogn-189", "kayn-unleashed"],
    ["ogn-150", "kraken-hunter"],
    ["ven-191", "master-of-shadows"],
    ["ven-143", "master-of-shadows"],
    ["ven-153", "matriarch-of-war"],
    ["ven-196", "matriarch-of-war"],
    ["ogn-152", "mistfall"],
    ["sfd-55", "needlessly-large-yordle"],
    ["ogn-194", "nocturne-horrifying"],
    ["ogn-143", "pirates-haven"],
    ["sfd-199", "prodigal-explorer"],
    ["sfd-248", "prodigal-explorer"],
    ["ogn-115", "promising-future"],
    ["ven-189", "rogue-assassin"],
    ["ven-139", "rogue-assassin"],
    ["sfd-47", "simian-ancestor"],
    ["sfd-143", "sivir-mercenary"],
    ["ven-195", "souls-reflection"],
    ["ven-151", "souls-reflection"],
    ["unl-166", "stalking-wolf"],
    ["ven-98", "stargazer"],
    ["sfd-18", "void-hatchling"],
    ["sfd-235", "yasuo-windrider"],
    ["ogn-205", "yasuo-windrider"],
  ];

  for (const [cardId, specialCaseId] of finalNoOpCases) {
    it(`${cardId} resolves to the ${specialCaseId} handler`, () => {
      expect(getCard(cardId).specialCaseId).toBe(specialCaseId);
    });
  }
});
