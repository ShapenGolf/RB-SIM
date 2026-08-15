import { getCard } from "../db";
import { computeMight } from "../../game/might";
import { destroyInstance } from "../../game/combat";
import type { CardInstance, GameState } from "../../game/state";

/**
 * "They deal damage equal to their Mights to each other" — deals each instance's current Might
 * to the other as damage, then destroys either that's lethal. Shared by every "duel" effect
 * (Carnivorous Snapvine, Challenge, Gentlemen's Duel, Marching Orders, ...).
 */
export function dealMutualMightDamage(game: GameState, a: CardInstance, b: CardInstance): void {
  const aMight = computeMight(game, getCard, a, "none");
  const bMight = computeMight(game, getCard, b, "none");
  a.damage += bMight;
  b.damage += aMight;
  if (a.damage >= computeMight(game, getCard, a, "none")) destroyInstance(game, getCard, a.instanceId);
  if (b.damage >= computeMight(game, getCard, b, "none")) destroyInstance(game, getCard, b.instanceId);
}
