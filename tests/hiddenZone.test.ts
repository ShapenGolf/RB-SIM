import { describe, it, expect } from "vitest";
import { INVALID_MOVE } from "boardgame.io/core";
import { hideCard, playFromHidden, attackBattlefield } from "../src/game/moves";
import { runBeginning } from "../src/game/turnFlow";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function moveCtx(G: GameState, playerID: "0" | "1", turn = 1) {
  return { G, playerID, ctx: { turn }, events: { setActivePlayers: () => {} } } as unknown as Parameters<typeof hideCard>[0];
}

function moveToBattlefield(game: GameState, instanceId: string, battlefieldIndex: number) {
  const instance = game.instances[instanceId];
  instance.zone = "battlefield";
  instance.battlefieldIndex = battlefieldIndex;
  const player = game.players[instance.controller];
  player.base = player.base.filter((id) => id !== instanceId);
  game.battlefields[battlefieldIndex].units[instance.controller].push(instanceId);
}

/**
 * [Hidden] (rule 811): play a card face-down into a private reserve now (game/state.ts's
 * `hiddenZone`), bound to a Battlefield this player controls, costing 1 recycled Rune; play it
 * later for free (0 Energy/Power), no earlier than next turn — see moves.ts's
 * hideCard/playFromHidden.
 */
describe("hideCard", () => {
  it("moves a [Hidden] card from hand to the hidden zone, bound to a controlled battlefield, recycling 1 Rune", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-57"]; // Block (ogn-57) has the [Hidden] keyword
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury" as const, exhausted: false }];
    game.battlefields[0].controller = "0";

    const result = hideCard(moveCtx(game, "0", 3), { handIndex: 0, runeId: "r1", battlefieldIndex: 0 });

    expect(result).toBeUndefined();
    expect(game.players["0"].hand).toEqual([]);
    expect(game.players["0"].hiddenZone).toEqual([{ cardId: "ogn-57", battlefieldIndex: 0, hiddenOnGameTurn: 3 }]);
    expect(game.players["0"].runePool).toEqual([]);
    expect(game.players["0"].runeDeck.map((r) => r.instanceId)).toContain("r1");
  });

  it("rejects a card without the [Hidden] keyword", () => {
    const game = makeGame();
    game.players["0"].hand = ["unit-plain-footman"];
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury" as const, exhausted: false }];
    game.battlefields[0].controller = "0";

    const result = hideCard(moveCtx(game, "0"), { handIndex: 0, runeId: "r1", battlefieldIndex: 0 });

    expect(result).toBe(INVALID_MOVE);
  });

  it("rejects hiding without a Rune to recycle", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-57"];
    game.players["0"].runePool = [];
    game.battlefields[0].controller = "0";

    const result = hideCard(moveCtx(game, "0"), { handIndex: 0, runeId: "does-not-exist", battlefieldIndex: 0 });

    expect(result).toBe(INVALID_MOVE);
  });

  it("rejects hiding at a battlefield this player doesn't control (rule 811.1.b)", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-57"];
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury" as const, exhausted: false }];
    game.battlefields[0].controller = "1"; // opponent controls it
    game.battlefields[1].controller = null; // uncontrolled

    expect(hideCard(moveCtx(game, "0"), { handIndex: 0, runeId: "r1", battlefieldIndex: 0 })).toBe(INVALID_MOVE);
    expect(hideCard(moveCtx(game, "0"), { handIndex: 0, runeId: "r1", battlefieldIndex: 1 })).toBe(INVALID_MOVE);
  });

  it("rejects a second card hidden at a battlefield that already has one hidden there (rule 811.1.b, max 1)", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-57", "ogn-57"];
    game.players["0"].runePool = [
      { instanceId: "r1", domain: "Fury" as const, exhausted: false },
      { instanceId: "r2", domain: "Fury" as const, exhausted: false },
    ];
    game.battlefields[0].controller = "0";
    hideCard(moveCtx(game, "0"), { handIndex: 0, runeId: "r1", battlefieldIndex: 0 });

    const result = hideCard(moveCtx(game, "0"), { handIndex: 0, runeId: "r2", battlefieldIndex: 0 });

    expect(result).toBe(INVALID_MOVE);
    expect(game.players["0"].hiddenZone).toHaveLength(1);
  });
});

describe("playFromHidden", () => {
  it("plays a card from the hidden zone for free and resolves its real onPlay effect", () => {
    const game = makeGame();
    game.players["0"].hiddenZone = [{ cardId: "ogn-57", battlefieldIndex: 0, hiddenOnGameTurn: 1 }];
    const weakUnit = putOnBase(game, "unit-doomed-recruit", "0");

    const result = playFromHidden(moveCtx(game, "0", 2), { hiddenIndex: 0 });

    expect(result).toBeUndefined();
    expect(game.players["0"].hiddenZone).toEqual([]);
    // Block: "Give a unit [Shield 3] and [Tank] this turn" — targets the weakest friendly unit.
    expect(weakUnit.grantedThisTurn).toContainEqual({ keyword: "shield", value: 3 });
    expect(weakUnit.grantedThisTurn).toContainEqual({ keyword: "tank" });
    // Spells go to trash after resolving, same as a normal hand play.
    expect(game.players["0"].trash).toContain("ogn-57");
  });

  it("rejects playing from an empty hidden zone", () => {
    const game = makeGame();
    game.players["0"].hiddenZone = [];

    const result = playFromHidden(moveCtx(game, "0"), { hiddenIndex: 0 });

    expect(result).toBe(INVALID_MOVE);
  });

  it("rejects playing on the SAME turn it was hidden, and allows it once the turn has advanced (rule 811.1.b)", () => {
    const game = makeGame();
    game.players["0"].hiddenZone = [{ cardId: "ogn-57", battlefieldIndex: 0, hiddenOnGameTurn: 5 }];
    putOnBase(game, "unit-doomed-recruit", "0");

    expect(playFromHidden(moveCtx(game, "0", 5), { hiddenIndex: 0 })).toBe(INVALID_MOVE);
    expect(game.players["0"].hiddenZone).toHaveLength(1); // untouched

    expect(playFromHidden(moveCtx(game, "0", 6), { hiddenIndex: 0 })).toBeUndefined();
    expect(game.players["0"].hiddenZone).toEqual([]);
  });

  it("deploys a hidden PERMANENT straight to the battlefield it was hidden at, not Base (rule 811.1.d.1)", () => {
    const game = makeGame();
    game.players["0"].hiddenZone = [{ cardId: "ogn-97", battlefieldIndex: 1, hiddenOnGameTurn: 1 }]; // Blastcone Fae, a unit
    const friendly = putOnBase(game, "unit-doomed-recruit", "0");
    moveToBattlefield(game, friendly.instanceId, 1);

    const result = playFromHidden(moveCtx(game, "0", 2), { hiddenIndex: 0, targetInstanceId: friendly.instanceId });

    expect(result).toBeUndefined();
    const played = Object.values(game.instances).find((i) => i.cardId === "ogn-97");
    expect(played?.zone).toBe("battlefield");
    expect(played?.battlefieldIndex).toBe(1);
    expect(game.battlefields[1].units["0"]).toContain(played?.instanceId);
  });

  it("restricts a hidden card's onPlay target to units at the battlefield it was hidden at (rule 811.1.d.2)", () => {
    const game = makeGame();
    game.players["0"].hiddenZone = [{ cardId: "ogn-97", battlefieldIndex: 1, hiddenOnGameTurn: 1 }]; // Blastcone Fae: "give a unit -2 Might"
    const atBattlefield = putOnBase(game, "unit-doomed-recruit", "0");
    moveToBattlefield(game, atBattlefield.instanceId, 1);
    const atBase = putOnBase(game, "unit-plain-footman", "0"); // NOT at battlefield 1

    // A unit at the hidden battlefield is a legal target.
    expect(playFromHidden(moveCtx(game, "0", 2), { hiddenIndex: 0, targetInstanceId: atBattlefield.instanceId })).toBeUndefined();

    // Re-hide and try again, this time targeting the unit that's NOT at the hidden battlefield.
    game.players["0"].hiddenZone = [{ cardId: "ogn-97", battlefieldIndex: 1, hiddenOnGameTurn: 1 }];
    const result = playFromHidden(moveCtx(game, "0", 2), { hiddenIndex: 0, targetInstanceId: atBase.instanceId });
    expect(result).toBe(INVALID_MOVE);
  });

  it("discards a hidden card to trash the instant its bound battlefield's control changes (rule 323.7/461.5.c)", () => {
    const game = makeGame();
    game.battlefields[0].controller = "0";
    game.players["0"].hiddenZone = [{ cardId: "ogn-57", battlefieldIndex: 0, hiddenOnGameTurn: 1 }];
    const attacker = putOnBase(game, "unit-plain-footman", "1"); // Might 2, still in Base

    // Player "1" walks in — battlefield 0 has no defenders, so it's conquered outright, flipping
    // control away from player "0", who had a card hidden there.
    attackBattlefield(moveCtx(game, "1"), { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });

    expect(game.players["0"].hiddenZone).toEqual([]);
    expect(game.players["0"].trash).toContain("ogn-57");
    expect(game.battlefields[0].controller).toBe("1");
  });

  it("does NOT discard a hidden card bound to a DIFFERENT battlefield when another one changes control", () => {
    const game = makeGame();
    game.battlefields[0].controller = "0";
    game.battlefields[1].controller = "0";
    game.players["0"].hiddenZone = [{ cardId: "ogn-57", battlefieldIndex: 1, hiddenOnGameTurn: 1 }];
    const attacker = putOnBase(game, "unit-plain-footman", "1"); // still in Base

    attackBattlefield(moveCtx(game, "1"), { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });

    expect(game.players["0"].hiddenZone).toHaveLength(1); // still bound to battlefield 1, untouched
    expect(game.battlefields[0].controller).toBe("1");
    expect(game.battlefields[1].controller).toBe("0");
  });
});

describe("Ember Monk (ogn-167): +2 Might when a card is played from Hidden", () => {
  it("buffs itself when its controller plays any card from Hidden", () => {
    const game = makeGame();
    const monk = putOnBase(game, "ogn-167", "0");
    game.players["0"].hiddenZone = [{ cardId: "ogn-57", battlefieldIndex: 0, hiddenOnGameTurn: 1 }];
    putOnBase(game, "unit-doomed-recruit", "0");

    playFromHidden(moveCtx(game, "0", 2), { hiddenIndex: 0 });

    expect(monk.tempMightBonus).toBe(2);
  });
});

describe("Black Market Broker (sfd-121): Gold gear token when a card is played from face down", () => {
  it("plays a Gold gear token on any Hidden play", () => {
    const game = makeGame();
    putOnBase(game, "sfd-121", "0");
    game.players["0"].hiddenZone = [{ cardId: "ogn-57", battlefieldIndex: 0, hiddenOnGameTurn: 1 }];
    putOnBase(game, "unit-doomed-recruit", "0");
    const baseCountBefore = game.players["0"].base.length;

    playFromHidden(moveCtx(game, "0", 2), { hiddenIndex: 0 });

    const goldGear = game.players["0"].base
      .slice(baseCountBefore)
      .map((id) => game.instances[id])
      .find((i) => i.cardId === "token-gold-gear");
    expect(goldGear).toBeDefined();
  });
});

describe("Katarina, Reckless (unl-23): ready on hide, damage on play-from-Hidden", () => {
  it("readies Katarina when her controller hides a card", () => {
    const game = makeGame();
    const kat = putOnBase(game, "unl-23", "0", { exhausted: true });
    game.players["0"].hand = ["ogn-57"];
    game.players["0"].runePool = [{ instanceId: "r1", domain: "Fury" as const, exhausted: false }];
    game.battlefields[0].controller = "0";

    hideCard(moveCtx(game, "0"), { handIndex: 0, runeId: "r1", battlefieldIndex: 0 });

    expect(kat.exhausted).toBe(false);
  });

  it("deals 2 to the strongest enemy unit when a card is played from Hidden", () => {
    const game = makeGame();
    putOnBase(game, "unl-23", "0");
    game.players["0"].hiddenZone = [{ cardId: "ogn-57", battlefieldIndex: 0, hiddenOnGameTurn: 1 }];
    putOnBase(game, "unit-doomed-recruit", "0");
    const weakEnemy = putOnBase(game, "unit-plain-footman", "1");
    const strongEnemy = putOnBase(game, "unit-blazing-scorcher", "1");

    playFromHidden(moveCtx(game, "0", 2), { hiddenIndex: 0 });

    expect(strongEnemy.damage).toBe(2);
    expect(weakEnemy.damage).toBe(0);
  });
});

describe("Mushroom Pouch (ogn-101): draw 1 at Beginning if you control a facedown card at a battlefield", () => {
  it("draws 1 when a card is hidden at a battlefield the controller still holds", () => {
    const game = makeGame();
    putOnBase(game, "ogn-101", "0"); // Mushroom Pouch, a gear
    game.battlefields[0].controller = "0";
    game.players["0"].hiddenZone = [{ cardId: "ogn-57", battlefieldIndex: 0, hiddenOnGameTurn: 1 }];
    game.players["0"].mainDeck = ["unit-plain-footman"];

    runBeginning(game, "0");

    expect(game.players["0"].hand).toContain("unit-plain-footman");
  });

  it("draws nothing with an empty Hidden zone", () => {
    const game = makeGame();
    putOnBase(game, "ogn-101", "0");
    game.players["0"].hiddenZone = [];
    game.players["0"].mainDeck = ["unit-plain-footman"];

    runBeginning(game, "0");

    expect(game.players["0"].hand).toEqual([]);
  });
});

describe("Noxus Saboteur (ogn-18): opponents' [Hidden] cards can't be revealed here", () => {
  it("blocks the OPPONENT from playing a card out of Hidden at Noxus Saboteur's battlefield", () => {
    const game = makeGame();
    const saboteur = putOnBase(game, "ogn-18", "0");
    game.battlefields[0].controller = "1"; // battlefield 0 belongs to player "1"...
    saboteur.zone = "battlefield";
    saboteur.battlefieldIndex = 0;
    game.players["0"].base = [];
    game.battlefields[0].units["0"] = [saboteur.instanceId]; // ...but Noxus Saboteur (controlled by "0") sits there too
    game.players["1"].hiddenZone = [{ cardId: "ogn-57", battlefieldIndex: 0, hiddenOnGameTurn: 1 }];

    const result = playFromHidden(moveCtx(game, "1", 2), { hiddenIndex: 0 });

    expect(result).toBe(INVALID_MOVE);
  });

  it("does not block its OWN controller from revealing there", () => {
    const game = makeGame();
    const saboteur = putOnBase(game, "ogn-18", "0");
    game.battlefields[0].controller = "0";
    saboteur.zone = "battlefield";
    saboteur.battlefieldIndex = 0;
    game.players["0"].base = [];
    game.battlefields[0].units["0"] = [saboteur.instanceId];
    game.players["0"].hiddenZone = [{ cardId: "ogn-57", battlefieldIndex: 0, hiddenOnGameTurn: 1 }];
    putOnBase(game, "unit-doomed-recruit", "0");

    const result = playFromHidden(moveCtx(game, "0", 2), { hiddenIndex: 0 });

    expect(result).toBeUndefined();
  });
});

describe("Bandle Tree (ogn-278): you may hide an additional card here", () => {
  it("allows a SECOND card to be hidden at Bandle Tree, unlike a normal battlefield's 1-card cap", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "ogn-278"; // Bandle Tree
    game.battlefields[0].controller = "0";
    game.players["0"].hand = ["ogn-57", "ogn-57"];
    game.players["0"].runePool = [
      { instanceId: "r1", domain: "Fury" as const, exhausted: false },
      { instanceId: "r2", domain: "Fury" as const, exhausted: false },
    ];

    hideCard(moveCtx(game, "0"), { handIndex: 0, runeId: "r1", battlefieldIndex: 0 });
    const result = hideCard(moveCtx(game, "0"), { handIndex: 0, runeId: "r2", battlefieldIndex: 0 });

    expect(result).toBeUndefined();
    expect(game.players["0"].hiddenZone).toHaveLength(2);
  });

  it("still caps at 2, not unlimited", () => {
    const game = makeGame();
    game.battlefields[0].cardId = "ogn-278";
    game.battlefields[0].controller = "0";
    game.players["0"].hand = ["ogn-57", "ogn-57", "ogn-57"];
    game.players["0"].runePool = [
      { instanceId: "r1", domain: "Fury" as const, exhausted: false },
      { instanceId: "r2", domain: "Fury" as const, exhausted: false },
      { instanceId: "r3", domain: "Fury" as const, exhausted: false },
    ];

    hideCard(moveCtx(game, "0"), { handIndex: 0, runeId: "r1", battlefieldIndex: 0 });
    hideCard(moveCtx(game, "0"), { handIndex: 0, runeId: "r2", battlefieldIndex: 0 });
    const result = hideCard(moveCtx(game, "0"), { handIndex: 0, runeId: "r3", battlefieldIndex: 0 });

    expect(result).toBe(INVALID_MOVE);
    expect(game.players["0"].hiddenZone).toHaveLength(2);
  });
});
