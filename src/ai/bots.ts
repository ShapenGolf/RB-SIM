import type { Ctx, MoveFn } from "boardgame.io";
import { INVALID_MOVE } from "boardgame.io/core";
import type { GameState, PlayerId } from "../game/state";
import { enumerateBotActions, isBotTurn, type BotAction } from "./enumerate";
import { evaluate } from "./evaluate";
import {
  playCard,
  attackBattlefield,
  activateAbility,
  activateLegendAbility,
  equipGear,
  empowerInstance,
  resolvePredict,
  resolveOptionalCost,
  passReaction,
  passCombatReaction,
  submitDamageAssignment,
  chooseBattlefield,
  mulligan,
} from "../game/moves";

export type BotTier = "easy" | "medium" | "hard";

/**
 * Moves the Medium/Hard search can actually invoke to simulate "what if" — everything
 * ai/enumerate.ts can produce EXCEPT `endTurn`, which is treated as a pure leaf (see `simulate`'s
 * doc comment) since actually calling it would need boardgame.io's real turn-order machinery
 * (phase `onEnd`/`order.next`), not just a G mutation, and this search never leaves the bot's own
 * turn (see ai/enumerate.ts's file doc comment on the hidden-information-blind design).
 */
const SIMULATABLE_MOVES: Record<string, MoveFn<GameState>> = {
  playCard,
  attackBattlefield,
  activateAbility,
  activateLegendAbility,
  equipGear,
  empowerInstance,
  resolvePredict,
  resolveOptionalCost,
  passReaction,
  passCombatReaction,
  submitDamageAssignment,
  chooseBattlefield,
  mulligan,
};

function noopEvents() {
  // moves.ts's functions call events.setActivePlayers/events.endTurn purely as boardgame.io
  // control signals (framework-level bookkeeping); every actual state change search cares about
  // already lands in G itself (e.g. G.pendingSpellReaction), so these can safely no-op here.
  return { setActivePlayers: () => {}, endTurn: () => {} };
}

/**
 * Applies `action` to a DEEP CLONE of `G` by calling the real moves.ts function directly — never
 * through boardgame.io's reducer/turn machinery, since this is a same-turn, own-actions-only
 * search (see ai/enumerate.ts's file doc comment) — and returns the resulting state, or null if
 * it turned out illegal (INVALID_MOVE) or isn't simulatable (currently just `endTurn`).
 */
function simulate(G: GameState, playerID: PlayerId, action: BotAction): GameState | null {
  const fn = SIMULATABLE_MOVES[action.move];
  if (!fn) return null;
  const clone: GameState = structuredClone(G);
  const context = { G: clone, events: noopEvents(), playerID } as unknown as Parameters<MoveFn<GameState>>[0];
  const result = fn(context, action.args);
  if (result === INVALID_MOVE) return null;
  return clone;
}

interface ScoredIndex {
  index: number;
  score: number;
  next: GameState | null;
}

/**
 * Greedy same-turn search shared by Medium/Hard: scores every one of `actions` (already enumerated
 * by the caller — see `pickBotActionIndex`) by simulating it (see `simulate`), then — if `depth` >
 * 0 — recurses `depth` plies deeper along the SAME turn for only the `branchCap` most promising
 * actions (bounding the search; recursing into every candidate at every depth would blow up
 * combinatorially). The recursion naturally stops the instant control passes away from the bot
 * (e.g. its own spell opened a reaction window for the opponent) because ai/enumerate.ts's
 * `isBotTurn` — checked before recursing — reads exactly the G-level pending-window fields that
 * change that. `endTurn` always scores as "the state as it already is" (see SIMULATABLE_MOVES's
 * doc comment), so "do nothing else this turn" competes fairly against every other option instead
 * of being auto-excluded. Returns the INDEX into `actions` (not the action itself) so callers that
 * enumerated their own action list — e.g. ai/boardgameBot.ts, matching boardgame.io's own
 * already-wrapped candidates 1:1 — can pick from THEIR array without a fragile re-match.
 */
function bestIndex(G: GameState, ctx: Ctx, playerID: PlayerId, actions: BotAction[], depth: number, branchCap = Infinity): ScoredIndex | null {
  if (actions.length === 0) return null;

  const scored: ScoredIndex[] = [];
  actions.forEach((action, index) => {
    if (action.move === "endTurn") {
      scored.push({ index, score: evaluate(G, playerID), next: null });
      return;
    }
    const next = simulate(G, playerID, action);
    if (!next) return;
    scored.push({ index, score: evaluate(next, playerID), next });
  });
  if (scored.length === 0) return null;

  if (depth > 0) {
    scored.sort((a, b) => b.score - a.score);
    for (const entry of scored.slice(0, branchCap)) {
      if (!entry.next || !isBotTurn(entry.next, ctx, playerID)) continue;
      const nextActions = enumerateBotActions(entry.next, ctx, playerID);
      const deeper = bestIndex(entry.next, ctx, playerID, nextActions, depth - 1, branchCap);
      if (deeper) entry.score = Math.max(entry.score, deeper.score);
    }
  }

  let best = scored[0];
  for (const entry of scored) if (entry.score > best.score) best = entry;
  return best;
}

/**
 * Picks the index of this tier's chosen action out of `actions` (a list the caller already
 * enumerated for the CURRENT real GameState, at that same G/ctx/playerID) — or null when `actions`
 * is empty. Split out from `chooseBotAction` so ai/boardgameBot.ts's boardgame.io `Bot` subclass
 * can score against ITS OWN already-enumerated (and properly move-wrapped) candidate list instead
 * of re-deriving a separate one that would need fragile re-matching afterward.
 */
export function pickBotActionIndex(tier: BotTier, G: GameState, ctx: Ctx, playerID: PlayerId, actions: BotAction[]): number | null {
  if (actions.length === 0) return null;
  if (tier === "easy") return Math.floor(Math.random() * actions.length);
  const depth = tier === "medium" ? 0 : 1;
  const branchCap = tier === "medium" ? Infinity : 5;
  return bestIndex(G, ctx, playerID, actions, depth, branchCap)?.index ?? null;
}

/**
 * Picks this tier's next action for `playerID` given the CURRENT real GameState, or null when
 * there's genuinely nothing to do. Used directly by tests and by anything that doesn't need
 * boardgame.io's own wrapped action shape — see ai/boardgameBot.ts for the version wired into the
 * actual "vs Bot" UI, which needs the UNREDACTED G (see that file's doc comment on why a
 * player-scoped, playerView-filtered G breaks this).
 */
export function chooseBotAction(tier: BotTier, G: GameState, ctx: Ctx, playerID: PlayerId): BotAction | null {
  const actions = enumerateBotActions(G, ctx, playerID);
  const index = pickBotActionIndex(tier, G, ctx, playerID, actions);
  return index === null ? null : actions[index];
}
