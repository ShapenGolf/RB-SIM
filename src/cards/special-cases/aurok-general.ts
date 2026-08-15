import type { SpecialCaseHandler } from "./types";

/**
 * [Empower] 3 Energy+Order Rune (3 Energy+Order Rune: Empower me. Use only if not Empowered.)
 * [Empowered] Your units that are [Empowered] have +2 Might (including me).
 * The ability is only active while Aurok General itself is Empowered — being Empowered is also
 * exactly the condition that qualifies it for its own "+2 Might (including me)", so the self
 * bonus collapses to the same single check.
 */
export const aurokGeneral: SpecialCaseHandler = {
  cardId: "aurok-general",
  empowerCost: { energy: 3, runeDomain: "Order" },
  staticMightModifier: (ctx) => (ctx.instance.statuses.empowered ? 2 : 0),
  staticMightModifierForAlly: (ctx, allyInstance) => {
    if (!ctx.instance.statuses.empowered) return 0;
    return allyInstance.statuses.empowered ? 2 : 0;
  },
};
