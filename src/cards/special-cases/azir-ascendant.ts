import { moveInstanceToBase, moveInstanceToBattlefield } from "./move-helpers";
import { getCard } from "../db";
import type { SpecialCaseHandler } from "./types";

/**
 * Calm Rune: [Action] — Choose a unit you control. Move me to its location and it to my original
 * location. If it's equipped, you may attach one of its Equipment to me. Use only once per turn.
 *
 * A true two-way "swap" needs no dedicated helper: move-helpers.ts's moveInstanceToBase/
 * moveInstanceToBattlefield each independently relocate ONE instance from wherever it currently
 * is — capturing both units' ORIGINAL locations up front, then calling the single-unit movers
 * twice in sequence (target -> Azir's saved original spot, then Azir -> the target's saved
 * original spot) produces a correct swap, since Azir himself hasn't moved yet when the target's
 * move runs. [Action] timing isn't modeled (resolves instantly, same simplification as
 * bullet-time.ts). Simplification: the optional "attach one of its Equipment to me" sub-clause
 * isn't taken — no clear default among multiple Equipment (same precedent as veiled-temple.ts's
 * unresolved optional detach).
 */
export const azirAscendant: SpecialCaseHandler = {
  cardId: "azir-ascendant",
  activatedAbilityCost: (ctx) =>
    ctx.instance.statuses.azirAscendantUsedThisTurn ? undefined : { energy: 0, runeDomain: "Calm", exhaustSelf: false },
  activateNeedsTarget: true,
  onActivate: (ctx, targetInstanceId) => {
    if (!targetInstanceId) return;
    const target = ctx.game.instances[targetInstanceId];
    if (!target || target.controller !== ctx.instance.controller || target.instanceId === ctx.instance.instanceId) return;
    const t = getCard(target.cardId).type;
    if (t !== "unit" && t !== "champion") return;

    ctx.instance.statuses.azirAscendantUsedThisTurn = true;
    const azirOriginalBattlefield = ctx.instance.battlefieldIndex;
    const targetOriginalBattlefield = target.battlefieldIndex;

    if (azirOriginalBattlefield === null) {
      moveInstanceToBase(ctx.game, getCard, target.instanceId);
    } else {
      moveInstanceToBattlefield(ctx.game, target.instanceId, azirOriginalBattlefield);
    }
    if (targetOriginalBattlefield === null) {
      moveInstanceToBase(ctx.game, getCard, ctx.instance.instanceId);
    } else {
      moveInstanceToBattlefield(ctx.game, ctx.instance.instanceId, targetOriginalBattlefield);
    }
  },
};
