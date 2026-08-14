import { getCard } from "../cards/db";
import { resolveHoldTriggers, destroyInstance } from "./combat";
import { SpecialCaseEngine } from "../cards/special-cases/registry";
import { battlefieldPseudoInstance } from "./pseudoInstance";
import type { GameState, PlayerId } from "./state";

const CHANNEL_AMOUNT = 2;
const SECOND_PLAYER_FIRST_TURN_CHANNEL_AMOUNT = 3;
export const WIN_SCORE = 8;

/** Awaken: all exhausted instances/runes controlled by `player` become ready. */
export function runAwaken(game: GameState, player: PlayerId): void {
  for (const instance of Object.values(game.instances)) {
    if (instance.controller === player) instance.exhausted = false;
  }
  for (const rune of game.players[player].runePool) rune.exhausted = false;
}

/** Kills every instance `player` controls with the Temporary status, before scoring (see Last Stand, Fading Memories, and various Temporary tokens). */
function killTemporaryInstances(game: GameState, player: PlayerId): void {
  const toKill = Object.values(game.instances)
    .filter((i) => i.controller === player && i.statuses.temporary)
    .map((i) => i.instanceId);
  for (const instanceId of toKill) destroyInstance(game, getCard, instanceId);
}

/** Beginning: kill Temporary units, score 1 point per Battlefield controlled, then fire Hold triggers (Hunt + Battlefield hold effects). */
export function runBeginning(game: GameState, player: PlayerId): void {
  killTemporaryInstances(game, player);
  for (const instance of Object.values(game.instances)) {
    if (instance.controller !== player) continue;
    const card = getCard(instance.cardId);
    if (card.specialCaseId) SpecialCaseEngine.onBeginning(game, card, instance);
  }
  let scoredPoints = 0;
  game.battlefields.forEach((slot, index) => {
    if (slot.controller !== player) return;
    if (SpecialCaseEngine.blocksScoringFor(game, getCard, index, player)) return;
    scoredPoints += 1;
  });
  game.players[player].points += scoredPoints;
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
  const state = game.players[player];
  const amount =
    player === "1" && !state.hasTakenFirstTurn
      ? SECOND_PLAYER_FIRST_TURN_CHANNEL_AMOUNT
      : CHANNEL_AMOUNT;
  for (let i = 0; i < amount; i += 1) {
    const rune = state.runeDeck.shift();
    if (rune) state.runePool.push(rune);
  }
}

/** Draw: draw 1 card from the Main Deck. */
export function runDraw(game: GameState, player: PlayerId): void {
  const state = game.players[player];
  const card = state.mainDeck.shift();
  if (card) state.hand.push(card);
}

/** Runs the full Awaken -> Beginning -> Channel -> Draw sequence for the player whose turn is starting. */
export function runTurnStart(game: GameState, player: PlayerId): void {
  game.players[player].turnsTaken += 1;
  runAwaken(game, player);
  runBeginning(game, player);
  runChannel(game, player);
  runDraw(game, player);
  game.players[player].playedMainDeckCardThisTurn = false;
  game.players[player].discardedCardThisTurn = false;
  game.players[player].cardsPlayedThisTurn = 0;
  game.players[player].nextUnitEntersReady = false;
  game.players[player].nextSpellCostReduction = 0;
  game.players[player].nextSpellBonusDamage = 0;
  game.players[player].unitsEnterReadyThisTurn = false;
  game.players[player].enemyUnitDiedThisTurn = false;
  for (const instance of Object.values(game.instances)) {
    if (instance.controller === player) {
      instance.tempMightBonus = 0;
      instance.grantedThisTurn = [];
      for (const key of Object.keys(instance.statuses)) {
        if (key.endsWith("ThisTurn")) delete instance.statuses[key];
      }
    }
  }
  game.activePlayer = player;
}

export function markFirstTurnTaken(game: GameState, player: PlayerId): void {
  game.players[player].hasTakenFirstTurn = true;
}
