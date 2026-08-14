import type { SetupOptions } from "./setup";
import { defaultSetupOptions } from "./setup";

/**
 * boardgame.io's `Local()` transport never threads client-supplied `setupData` through to
 * `game.setup()` for an on-demand-created match (it hardcodes `setupData: undefined` — see
 * Master.onSync in boardgame.io/dist/boardgameio.es.js). Since this is same-browser hotseat
 * play with no real network boundary, we sidestep that by stashing the chosen decks here right
 * before mounting a fresh match (see ui/App.tsx), and having game.ts's `setup()` read it back.
 */
let pending: SetupOptions = defaultSetupOptions;

export function setPendingSetupOptions(options: SetupOptions): void {
  pending = options;
}

export function getPendingSetupOptions(): SetupOptions {
  return pending;
}
