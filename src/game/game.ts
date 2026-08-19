import type { Game } from "boardgame.io";
import { ActivePlayers } from "boardgame.io/core";
import { setupGame, type SetupOptions } from "./setup";
import { getPendingSetupOptions } from "./pendingSetup";
import { runTurnStart, markFirstTurnTaken } from "./turnFlow";
import { playerView } from "./playerView";
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
  empowerInstance,
  submitDeck,
  hideCard,
  playFromHidden,
  passReaction,
  passCombatReaction,
  submitDamageAssignment,
} from "./moves";
import type { GameState, PlayerId } from "./state";

export const RiftboundGame: Game<GameState, Record<string, never>, SetupOptions> = {
  name: "riftbound",
  minPlayers: 2,
  maxPlayers: 2,

  // The `Local()` transport never populates `setupData` for an on-demand match (see
  // game/pendingSetup.ts) — fall back to that stash for local hotseat play. A real server
  // (SocketIO transport, see ui/client.ts) receives whatever setupData the Lobby API's
  // `/create` call was given, but online matches are created with none — decks arrive later,
  // per-player, via the "deckSelect" phase's `submitDeck` move below.
  setup: (_context, setupData) => setupGame(setupData ?? getPendingSetupOptions()),

  playerView,

  phases: {
    // Online-only in practice: each player submits their own locally-saved deck. A local
    // hotseat match already has both decks from setup() (see above), so both players' pools are
    // non-empty from tick 0 and this phase's endIf is instantly true — it's skipped without
    // either player seeing it. Simultaneous (ActivePlayers.ALL): order doesn't matter.
    deckSelect: {
      start: true,
      moves: { submitDeck },
      turn: { activePlayers: ActivePlayers.ALL },
      endIf: ({ G }) => G.players["0"].battlefieldPool.length > 0 && G.players["1"].battlefieldPool.length > 0,
      next: "battlefieldSelect",
    },
    // Both players pick which of their own 3 deck-submitted Battlefields joins the table,
    // simultaneously (ActivePlayers.ALL) — right after clicking "Spiel starten", before either
    // hand is even dealt out for mulligans.
    battlefieldSelect: {
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
        empowerInstance,
        hideCard,
        playFromHidden,
        passReaction,
        passCombatReaction,
        submitDamageAssignment,
      },
    },
  },

  endIf: ({ G }) => {
    if (G.winner) return { winner: G.winner };
    return undefined;
  },
};
