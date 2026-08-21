import { describe, it, expect } from "vitest";
import type { Ctx } from "boardgame.io";
import { enumerateBotActions, isBotTurn } from "../src/ai/enumerate";
import { isValidDamageOrder } from "../src/game/combat";
import { getCard } from "../src/cards/db";
import { makeGame, putOnBase } from "./helpers";

function fakeCtx(overrides: Partial<Ctx> = {}): Ctx {
  return { currentPlayer: "0", phase: "play", turn: 4, numPlayers: 2, playOrder: ["0", "1"], playOrderPos: 0, activePlayers: null, ...overrides } as Ctx;
}

/**
 * Bot-opponent candidate-move enumeration (see ai/enumerate.ts's file doc comment): the bot must
 * never read hidden information (opponent hand/deck contents, either deck's order) to decide what
 * it CAN do — these tests exercise every branch (pregame phases, reactive windows, normal turn)
 * against real GameState shapes, using the same fixture cards the rest of the suite relies on.
 */
describe("ai/enumerate: isBotTurn", () => {
  it("false when it isn't playerID's turn and no window is open", () => {
    const game = makeGame();
    expect(isBotTurn(game, fakeCtx({ currentPlayer: "1" }), "0")).toBe(false);
  });

  it("true on playerID's own normal turn", () => {
    const game = makeGame();
    expect(isBotTurn(game, fakeCtx({ currentPlayer: "0" }), "0")).toBe(true);
  });

  it("true for the RESPONDER to a spell reaction window, false for the caster", () => {
    const game = makeGame();
    game.pendingSpellReaction = { casterId: "0", cardId: "unit-plain-footman", instanceId: "x", payAdditionalCost: false, repeatCount: 1 };
    expect(isBotTurn(game, fakeCtx({ currentPlayer: "0" }), "0")).toBe(false);
    expect(isBotTurn(game, fakeCtx({ currentPlayer: "0" }), "1")).toBe(true);
  });

  it("false once ctx.gameover is set", () => {
    const game = makeGame();
    expect(isBotTurn(game, fakeCtx({ gameover: { winner: "0" } }), "0")).toBe(false);
  });
});

describe("ai/enumerate: pregame phases", () => {
  it("battlefieldSelect: one chooseBattlefield candidate per pooled card", () => {
    const game = makeGame();
    // makeGame() uses the domain-cycling MVP setup fallback, which auto-fills chosenBattlefieldId
    // when battlefieldPool starts empty (see game/setup.ts) — reset it to simulate a real
    // DeckList-based match that HASN'T picked yet.
    game.players["0"].battlefieldPool = ["battlefield-a", "battlefield-b"];
    game.players["0"].chosenBattlefieldId = null;
    const actions = enumerateBotActions(game, fakeCtx({ phase: "battlefieldSelect" }), "0");
    expect(actions.map((a) => a.move)).toEqual(["chooseBattlefield", "chooseBattlefield"]);
    expect(actions.map((a) => a.args.cardId).sort()).toEqual(["battlefield-a", "battlefield-b"]);
  });

  it("battlefieldSelect: no candidates once already chosen", () => {
    const game = makeGame();
    game.players["0"].battlefieldPool = ["battlefield-a"];
    game.players["0"].chosenBattlefieldId = "battlefield-a";
    expect(enumerateBotActions(game, fakeCtx({ phase: "battlefieldSelect" }), "0")).toEqual([]);
  });

  it("mulligan: a single keep-hand candidate", () => {
    const game = makeGame();
    const actions = enumerateBotActions(game, fakeCtx({ phase: "mulligan" }), "0");
    expect(actions).toEqual([{ move: "mulligan", args: { handIndices: [] }, label: "mulligan(keep hand)" }]);
  });
});

describe("ai/enumerate: reactive windows", () => {
  it("pendingPredict: keeps the current top-of-deck order without touching the rest", () => {
    const game = makeGame();
    game.players["0"].mainDeck = ["a", "b", "c", "d"];
    game.players["0"].pendingPredict = 2;
    const actions = enumerateBotActions(game, fakeCtx(), "0");
    expect(actions).toEqual([
      { move: "resolvePredict", args: { recyclePositions: [], keepOrder: [0, 1] }, label: "resolvePredict(keep order)" },
    ]);
  });

  it("pendingDamageAssignment: submits a single, always-valid rank-sorted order", () => {
    const game = makeGame();
    const t1 = putOnBase(game, "unit-plain-footman", "1");
    const t2 = putOnBase(game, "unit-plain-footman", "1");
    game.battlefields[0].units["1"] = [t1.instanceId, t2.instanceId];
    game.pendingDamageAssignment = {
      battlefieldIndex: 0,
      attacker: "0",
      defender: "1",
      attackerOrder: null,
      defenderOrder: null,
    };
    const actions = enumerateBotActions(game, fakeCtx(), "0");
    expect(actions).toHaveLength(1);
    expect(actions[0].move).toBe("submitDamageAssignment");
    const order = (actions[0].args as { order: string[] }).order;
    expect(isValidDamageOrder(game, getCard, [t1.instanceId, t2.instanceId], order, 0, "0")).toBe(true);
  });

  it("pendingDamageAssignment: no candidate once this side already submitted", () => {
    const game = makeGame();
    game.pendingDamageAssignment = {
      battlefieldIndex: 0,
      attacker: "0",
      defender: "1",
      attackerOrder: [],
      defenderOrder: null,
    };
    expect(enumerateBotActions(game, fakeCtx(), "0")).toEqual([]);
  });

  it("pendingSpellReaction: pass is always offered; a [Reaction] card in hand adds playCard candidates", () => {
    const game = makeGame();
    game.pendingSpellReaction = { casterId: "1", cardId: "unit-plain-footman", instanceId: "x", payAdditionalCost: false, repeatCount: 1 };
    game.players["0"].hand = ["unit-plain-footman"]; // no [Reaction] keyword — shouldn't be offered
    const actions = enumerateBotActions(game, fakeCtx(), "0");
    expect(actions).toEqual([{ move: "passReaction", args: {}, label: "passReaction" }]);
  });

  it("pendingCombatReaction: pass is always offered for the non-attacker", () => {
    const game = makeGame();
    game.pendingCombatReaction = { attacker: "1", battlefieldIndex: 0 };
    const actions = enumerateBotActions(game, fakeCtx(), "0");
    expect(actions.map((a) => a.move)).toContain("passCombatReaction");
  });
});

describe("ai/enumerate: normal main-phase turn", () => {
  it("endTurn is always offered", () => {
    const game = makeGame();
    const actions = enumerateBotActions(game, fakeCtx(), "0");
    expect(actions.map((a) => a.move)).toContain("endTurn");
  });

  it("an affordable, no-target hand card gets a playCard candidate", () => {
    const game = makeGame();
    game.players["0"].hand = ["unit-plain-footman"]; // energyCost 1, no templated/special-case target
    game.players["0"].runePool = [{ instanceId: "r0", domain: "Fury", exhausted: false }];
    const actions = enumerateBotActions(game, fakeCtx(), "0");
    const play = actions.find((a) => a.move === "playCard" && a.args.handIndex === 0);
    expect(play).toBeDefined();
    expect(play!.args.targetInstanceId).toBeUndefined();
  });

  it("an unaffordable hand card gets no playCard candidate", () => {
    const game = makeGame();
    game.players["0"].hand = ["unit-plain-footman"];
    game.players["0"].runePool = []; // can't pay the 1 Energy
    const actions = enumerateBotActions(game, fakeCtx(), "0");
    expect(actions.some((a) => a.move === "playCard")).toBe(false);
  });

  it("a card needing a chosen enemy target gets one playCard candidate per legal enemy candidate", () => {
    const game = makeGame();
    game.players["0"].hand = ["ogn-92"]; // 6 Energy + 2 Mind Power, onPlay: deal 6 to a chosen enemy unit at any battlefield
    game.players["0"].runePool = [
      { instanceId: "m0", domain: "Mind", exhausted: false },
      { instanceId: "m1", domain: "Mind", exhausted: false },
      ...Array.from({ length: 6 }, (_, i) => ({ instanceId: `e${i}`, domain: "Fury" as const, exhausted: false })),
    ];
    const enemy1 = putOnBase(game, "unit-plain-footman", "1");
    game.battlefields[0].units["1"] = [enemy1.instanceId];
    enemy1.zone = "battlefield";
    enemy1.battlefieldIndex = 0;
    const enemyOffBattlefield = putOnBase(game, "unit-plain-footman", "1"); // stays in base — not a legal candidate (anyBattlefieldOnly)

    const actions = enumerateBotActions(game, fakeCtx(), "0").filter((a) => a.move === "playCard" && a.args.handIndex === 0);
    const targets = actions.map((a) => a.args.targetInstanceId);
    expect(targets).toContain(enemy1.instanceId);
    expect(targets).not.toContain(enemyOffBattlefield.instanceId);
  });

  it("attackBattlefield: one 'send everyone' candidate and one per-unit candidate, per Battlefield", () => {
    const game = makeGame();
    const u1 = putOnBase(game, "unit-plain-footman", "0");
    const u2 = putOnBase(game, "unit-plain-footman", "0");
    const actions = enumerateBotActions(game, fakeCtx(), "0").filter((a) => a.move === "attackBattlefield");
    expect(game.battlefields).toHaveLength(2);
    // 2 battlefields * (1 "all" + 2 individual) = 6
    expect(actions).toHaveLength(6);
    const allCandidate = actions.find((a) => (a.args.unitInstanceIds as string[]).length === 2);
    expect(new Set(allCandidate!.args.unitInstanceIds as string[])).toEqual(new Set([u1.instanceId, u2.instanceId]));
  });

  it("an exhausted unit never gets an attackBattlefield candidate", () => {
    const game = makeGame();
    putOnBase(game, "unit-plain-footman", "0", { exhausted: true });
    const actions = enumerateBotActions(game, fakeCtx(), "0").filter((a) => a.move === "attackBattlefield");
    expect(actions).toEqual([]);
  });

  it("hidden-information-blind: never reads the opponent's hand contents (a bogus opponent hand card doesn't crash enumeration)", () => {
    const game = makeGame();
    game.players["1"].hand = ["this-card-id-does-not-exist-in-the-db"];
    expect(() => enumerateBotActions(game, fakeCtx(), "0")).not.toThrow();
  });
});
