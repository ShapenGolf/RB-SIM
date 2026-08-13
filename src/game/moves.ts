import { INVALID_MOVE } from "boardgame.io/core";
import type { Move } from "boardgame.io";
import { getCard } from "../cards/db";
import { KeywordEngine } from "../keywords/registry";
import { SpecialCaseEngine } from "../cards/special-cases/registry";
import { resolveCombat } from "./combat";
import { createInstance } from "./setup";
import type { GameState } from "./state";

export interface PlayCardArgs {
  handIndex: number;
  energyRuneIds: string[];
  powerRuneIds: string[];
  payAdditionalCost?: boolean;
  targetInstanceId?: string;
}

export const playCard: Move<GameState> = ({ G, playerID }, args: PlayCardArgs) => {
  const player = G.players[playerID as "0" | "1"];
  const cardId = player.hand[args.handIndex];
  if (!cardId) return INVALID_MOVE;

  const card = getCard(cardId);
  if (card.type === "rune" || card.type === "legend" || card.type === "battlefield") return INVALID_MOVE;

  const instance = createInstance(G, cardId, player.id);

  const additionalEnergy = args.payAdditionalCost
    ? KeywordEngine.additionalPlayCostEnergy(G, card, instance)
    : 0;
  const energyNeeded = (card.energyCost ?? 0) + additionalEnergy;
  if (args.energyRuneIds.length !== energyNeeded) return INVALID_MOVE;

  const usedRuneIds = new Set<string>();
  for (const runeId of args.energyRuneIds) {
    const rune = player.runePool.find((r) => r.instanceId === runeId);
    if (!rune || rune.exhausted || usedRuneIds.has(runeId)) return INVALID_MOVE;
    usedRuneIds.add(runeId);
  }
  for (const runeId of args.powerRuneIds) {
    if (usedRuneIds.has(runeId)) return INVALID_MOVE;
    const rune = player.runePool.find((r) => r.instanceId === runeId);
    if (!rune) return INVALID_MOVE;
    usedRuneIds.add(runeId);
  }

  const requiredByDomain = new Map<string, number>();
  for (const cost of card.powerCost) {
    requiredByDomain.set(cost.domain, (requiredByDomain.get(cost.domain) ?? 0) + cost.amount);
  }
  const suppliedByDomain = new Map<string, number>();
  for (const runeId of args.powerRuneIds) {
    const rune = player.runePool.find((r) => r.instanceId === runeId)!;
    suppliedByDomain.set(rune.domain, (suppliedByDomain.get(rune.domain) ?? 0) + 1);
  }
  for (const [domain, amount] of requiredByDomain) {
    if ((suppliedByDomain.get(domain) ?? 0) < amount) return INVALID_MOVE;
  }

  for (const runeId of args.energyRuneIds) {
    player.runePool.find((r) => r.instanceId === runeId)!.exhausted = true;
  }
  for (const runeId of args.powerRuneIds) {
    const idx = player.runePool.findIndex((r) => r.instanceId === runeId);
    const [rune] = player.runePool.splice(idx, 1);
    player.runeDeck.push(rune);
  }

  player.hand.splice(args.handIndex, 1);

  if (card.type === "spell") {
    KeywordEngine.fireOnPlay(G, card, instance);
    SpecialCaseEngine.onPlay(G, card, instance, args.targetInstanceId);
    delete G.instances[instance.instanceId];
    player.trash.push(cardId);
  } else {
    instance.exhausted = !(args.payAdditionalCost && KeywordEngine.entersReadyIfCostPaid(G, card, instance));
    player.base.push(instance.instanceId);
    KeywordEngine.fireOnPlay(G, card, instance);
    SpecialCaseEngine.onPlay(G, card, instance, args.targetInstanceId);
  }

  player.playedMainDeckCardThisTurn = true;
  return undefined;
};

export interface AttackBattlefieldArgs {
  battlefieldIndex: number;
  unitInstanceIds: string[];
}

export const attackBattlefield: Move<GameState> = (
  { G, playerID },
  args: AttackBattlefieldArgs,
) => {
  const player = G.players[playerID as "0" | "1"];
  const slot = G.battlefields[args.battlefieldIndex];
  if (!slot || args.unitInstanceIds.length === 0) return INVALID_MOVE;

  for (const instanceId of args.unitInstanceIds) {
    const instance = G.instances[instanceId];
    if (!instance || instance.controller !== player.id) return INVALID_MOVE;
    if (instance.zone !== "base" || instance.exhausted) return INVALID_MOVE;
    const card = getCard(instance.cardId);
    if (card.type !== "unit" && card.type !== "champion") return INVALID_MOVE;
  }

  for (const instanceId of args.unitInstanceIds) {
    const instance = G.instances[instanceId];
    instance.exhausted = true;
    instance.zone = "battlefield";
    instance.battlefieldIndex = args.battlefieldIndex;
    player.base = player.base.filter((id) => id !== instanceId);
    slot.units[player.id].push(instanceId);
  }

  resolveCombat(G, getCard, args.battlefieldIndex, player.id);
  return undefined;
};

export interface ResolvePredictArgs {
  keepOnTop: boolean;
}

export const resolvePredict: Move<GameState> = ({ G, playerID }, args: ResolvePredictArgs) => {
  const player = G.players[playerID as "0" | "1"];
  if (!player.pendingPredict) return INVALID_MOVE;
  if (!args.keepOnTop) {
    const top = player.mainDeck.shift();
    if (top) player.mainDeck.push(top);
  }
  player.pendingPredict = false;
  return undefined;
};

export const endTurn: Move<GameState> = ({ events }) => {
  events.endTurn();
};
