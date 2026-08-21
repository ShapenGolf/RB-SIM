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

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

interface ScoredAction {
  action: BotAction;
  score: number;
  next: GameState | null;
}

/**
 * Greedy same-turn search shared by Medium/Hard: scores every candidate action by simulating it
 * (see `simulate`), then — if `depth` > 0 — recurses `depth` plies deeper along the SAME turn for
 * only the `branchCap` most promising actions (bounding the search; recursing into every
 * candidate at every depth would blow up combinatorially). The recursion naturally stops the
 * instant control passes away from the bot (e.g. its own spell opened a reaction window for the
 * opponent) because ai/enumerate.ts's `isBotTurn` — checked before recursing — reads exactly the
 * G-level pending-window fields that change that. `endTurn` always scores as "the state as it
 * already is" (see SIMULATABLE_MOVES's doc comment), so "do nothing else this turn" competes
 * fairly against every other option instead of being auto-excluded.
 */
function bestAction(G: GameState, ctx: Ctx, playerID: PlayerId, depth: number, branchCap = Infinity): ScoredAction | null {
  const actions = enumerateBotActions(G, ctx, playerID);
  if (actions.length === 0) return null;

  const scored: ScoredAction[] = [];
  for (const action of actions) {
    if (action.move === "endTurn") {
      scored.push({ action, score: evaluate(G, playerID), next: null });
      continue;
    }
    const next = simulate(G, playerID, action);
    if (!next) continue;
    scored.push({ action, score: evaluate(next, playerID), next });
  }
  if (scored.length === 0) return null;

  if (depth > 0) {
    scored.sort((a, b) => b.score - a.score);
    for (const entry of scored.slice(0, branchCap)) {
      if (!entry.next || !isBotTurn(entry.next, ctx, playerID)) continue;
      const deeper = bestAction(entry.next, ctx, playerID, depth - 1, branchCap);
      if (deeper) entry.score = Math.max(entry.score, deeper.score);
    }
  }

  let best = scored[0];
  for (const entry of scored) if (entry.score > best.score) best = entry;
  return best;
}

/** Easy: uniformly random legal-ish candidate — no scoring, no lookahead at all. */
function chooseEasy(G: GameState, ctx: Ctx, playerID: PlayerId): BotAction | null {
  const actions = enumerateBotActions(G, ctx, playerID);
  return actions.length > 0 ? pickRandom(actions) : null;
}

/** Medium: greedy — the single action whose immediate resulting state scores highest, no lookahead beyond it. */
function chooseMedium(G: GameState, ctx: Ctx, playerID: PlayerId): BotAction | null {
  return bestAction(G, ctx, playerID, 0)?.action ?? null;
}

/** Hard: same greedy scoring, plus one more own-turn ply of lookahead for the 5 most promising immediate actions. */
function chooseHard(G: GameState, ctx: Ctx, playerID: PlayerId): BotAction | null {
  return bestAction(G, ctx, playerID, 1, 5)?.action ?? null;
}

/**
 * Picks this tier's next action for `playerID` given the CURRENT real GameState, or null when
 * there's genuinely nothing to do — the driver (ui/botDriver.ts) should only call this when
 * ai/enumerate.ts's `isBotTurn` says it's actually this bot's turn/window.
 */
export function chooseBotAction(tier: BotTier, G: GameState, ctx: Ctx, playerID: PlayerId): BotAction | null {
  if (tier === "easy") return chooseEasy(G, ctx, playerID);
  if (tier === "medium") return chooseMedium(G, ctx, playerID);
  return chooseHard(G, ctx, playerID);
}
