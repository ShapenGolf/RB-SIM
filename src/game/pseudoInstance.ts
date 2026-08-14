import type { CardInstance, PlayerId } from "./state";

/**
 * A Battlefield card has no CardInstance of its own; this fabricates a throwaway one so
 * location-wide special-case hooks (onBeginningWhileHeld, onConquerHere, static Might/keyword
 * grants "to units here") can reuse the standard SpecialCaseContext shape. Never stored in
 * `game.instances`. Shared by combat.ts, turnFlow.ts, and might.ts — kept dependency-free to
 * avoid import cycles between them.
 */
export function battlefieldPseudoInstance(
  cardId: string,
  controller: PlayerId,
  battlefieldIndex: number | null = null,
): CardInstance {
  return {
    instanceId: `battlefield-pseudo-${cardId}`,
    cardId,
    controller,
    zone: "battlefield",
    battlefieldIndex,
    damage: 0,
    exhausted: false,
    statuses: {},
    xp: 0,
    tempMightBonus: 0,
    grantedThisTurn: [],
    equipment: [],
    attachedTo: null,
    pendingSurviveCombatXP: 0,
  };
}
