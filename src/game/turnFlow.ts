import { getCard } from "../cards/db";
import { resolveHoldTriggers } from "./combat";
import { SpecialCaseEngine } from "../cards/special-cases/registry";
import type { CardInstance, GameState, PlayerId } from "./state";

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

/** A Battlefield card has no CardInstance of its own; this fabricates a throwaway one so `onBeginningWhileHeld` can reuse the standard SpecialCaseContext shape. It is never stored in `game.instances`. */
function battlefieldPseudoInstance(cardId: string, controller: PlayerId): CardInstance {
  return {
    instanceId: `battlefield-pseudo-${cardId}`,
    cardId,
    controller,
    zone: "battlefield",
    battlefieldIndex: null,
    damage: 0,
    exhausted: false,
    statuses: {},
    xp: 0,
    tempMightBonus: 0,
    grantedThisTurn: [],
  };
}

/** Beginning: score 1 point per Battlefield controlled, then fire Hold triggers (Hunt + Battlefield hold effects). */
export function runBeginning(game: GameState, player: PlayerId): void {
  const controlledCount = game.battlefields.filter((b) => b.controller === player).length;
  game.players[player].points += controlledCount;
  resolveHoldTriggers(game, getCard, player);

  for (const slot of game.battlefields) {
    if (slot.controller !== player) continue;
    const card = getCard(slot.cardId);
    if (!card.specialCaseId) continue;
    SpecialCaseEngine.onBeginningWhileHeld(game, card, battlefieldPseudoInstance(slot.cardId, player));
  }

  if (game.players[player].points >= WIN_SCORE) game.winner = player;
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
  for (const instance of Object.values(game.instances)) {
    if (instance.controller === player) {
      instance.tempMightBonus = 0;
      instance.grantedThisTurn = [];
    }
  }
  game.activePlayer = player;
}

export function markFirstTurnTaken(game: GameState, player: PlayerId): void {
  game.players[player].hasTakenFirstTurn = true;
}
