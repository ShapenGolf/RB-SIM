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
    damagePreventionPool: 0,
  };
}

/**
 * A Legend has no Might/damage/combat participation and isn't stored in `game.instances` — this
 * fabricates a throwaway CardInstance so its ability (activatedAbilityCost/onActivate) and any
 * static-aura hooks can reuse the standard SpecialCaseContext shape. `exhausted` mirrors the
 * real PlayerState.legend.exhausted (the only mutable field that actually matters for a Legend)
 * so activateLegendAbility's generic cost-paying code can read/write it normally.
 */
export function legendPseudoInstance(cardId: string, controller: PlayerId, exhausted: boolean): CardInstance {
  return {
    instanceId: `legend-pseudo-${cardId}`,
    cardId,
    controller,
    zone: "championZone",
    battlefieldIndex: null,
    damage: 0,
    exhausted,
    statuses: {},
    xp: 0,
    tempMightBonus: 0,
    grantedThisTurn: [],
    equipment: [],
    attachedTo: null,
    pendingSurviveCombatXP: 0,
    damagePreventionPool: 0,
  };
}
