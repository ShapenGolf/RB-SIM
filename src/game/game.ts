import type { Game } from "boardgame.io";
import { ActivePlayers } from "boardgame.io/core";
import { setupGame, type SetupOptions } from "./setup";
import { getPendingSetupOptions } from "./pendingSetup";
import { runTurnStart, markFirstTurnTaken } from "./turnFlow";
import {
  playCard,
  attackBattlefield,
  resolvePredict,
  activateAbility,
  activateLegendAbility,
  resolveOptionalCost,
  endTurn,
  equipGear,
  mulligan,
  chooseBattlefield,
} from "./moves";
import type { GameState, PlayerId } from "./state";

export const RiftboundGame: Game<GameState, Record<string, never>, SetupOptions> = {
  name: "riftbound",
  minPlayers: 2,
  maxPlayers: 2,

  // `setupData` is never actually populated by the Local() transport for an on-demand match
  // (see game/pendingSetup.ts) — read the real options from there instead.
  setup: () => setupGame(getPendingSetupOptions()),

  phases: {
    // Both players pick which of their own 3 deck-submitted Battlefields joins the table,
    // simultaneously (ActivePlayers.ALL) — right after clicking "Spiel starten", before either
    // hand is even dealt out for mulligans.
    battlefieldSelect: {
      start: true,
      moves: { chooseBattlefield },
      turn: { activePlayers: ActivePlayers.ALL },
      endIf: ({ G }) => G.players["0"].chosenBattlefieldId !== null && G.players["1"].chosenBattlefieldId !== null,
      next: "mulligan",
    },
    // Both players choose their opening-hand mulligan simultaneously, independent of turn order
    // (ActivePlayers.ALL keeps both playerIDs allowed to call moves at once) — turn 1's Awaken/
    // Beginning/Channel/Draw (in the "play" phase below) must not fire until both are done.
    mulligan: {
      moves: { mulligan },
      turn: { activePlayers: ActivePlayers.ALL },
      endIf: ({ G }) => G.players["0"].mulliganDone && G.players["1"].mulliganDone,
      next: "play",
    },
    play: {
      turn: {
        onBegin: ({ G, ctx }) => {
          if (G.extraTurnFor === (ctx.currentPlayer as PlayerId)) G.extraTurnFor = null;
          runTurnStart(G, ctx.currentPlayer as PlayerId);
        },
        onEnd: ({ G, ctx }) => {
          markFirstTurnTaken(G, ctx.currentPlayer as PlayerId);
        },
        order: {
          first: () => 0,
          next: ({ G, ctx }) =>
            G.extraTurnFor === (ctx.currentPlayer as PlayerId)
              ? ctx.playOrderPos
              : (ctx.playOrderPos + 1) % ctx.numPlayers,
        },
      },
      moves: {
        playCard,
        attackBattlefield,
        resolvePredict,
        activateAbility,
        activateLegendAbility,
        resolveOptionalCost,
        endTurn,
        equipGear,
      },
    },
  },

  endIf: ({ G }) => {
    if (G.winner) return { winner: G.winner };
    return undefined;
  },
};
