import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";

/** I enter ready if you control another Dragon. */
export const direwing: SpecialCaseHandler = {
  cardId: "direwing",
  selfEntersReady: (ctx) =>
    Object.values(ctx.game.instances).some(
      (i) =>
        i.instanceId !== ctx.instance.instanceId &&
        i.controller === ctx.instance.controller &&
        (getCard(i.cardId).tags?.includes("Dragon") ?? false),
    ),
};
