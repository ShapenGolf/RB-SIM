import { getCard } from "../cards/db";
import { resolveHoldTriggers, destroyInstance } from "./combat";
import { SpecialCaseEngine } from "../cards/special-cases/registry";
import { battlefieldPseudoInstance, legendPseudoInstance } from "./pseudoInstance";
import type { GameState, PlayerId } from "./state";

const CHANNEL_AMOUNT = 2;
const SECOND_PLAYER_FIRST_TURN_CHANNEL_AMOUNT = 3;
export const WIN_SCORE = 8;

/** Awaken: all exhausted instances/runes controlled by `player` become ready. */
export function runAwaken(game: GameState, player: PlayerId): void {
  game.turnPhase = "awaken";
  for (const instance of Object.values(game.instances)) {
    if (instance.controller !== player) continue;
    const card = getCard(instance.cardId);
    if (card.specialCaseId && SpecialCaseEngine.preventsSelfReady(game, card, instance)) continue;
    instance.exhausted = false;
  }
  for (const rune of game.players[player].runePool) rune.exhausted = false;
  const legend = game.players[player].legend;
  if (legend) legend.exhausted = false;
}

/** Kills every instance `player` controls with the Temporary status, before scoring (see Last Stand, Fading Memories, and various Temporary tokens). */
function killTemporaryInstances(game: GameState, player: PlayerId): void {
  const toKill = Object.values(game.instances)
    .filter(
      (i) =>
        i.controller === player &&
        i.statuses.temporary &&
        !SpecialCaseEngine.preventsTemporaryDeath(game, getCard, i),
    )
    .map((i) => i.instanceId);
  for (const instanceId of toKill) destroyInstance(game, getCard, instanceId);
}

/** Beginning: kill Temporary units, score 1 point per Battlefield controlled, then fire Hold triggers (Hunt + Battlefield hold effects). */
export function runBeginning(game: GameState, player: PlayerId): void {
  game.turnPhase = "beginning";
  killTemporaryInstances(game, player);
  for (const instance of Object.values(game.instances)) {
    if (instance.controller !== player) continue;
    const card = getCard(instance.cardId);
    if (card.specialCaseId) SpecialCaseEngine.onBeginning(game, card, instance);
  }
  const legend = game.players[player].legend;
  if (legend) {
    const legendCard = getCard(legend.cardId);
    if (legendCard.specialCaseId) {
      SpecialCaseEngine.onBeginning(
        game,
        legendCard,
        legendPseudoInstance(legend.cardId, player, legend.exhausted),
      );
    }
  }
  let scoredPoints = 0;
  game.battlefields.forEach((slot, index) => {
    if (slot.controller !== player) return;
    if (SpecialCaseEngine.blocksScoringFor(game, getCard, index, player)) return;
    scoredPoints += 1;
  });
  if (scoredPoints > 0 && SpecialCaseEngine.scoringConvertedToDraw(game, getCard, player)) {
    for (let i = 0; i < scoredPoints; i += 1) {
      const drawn = game.players[player].mainDeck.shift();
      if (drawn) game.players[player].hand.push(drawn);
    }
  } else {
    game.players[player].points += scoredPoints;
    if (scoredPoints > 0) SpecialCaseEngine.onOpponentScored(game, getCard, player, scoredPoints);
  }
  resolveHoldTriggers(game, getCard, player);

  game.battlefields.forEach((slot, index) => {
    if (slot.controller !== player) return;
    const card = getCard(slot.cardId);
    if (!card.specialCaseId) return;
    SpecialCaseEngine.onBeginningWhileHeld(game, card, battlefieldPseudoInstance(slot.cardId, player, index));
  });

  if (!game.players[player].hasTakenFirstTurn) {
    game.battlefields.forEach((slot, index) => {
      const card = getCard(slot.cardId);
      if (!card.specialCaseId) return;
      SpecialCaseEngine.onFirstBeginningPhase(game, card, battlefieldPseudoInstance(slot.cardId, player, index));
    });
  }

  game.battlefields.forEach((slot, index) => {
    const card = getCard(slot.cardId);
    if (!card.specialCaseId) return;
    SpecialCaseEngine.onEveryBeginningPhase(game, card, battlefieldPseudoInstance(slot.cardId, player, index));
  });

  const winScore = WIN_SCORE + SpecialCaseEngine.winScoreBonus(game, getCard);
  if (game.players[player].points >= winScore) game.winner = player;
}

/** Channel: draw Runes from the Rune Deck into the Rune Pool (2, or 3 for player "1"'s very first turn). */
export function runChannel(game: GameState, player: PlayerId): void {
  game.turnPhase = "channel";
  const state = game.players[player];
  const baseAmount =
    player === "1" && !state.hasTakenFirstTurn
      ? SECOND_PLAYER_FIRST_TURN_CHANNEL_AMOUNT
      : CHANNEL_AMOUNT;
  const cap = SpecialCaseEngine.channelAmountCap(game, getCard);
  const amount = cap === undefined ? baseAmount : Math.min(baseAmount, cap);
  for (let i = 0; i < amount; i += 1) {
    const rune = state.runeDeck.shift();
    if (rune) state.runePool.push(rune);
  }
}

/** Draw: draw 1 card from the Main Deck. */
export function runDraw(game: GameState, player: PlayerId): void {
  game.turnPhase = "draw";
  if (SpecialCaseEngine.skipsOwnDrawPhase(game, getCard, player)) return;
  const state = game.players[player];
  const card = state.mainDeck.shift();
  if (card) state.hand.push(card);
}

/** Runs the full Awaken -> Beginning -> Channel -> Draw sequence for the player whose turn is starting. */
export function runTurnStart(game: GameState, player: PlayerId): void {
  game.players[player].turnsTaken += 1;
  game.players[player].friendlyUnitDiedDuringBeginningThisTurn = false;
  // Every other "ThisTurn" reset used to run AFTER Beginning/Channel/Draw below, which silently
  // wiped out anything one of THIS turn's own Beginning-phase hooks granted (e.g. Forsaken
  // Baccai/Oasis Raider: "at the start of your Beginning Phase, give me +Might this turn") the
  // instant it was set. Reset first, matching friendlyUnitDiedDuringBeginningThisTurn's existing
  // placement, so grants made during this turn's own Awaken/Beginning/Channel/Draw survive into
  // its Main Phase like every other "this turn" effect does.
  game.players[player].playedMainDeckCardThisTurn = false;
  game.players[player].discardedCardThisTurn = false;
  game.players[player].cardsPlayedThisTurn = 0;
  game.players[player].nextUnitEntersReady = false;
  game.players[player].nextUnitBuffed = false;
  game.players[player].nextSpellCostReduction = 0;
  game.players[player].nextCardCostReduction = 0;
  game.players[player].nextSpellBonusDamage = 0;
  game.players[player].unitsEnterReadyThisTurn = false;
  game.players[player].buffUnitsPlayedThisTurn = false;
  game.players[player].enemyUnitDiedThisTurn = false;
  game.players[player].playedSpellThisTurn = false;
  game.players[player].playedNonTokenUnitThisTurn = false;
  game.players[player].playedNonTokenGearThisTurn = false;
  game.players[player].maxEnergySpentOnSpellThisTurn = 0;
  game.anyUnitDiedThisTurn = false;
  game.preventAllSpellDamageThisTurn = false;
  for (const instance of Object.values(game.instances)) {
    if (instance.controller === player) {
      instance.tempMightBonus = 0;
      instance.pendingSurviveCombatXP = 0;
      instance.grantedThisTurn = [];
      for (const key of Object.keys(instance.statuses)) {
        if (key.endsWith("ThisTurn")) delete instance.statuses[key];
      }
    }
  }
  runAwaken(game, player);
  runBeginning(game, player);
  runChannel(game, player);
  runDraw(game, player);
  game.turnPhase = "main";
  game.activePlayer = player;
}

export function markFirstTurnTaken(game: GameState, player: PlayerId): void {
  game.players[player].hasTakenFirstTurn = true;
}
