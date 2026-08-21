import type { Ctx } from "boardgame.io";
import type { Card } from "../cards/types";
import type { TemplatedAction } from "../cards/templatedEffects";
import type { CardInstance, GameState, PlayerId, RuneInstance } from "../game/state";
import { getCard } from "../cards/db";
import { KeywordEngine } from "../keywords/registry";
import { computeAutoPayment } from "../game/autoPay";
import { SpecialCaseEngine, specialCaseNeedsPlayTarget } from "../cards/special-cases/registry";
import { templatedEffectNeedsPlayTarget, activatedAbilityNeedsTarget, firstChooseTargetSpec } from "../cards/templatedEffects";
import { candidatesForTarget } from "../game/templatedEffectEngine";
import { eligibleAmbushBattlefields } from "../game/moves";
import { previewInstance, legendPseudoInstance } from "../game/pseudoInstance";
import { orderForDamageAssignment } from "../game/combat";

/**
 * One legal-ish candidate move for a bot to dispatch — `move` is a key of game/game.ts's `moves`
 * registry, `args` its move arguments. "Legal-ish" because this module deliberately does NOT
 * re-derive every validation rule moves.ts already enforces (see file doc comment below): a bad
 * candidate simply comes back INVALID_MOVE from the real move and the bot driver discards it,
 * exactly like a human player's misclick would.
 */
export interface BotAction {
  move: string;
  args: Record<string, unknown>;
  /** Human-readable, for logging/tests — never parsed. */
  label: string;
}

/**
 * Candidate-move enumeration for the bot-opponent feature (see docs/data-sourcing.md's bot
 * design note): given the CURRENT, real GameState, list plausible moves a player in `playerID`'s
 * seat could make right now.
 *
 * Hidden-information-blind by construction: every helper here only ever reads `G.instances`
 * (public — both players' units/gear/champions in play), `G.players[playerID].hand`/`legend`/
 * `runePool` (this bot's OWN visible cards), and public counts. It never reads
 * `G.players[opponentId].hand`, either player's `mainDeck` CONTENTS (only `.length`, and even that
 * isn't used here), or `hiddenZone` contents belonging to the opponent — nothing here "peeks" at
 * information a real player wouldn't have. `resolvePredict` is the one apparent exception: Predict
 * (rule 436) genuinely REVEALS the top N cards of this player's own deck as part of resolving it —
 * reading them is what the rule text says happens, not a hidden-information violation — but this
 * module still doesn't act on their identities (see below), reserving that for a later, explicitly
 * considered refinement.
 *
 * Deliberately NOT covered yet (a real, in-hand action becomes a no-op "do nothing else" until a
 * later increment adds it): hideCard, playFromHidden, playFromTrash, submitDeck (irrelevant for a
 * local vs-Bot match — see game/game.ts's deckSelect phase doc comment), and paying a card's
 * additional cost (`payAdditionalCost`/[Repeat]). None of these make the bot ILLEGAL to play
 * against, just less resourceful than a human until they're added.
 */
export function enumerateBotActions(G: GameState, ctx: Ctx, playerID: PlayerId): BotAction[] {
  if (!isBotTurn(G, ctx, playerID)) return [];
  const player = G.players[playerID];

  if (ctx.phase === "battlefieldSelect") {
    return player.battlefieldPool.map((cardId) => ({
      move: "chooseBattlefield",
      args: { cardId },
      label: `chooseBattlefield(${cardId})`,
    }));
  }

  if (ctx.phase === "mulligan") {
    // Simplest legal resolution: keep the opening hand as dealt. A content-aware mulligan
    // heuristic is a later refinement (same tier as Predict below), not needed for a first
    // playable bot — see the file doc comment.
    return [{ move: "mulligan", args: { handIndices: [] }, label: "mulligan(keep hand)" }];
  }

  if (player.pendingPredict > 0) {
    const n = Math.min(player.pendingPredict, player.mainDeck.length);
    return [
      {
        move: "resolvePredict",
        args: { recyclePositions: [], keepOrder: Array.from({ length: n }, (_, i) => i) },
        label: "resolvePredict(keep order)",
      },
    ];
  }

  if (G.pendingDamageAssignment) {
    const pending = G.pendingDamageAssignment;
    const isAttacker = playerID === pending.attacker;
    const targets = G.battlefields[pending.battlefieldIndex].units[isAttacker ? pending.defender : pending.attacker];
    // orderForDamageAssignment's rank-sorted order is ALWAYS a valid submission (isValidDamageOrder
    // only requires rank-monotonicity, never a specific order within a rank) — no need to search.
    const order = orderForDamageAssignment(G, getCard, targets, pending.battlefieldIndex, playerID);
    return [{ move: "submitDamageAssignment", args: { order }, label: "submitDamageAssignment(rank order)" }];
  }

  if (G.pendingOptionalCost) {
    const out: BotAction[] = [{ move: "resolveOptionalCost", args: { pay: false, energyRuneIds: [] }, label: "resolveOptionalCost(decline)" }];
    const payment = computeAbilityPayment(G.pendingOptionalCost.cost, player.runePool);
    if (payment) {
      out.push({
        move: "resolveOptionalCost",
        args: { pay: true, energyRuneIds: payment.energyRuneIds, powerRuneId: payment.powerRuneId },
        label: "resolveOptionalCost(pay)",
      });
    }
    return out;
  }

  if (G.pendingSpellReaction) {
    const out: BotAction[] = [{ move: "passReaction", args: {}, label: "passReaction" }];
    player.hand.forEach((cardId, handIndex) => {
      const card = getCard(cardId);
      if (card.type !== "spell" || !KeywordEngine.hasKeyword(card, "reaction")) return;
      out.push(...playCardCandidates(G, playerID, { handIndex }));
    });
    return out;
  }

  if (G.pendingCombatReaction) {
    const out: BotAction[] = [{ move: "passCombatReaction", args: {}, label: "passCombatReaction" }];
    player.hand.forEach((cardId, handIndex) => {
      const card = getCard(cardId);
      if (card.type !== "spell") return;
      const eligible = KeywordEngine.hasKeyword(card, "reaction") || KeywordEngine.hasKeyword(card, "action");
      if (!eligible || SpecialCaseEngine.hasCounterIntent(card)) return;
      out.push(...playCardCandidates(G, playerID, { handIndex }));
    });
    return out;
  }

  // Normal main-phase turn: always able to pass (endTurn), plus whatever's actually playable.
  const out: BotAction[] = [{ move: "endTurn", args: {}, label: "endTurn" }];
  player.hand.forEach((_cardId, handIndex) => out.push(...playCardCandidates(G, playerID, { handIndex })));
  if (player.championZone) out.push(...playCardCandidates(G, playerID, { fromChampionZone: true }));
  out.push(...attackCandidates(G, playerID));
  out.push(...activateAbilityCandidates(G, playerID));
  out.push(...activateLegendAbilityCandidates(G, playerID));
  out.push(...equipCandidates(G, playerID));
  out.push(...empowerCandidates(G, playerID));
  return out;
}

/** True while `playerID` has any legal action to take right now — a normal turn, or any open reactive window addressed to them. */
export function isBotTurn(G: GameState, ctx: Ctx, playerID: PlayerId): boolean {
  if (ctx.gameover) return false;
  if (G.pendingDamageAssignment) {
    const pending = G.pendingDamageAssignment;
    if (playerID === pending.attacker) return pending.attackerOrder === null;
    if (playerID === pending.defender) return pending.defenderOrder === null;
    return false;
  }
  if (G.pendingSpellReaction) return G.pendingSpellReaction.casterId !== playerID;
  if (G.pendingCombatReaction) return G.pendingCombatReaction.attacker !== playerID;
  if (G.pendingOptionalCost) return G.pendingOptionalCost.playerId === playerID;
  const player = G.players[playerID];
  if (player.pendingPredict > 0) return true;
  if (ctx.phase === "battlefieldSelect") return !player.chosenBattlefieldId;
  if (ctx.phase === "mulligan") return !player.mulliganDone;
  if (ctx.phase === "play") return ctx.currentPlayer === playerID;
  return false;
}

/**
 * Same as enumerateBotActions, but NEVER empty — falls back to a harmless endTurn attempt when
 * there's genuinely nothing to do. Needed specifically at boardgame.io's own bot-integration
 * boundary (see game/game.ts's `ai.enumerate`, ai/boardgameBot.ts): the FRAMEWORK's own "is it this
 * bot's turn" check (`Local()`'s internal `GetBotPlayer`, based on `ctx.activePlayers`/
 * `ctx.currentPlayer`) can occasionally decide to ask a bot to move in a moment `isBotTurn` above
 * already considers settled — most commonly a PendingDamageAssignment window where THIS side
 * already submitted its order but the OTHER side hasn't yet, so `ctx.activePlayers` (opened via
 * `{all: Stage.NULL}`, see combat.ts) still lists both sides until BOTH submit. A boardgame.io
 * `Bot.play()` MUST return SOME action; an endTurn attempt is always safe here even when it isn't
 * really legal, since boardgame.io's own Master.onUpdate rejects an out-of-turn move via
 * `isPlayerActive`/`getMove` before it ever reaches moves.ts — worst case, one wasted, silently
 * ignored dispatch, never a crash (see ai/boardgameBot.ts's Bot.play doc comment, which is what
 * this was written to fix: an earlier version could return `{action: undefined}` here and crash
 * boardgame.io's own LocalMaster).
 */
export function enumerateBotActionsOrFallback(G: GameState, ctx: Ctx, playerID: PlayerId): BotAction[] {
  const actions = enumerateBotActions(G, ctx, playerID);
  return actions.length > 0 ? actions : [{ move: "endTurn", args: {}, label: "endTurn(fallback — nothing else to do)" }];
}

const MAX_TARGET_CANDIDATES = 10;

interface AbilityCost {
  energy: number;
  runeDomain?: Card["domains"][number];
}

/**
 * Pure re-derivation of ui/Board.tsx's computeAbilityPayment/computeEquipPayment (activated
 * abilities, Legend abilities, Empower, Equip, and PendingOptionalCost all share this
 * energy+optional-single-domain-rune cost shape) — kept independent of the React component so it
 * can run headlessly from the bot driver. Ignores any cost sub-fields beyond energy/runeDomain
 * (e.g. discardCount, exhaustSourceInstanceId) exactly like the UI helpers it mirrors do; an
 * unaffordable-on-those-grounds candidate simply comes back INVALID_MOVE (see file doc comment).
 */
function computeAbilityPayment(
  cost: AbilityCost,
  runePool: RuneInstance[],
): { energyRuneIds: string[]; powerRuneId?: string } | null {
  const powerRune = cost.runeDomain ? runePool.find((r) => r.domain === cost.runeDomain) : undefined;
  if (cost.runeDomain && !powerRune) return null;
  const readyRunes = runePool.filter((r) => !r.exhausted && r.instanceId !== powerRune?.instanceId);
  if (readyRunes.length < cost.energy) return null;
  return {
    energyRuneIds: readyRunes.slice(0, cost.energy).map((r) => r.instanceId),
    powerRuneId: powerRune?.instanceId,
  };
}

/** Real eligible candidates for a DATA-DRIVEN (auto-matched TemplatedAction) target — mirrors ui/Board.tsx's templatedTargetInfo/moves.ts's rejectsInvalidTemplatedTarget. */
function templatedTargetCandidates(
  G: GameState,
  actions: TemplatedAction[] | undefined,
  source: CardInstance,
  restrictToBattlefieldIndex?: number,
): { optional: boolean; ids: string[] } | null {
  const spec = actions ? firstChooseTargetSpec(actions) : undefined;
  if (!spec) return null;
  let candidates = candidatesForTarget(G, getCard, source, spec);
  if (restrictToBattlefieldIndex !== undefined) {
    candidates = candidates.filter((c) => c.battlefieldIndex === restrictToBattlefieldIndex);
  }
  return { optional: Boolean(spec.optional), ids: candidates.slice(0, MAX_TARGET_CANDIDATES).map((c) => c.instanceId) };
}

/** Every base/battlefield instance, for a BESPOKE (special-case) target need with no eligibility spec exposed — same fallback ui/Board.tsx's targetPicker uses without `eligibleIds`. */
function bespokeTargetCandidates(G: GameState): string[] {
  return Object.values(G.instances)
    .filter((i) => i.zone === "base" || i.zone === "battlefield")
    .slice(0, MAX_TARGET_CANDIDATES)
    .map((i) => i.instanceId);
}

/**
 * `playCard` candidates for one hand card (or the Champion Zone card) — shared by the normal
 * main-phase turn and both reactive windows (a [Reaction]/[Action] spell is played via this same
 * move, see moves.ts's playCard `reactingTo` branch). Only ever pays the BASE cost (no
 * `payAdditionalCost`, no [Repeat]) — see file doc comment.
 */
function playCardCandidates(
  G: GameState,
  playerID: PlayerId,
  source: { handIndex?: number; fromChampionZone?: boolean },
): BotAction[] {
  const player = G.players[playerID];
  const cardId = source.fromChampionZone ? player.championZone : player.hand[source.handIndex ?? -1];
  if (!cardId) return [];
  const card = getCard(cardId);
  if (card.type === "rune" || card.type === "legend" || card.type === "battlefield") return [];
  if (card.type === "spell" && player.cantPlaySpellsThisTurn) return [];

  const dummy = previewInstance(cardId, playerID);
  const payment = computeAutoPayment(G, card, dummy, player.runePool, false);
  if (!payment) return [];

  const ambushIndices = card.type === "unit" || card.type === "champion" ? eligibleAmbushBattlefields(G, card, dummy) : [];
  const destinations: (number | undefined)[] = [undefined, ...ambushIndices];
  const needsTarget = specialCaseNeedsPlayTarget(card) || templatedEffectNeedsPlayTarget(card.templatedEffect);

  function action(targetInstanceId: string | undefined, ambushBattlefieldIndex: number | undefined): BotAction {
    return {
      move: "playCard",
      args: {
        ...(source.fromChampionZone ? { fromChampionZone: true } : { handIndex: source.handIndex }),
        energyRuneIds: payment!.energyRuneIds,
        powerRuneIds: payment!.powerRuneIds,
        payAdditionalCost: false,
        targetInstanceId,
        ambushBattlefieldIndex,
      },
      label: `playCard(${card.name}${targetInstanceId ? " -> " + targetInstanceId : ""}${ambushBattlefieldIndex !== undefined ? ` ambush@${ambushBattlefieldIndex}` : ""})`,
    };
  }

  if (!needsTarget) return destinations.map((dest) => action(undefined, dest));

  const templated = card.templatedEffect?.trigger === "onPlay" ? templatedTargetCandidates(G, card.templatedEffect.actions, dummy) : null;
  if (templated) {
    if (templated.ids.length === 0) {
      // Mandatory spell target with zero legal candidates can't be cast at all (matches moves.ts's
      // rejectsInvalidTemplatedTarget); a unit/champion/gear still deploys even if its onPlay bonus
      // fizzles, and an `optional` target can always be skipped.
      if (!templated.optional && card.type === "spell") return [];
      return destinations.map((dest) => action(undefined, dest));
    }
    const out: BotAction[] = [];
    for (const dest of destinations) {
      if (templated.optional) out.push(action(undefined, dest));
      for (const id of templated.ids) out.push(action(id, dest));
    }
    return out;
  }

  // Bespoke special-case target — no eligibility spec exposed; offer every board instance, same as
  // ui/Board.tsx's fallback picker. The handler itself no-ops harmlessly on an illegal pick.
  const out: BotAction[] = [];
  for (const dest of destinations) {
    for (const id of bespokeTargetCandidates(G)) out.push(action(id, dest));
  }
  return out;
}

/** `attackBattlefield` candidates: every ready-in-base unit/champion, sent either all together or individually, to every Battlefield. Ganking-based moves FROM a battlefield aren't enumerated yet (later refinement — see file doc comment). */
function attackCandidates(G: GameState, playerID: PlayerId): BotAction[] {
  const eligibleUnits = Object.values(G.instances).filter((i) => {
    if (i.controller !== playerID || i.zone !== "base" || i.exhausted || i.statuses.cantMoveThisTurn) return false;
    const t = getCard(i.cardId).type;
    return t === "unit" || t === "champion";
  });
  if (eligibleUnits.length === 0) return [];
  const out: BotAction[] = [];
  G.battlefields.forEach((_slot, battlefieldIndex) => {
    out.push({
      move: "attackBattlefield",
      args: { battlefieldIndex, unitInstanceIds: eligibleUnits.map((u) => u.instanceId) },
      label: `attackBattlefield(all -> ${battlefieldIndex})`,
    });
    for (const unit of eligibleUnits) {
      out.push({
        move: "attackBattlefield",
        args: { battlefieldIndex, unitInstanceIds: [unit.instanceId] },
        label: `attackBattlefield(${unit.instanceId} -> ${battlefieldIndex})`,
      });
    }
  });
  return out;
}

function activateAbilityCandidates(G: GameState, playerID: PlayerId): BotAction[] {
  const out: BotAction[] = [];
  for (const instance of Object.values(G.instances)) {
    if (instance.controller !== playerID) continue;
    const card = getCard(instance.cardId);
    const cost = card.activatedAbility?.cost ?? SpecialCaseEngine.activatedAbilityCost(G, card, instance);
    if (!cost || (cost.exhaustSelf && instance.exhausted)) continue;
    const payment = computeAbilityPayment(cost, G.players[playerID].runePool);
    if (!payment) continue;
    const needsTarget = card.activatedAbility ? activatedAbilityNeedsTarget(card.activatedAbility) : SpecialCaseEngine.activateNeedsTarget(card);
    const argsBase = { instanceId: instance.instanceId, energyRuneIds: payment.energyRuneIds, powerRuneId: payment.powerRuneId };
    if (!needsTarget) {
      out.push({ move: "activateAbility", args: argsBase, label: `activateAbility(${card.name})` });
      continue;
    }
    const templated = card.activatedAbility ? templatedTargetCandidates(G, card.activatedAbility.actions, instance) : null;
    const ids = templated ? templated.ids : bespokeTargetCandidates(G);
    for (const id of ids) {
      out.push({ move: "activateAbility", args: { ...argsBase, targetInstanceId: id }, label: `activateAbility(${card.name} -> ${id})` });
    }
  }
  return out;
}

function activateLegendAbilityCandidates(G: GameState, playerID: PlayerId): BotAction[] {
  const player = G.players[playerID];
  const legend = player.legend;
  if (!legend) return [];
  const card = getCard(legend.cardId);
  const instance = legendPseudoInstance(legend.cardId, playerID, legend.exhausted);
  const cost = card.activatedAbility?.cost ?? SpecialCaseEngine.activatedAbilityCost(G, card, instance);
  // A Legend has no persistent xp/buffed/instance to spend or kill — moves.ts's activateLegendAbility
  // rejects a cost using any of these outright.
  if (!cost || cost.spendXP || cost.killSelf || cost.spendBuff || (cost.exhaustSelf && legend.exhausted)) return [];
  const payment = computeAbilityPayment(cost, player.runePool);
  if (!payment) return [];
  const needsTarget = card.activatedAbility ? activatedAbilityNeedsTarget(card.activatedAbility) : SpecialCaseEngine.activateNeedsTarget(card);
  const argsBase = { energyRuneIds: payment.energyRuneIds, powerRuneId: payment.powerRuneId };
  if (!needsTarget) return [{ move: "activateLegendAbility", args: argsBase, label: `activateLegendAbility(${card.name})` }];
  const templated = card.activatedAbility ? templatedTargetCandidates(G, card.activatedAbility.actions, instance) : null;
  const ids = templated ? templated.ids : bespokeTargetCandidates(G);
  return ids.map((id) => ({
    move: "activateLegendAbility",
    args: { ...argsBase, targetInstanceId: id },
    label: `activateLegendAbility(${card.name} -> ${id})`,
  }));
}

function equipCandidates(G: GameState, playerID: PlayerId): BotAction[] {
  const out: BotAction[] = [];
  const gears = Object.values(G.instances).filter((i) => i.controller === playerID && getCard(i.cardId).equipCost);
  const targets = Object.values(G.instances).filter((i) => {
    if (i.controller !== playerID) return false;
    const t = getCard(i.cardId).type;
    return t === "unit" || t === "champion";
  });
  for (const gear of gears) {
    const cost = getCard(gear.cardId).equipCost!;
    const payment = computeAbilityPayment(cost, G.players[playerID].runePool);
    if (!payment) continue;
    for (const target of targets) {
      out.push({
        move: "equipGear",
        args: {
          gearInstanceId: gear.instanceId,
          targetInstanceId: target.instanceId,
          energyRuneIds: payment.energyRuneIds,
          powerRuneId: payment.powerRuneId,
        },
        label: `equipGear(${getCard(gear.cardId).name} -> ${target.instanceId})`,
      });
    }
  }
  return out;
}

function empowerCandidates(G: GameState, playerID: PlayerId): BotAction[] {
  const out: BotAction[] = [];
  for (const instance of Object.values(G.instances)) {
    if (instance.controller !== playerID || instance.statuses.everEmpowered) continue;
    const card = getCard(instance.cardId);
    const cost = SpecialCaseEngine.empowerCost(G, card, instance);
    if (!cost || (cost.exhaustSelf && instance.exhausted)) continue;
    const payment = computeAbilityPayment(cost, G.players[playerID].runePool);
    if (!payment) continue;
    out.push({
      move: "empowerInstance",
      args: { instanceId: instance.instanceId, energyRuneIds: payment.energyRuneIds, powerRuneId: payment.powerRuneId },
      label: `empowerInstance(${card.name})`,
    });
  }
  return out;
}
