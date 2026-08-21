import type { GameState, PlayerId } from "../game/state";
import { getCard } from "../cards/db";
import { computeMight } from "../game/might";

export interface EvalWeights {
  points: number;
  boardMight: number;
  xp: number;
  handSize: number;
  battlefieldControl: number;
}

export const DEFAULT_WEIGHTS: EvalWeights = {
  points: 1000,
  boardMight: 10,
  xp: 2,
  handSize: 3,
  battlefieldControl: 15,
};

function boardMightFor(G: GameState, playerId: PlayerId): number {
  let total = 0;
  for (const instance of Object.values(G.instances)) {
    if (instance.controller !== playerId) continue;
    const card = getCard(instance.cardId);
    if (card.type !== "unit" && card.type !== "champion") continue;
    total += Math.max(0, computeMight(G, getCard, instance, "none") - instance.damage);
  }
  return total;
}

function battlefieldsControlledBy(G: GameState, playerId: PlayerId): number {
  return G.battlefields.filter((b) => b.controller === playerId).length;
}

/**
 * Hidden-information-blind heuristic score of `G` from `playerId`'s perspective — higher is
 * better for `playerId`. This is the shared scoring function for the Medium/Hard bot tiers (see
 * ai/bots.ts): reads ONLY public information — both sides' board state (instances, their
 * Might/damage/keyword bonuses via the same computeMight the real combat engine itself uses),
 * points, XP, hand SIZE (a public count — the opponent's card backs are visible, just not their
 * faces), and Battlefield control. Never reads `mainDeck`/`hiddenZone` contents or the opponent's
 * `hand` contents — see ai/enumerate.ts's file doc comment for the same design constraint applied
 * to move generation.
 */
export function evaluate(G: GameState, playerId: PlayerId, weights: EvalWeights = DEFAULT_WEIGHTS): number {
  const opponentId: PlayerId = playerId === "0" ? "1" : "0";
  if (G.winner === playerId) return Number.POSITIVE_INFINITY;
  if (G.winner === opponentId) return Number.NEGATIVE_INFINITY;

  const me = G.players[playerId];
  const opp = G.players[opponentId];

  let score = 0;
  score += weights.points * (me.points - opp.points);
  score += weights.boardMight * (boardMightFor(G, playerId) - boardMightFor(G, opponentId));
  score += weights.xp * (me.xp - opp.xp);
  score += weights.handSize * (me.hand.length - opp.hand.length);
  score += weights.battlefieldControl * (battlefieldsControlledBy(G, playerId) - battlefieldsControlledBy(G, opponentId));
  return score;
}
