import type { SpecialCaseHandler } from "./types";

/** I can't move to base. */
export const determinedSentry: SpecialCaseHandler = {
  cardId: "determined-sentry",
  preventsMoveToBase: (ctx, targetInstance) => targetInstance.instanceId === ctx.instance.instanceId,
};
