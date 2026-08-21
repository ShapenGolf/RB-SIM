import { describe, it, expect } from "vitest";
import type { Ctx } from "boardgame.io";
import { attackBattlefield } from "../src/game/moves";
import { RiftboundGame } from "../src/game/game";
import { createBotClass } from "../src/ai/boardgameBot";
import { enumerateBotActionsOrFallback } from "../src/ai/enumerate";
import { makeGame, putOnBase } from "./helpers";
import type { GameState } from "../src/game/state";

function fakeCtx(overrides: Partial<Ctx> = {}): Ctx {
  return { currentPlayer: "0", phase: "play", turn: 4, numPlayers: 2, playOrder: ["0", "1"], playOrderPos: 0, activePlayers: null, ...overrides } as Ctx;
}

function ctxArgs(G: GameState, playerID: "0" | "1") {
  return { G, playerID, events: { setActivePlayers: () => {}, endTurn: () => {} } } as unknown as Parameters<typeof attackBattlefield>[0];
}

/**
 * Regression coverage for the crash a real playtest hit: a human attacking a Battlefield opens a
 * PendingCombatReaction window (see moves.ts's attackBattlefield/hasReactionOrActionSpellInHand),
 * which needs the BOT (as defender) to decide whether to react. moves.ts's own window-opening
 * check reads the DEFENDER's real hand contents — that's fine when it's the true, unredacted G
 * (which is what boardgame.io's LocalMaster always operates on), but an earlier version of this
 * feature drove the bot through a SECOND, playerID-scoped `Client`, whose `getState().G` is
 * ALWAYS `playerView`-redacted for the opponent's zones (see game/playerView.ts) — so
 * `G.players[humanId].hand` there was `["hidden"]`, and `getCard("hidden")` threw the instant the
 * bot tried to reason about a reaction window. ai/boardgameBot.ts fixes this by hooking into
 * boardgame.io's native `game.ai` + `Local({ bots })` integration point instead, which the
 * framework always invokes against its own canonical state. This test exercises exactly that
 * failure shape directly against `RiftboundGame.ai.enumerate` and a real `Bot` subclass — with a
 * REAL (non-redacted) card identity sitting in the defender's hand — and asserts it resolves
 * cleanly instead of throwing.
 */
describe("ai/boardgameBot: combat-reaction window", () => {
  it("RiftboundGame.ai.enumerate never throws when the defender's hand has a real [Reaction] card", () => {
    const game = makeGame();
    const attacker = putOnBase(game, "unit-plain-footman", "0");
    game.players["1"].hand = ["ogn-64"]; // Wind Wall — [Reaction], "Counter a spell" (real, unredacted card id)

    const result = attackBattlefield(ctxArgs(game, "0"), { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });
    expect(result).toBeUndefined();
    expect(game.pendingCombatReaction).not.toBeNull();

    expect(() => RiftboundGame.ai!.enumerate(game, fakeCtx(), "1")).not.toThrow();
    const actions = RiftboundGame.ai!.enumerate(game, fakeCtx(), "1");
    expect(actions.length).toBeGreaterThan(0);
    // Wind Wall's counter-intent is rejected for a COMBAT window (see moves.ts) — only passing is offered.
    expect(actions.every((a) => "move" in a && a.move === "passCombatReaction")).toBe(true);
  });

  it("game.ai.enumerate wraps each action's args in a 1-element array (boardgame.io's own move-dispatch convention)", () => {
    const game = makeGame();
    const actions = RiftboundGame.ai!.enumerate(game, fakeCtx(), "0");
    expect(actions.length).toBeGreaterThan(0);
    for (const a of actions) {
      expect("move" in a).toBe(true);
      if ("move" in a) expect(Array.isArray(a.args)).toBe(true);
    }
  });

  for (const tier of ["easy", "medium", "hard"] as const) {
    it(`createBotClass("${tier}").play() resolves the combat-reaction window without throwing, using the TRUE (unredacted) G`, async () => {
      const game = makeGame();
      const attacker = putOnBase(game, "unit-plain-footman", "0");
      game.players["1"].hand = ["ogn-64"];

      attackBattlefield(ctxArgs(game, "0"), { battlefieldIndex: 0, unitInstanceIds: [attacker.instanceId] });
      expect(game.pendingCombatReaction).not.toBeNull();

      const BotClass = createBotClass(tier);
      const bot = new BotClass({ enumerate: RiftboundGame.ai!.enumerate, seed: "test-seed" });
      const result = await bot.play({ G: game, ctx: fakeCtx() } as never, "1");

      expect(result.action).toBeDefined();
      expect("payload" in result.action).toBe(true);
      if ("payload" in result.action) {
        expect(result.action.payload.type).toBe("passCombatReaction");
        expect(result.action.payload.playerID).toBe("1");
      }
    });
  }
});

/**
 * Regression coverage for a SECOND crash the same playtest hit, one commit later: boardgame.io's
 * `Local()` transport decides whether to ask a bot to move via its OWN `ctx.activePlayers`/
 * `currentPlayer` check (`GetBotPlayer`), independent of ai/enumerate.ts's `isBotTurn`. The two can
 * disagree — most commonly a PendingDamageAssignment window (opened with `{all: Stage.NULL}`, see
 * combat.ts), where THIS side already submitted its order but the OTHER side hasn't, so
 * `ctx.activePlayers` still lists both sides even though `isBotTurn` correctly says "nothing left
 * for you to do" for the side that already submitted. A boardgame.io `Bot.play()` MUST return SOME
 * action; returning `{action: undefined}` crashes boardgame.io's own LocalMaster
 * (`botAction.action.payload.playerID` throws) — this is exactly what happened in the browser.
 */
describe("ai/enumerate: enumerateBotActionsOrFallback", () => {
  it("falls back to a harmless endTurn when isBotTurn considers there to be nothing left to do", () => {
    const game = makeGame();
    game.pendingDamageAssignment = {
      battlefieldIndex: 0,
      attacker: "1",
      defender: "0",
      attackerOrder: ["already-submitted"], // this side (the bot, "1") already went
      defenderOrder: null, // still waiting on "0"
    };
    const ctx = { currentPlayer: "1", phase: "play", turn: 4, numPlayers: 2, playOrder: ["0", "1"], playOrderPos: 0, activePlayers: { "0": null, "1": null } } as unknown as Ctx;

    expect(() => enumerateBotActionsOrFallback(game, ctx, "1")).not.toThrow();
    const actions = enumerateBotActionsOrFallback(game, ctx, "1");
    expect(actions).toEqual([{ move: "endTurn", args: {}, label: "endTurn(fallback — nothing else to do)" }]);
  });

  it("createBotClass(...).play() never returns an undefined action in that same scenario", async () => {
    const game = makeGame();
    game.pendingDamageAssignment = {
      battlefieldIndex: 0,
      attacker: "1",
      defender: "0",
      attackerOrder: ["already-submitted"],
      defenderOrder: null,
    };
    const ctx = { currentPlayer: "1", phase: "play", turn: 4, numPlayers: 2, playOrder: ["0", "1"], playOrderPos: 0, activePlayers: { "0": null, "1": null } } as unknown as Ctx;

    const BotClass = createBotClass("easy");
    const bot = new BotClass({ enumerate: RiftboundGame.ai!.enumerate, seed: "test-seed" });
    const result = await bot.play({ G: game, ctx } as never, "1");

    expect(result.action).toBeDefined();
    expect("payload" in result.action).toBe(true);
  });
});
