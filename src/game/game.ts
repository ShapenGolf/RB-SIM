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
} from "./moves";
import type { GameState, PlayerId } from "./state";

export const RiftboundGame: Game<GameState, Record<string, never>, SetupOptions> = {
  name: "riftbound",
  minPlayers: 2,
  maxPlayers: 2,

  setup: (_context, setupData) => setupGame(setupData ?? defaultSetupOptions),

  turn: {
    onBegin: ({ G, ctx }) => {
      runTurnStart(G, ctx.currentPlayer as PlayerId);
    },
    onEnd: ({ G, ctx }) => {
      markFirstTurnTaken(G, ctx.currentPlayer as PlayerId);
    },
  },

  moves: {
    playCard,
    attackBattlefield,
    resolvePredict,
    activateAbility,
    resolveOptionalCost,
    endTurn,
  },

  endIf: ({ G }) => {
    if (G.winner) return { winner: G.winner };
    return undefined;
  },
};
