import type { Game } from "boardgame.io";
import { setupGame, type SetupOptions, defaultSetupOptions } from "./setup";
import { runTurnStart, markFirstTurnTaken } from "./turnFlow";
import {
  playCard,
  attackBattlefield,
  resolvePredict,
  activateAbility,
  resolveOptionalCost,
  endTurn,
  equipGear,
} from "./moves";
import type { GameState, PlayerId } from "./state";

export const RiftboundGame: Game<GameState, Record<string, never>, SetupOptions> = {
  name: "riftbound",
  minPlayers: 2,
  maxPlayers: 2,

  setup: (_context, setupData) => setupGame(setupData ?? defaultSetupOptions),

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
    resolveOptionalCost,
    endTurn,
    equipGear,
  },

  endIf: ({ G }) => {
    if (G.winner) return { winner: G.winner };
    return undefined;
  },
};
