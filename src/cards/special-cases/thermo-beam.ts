import type { SpecialCaseHandler } from "./types";
import { getCard } from "../db";
import { destroyInstance } from "../../game/combat";

/** Kill all gear. */
export const thermoBeam: SpecialCaseHandler = {
  cardId: "thermo-beam",
  onPlay: (ctx) => {
    const gearIds = Object.values(ctx.game.instances)
      .filter((i) => getCard(i.cardId).type === "gear")
      .map((i) => i.instanceId);
    for (const id of gearIds) destroyInstance(ctx.game, getCard, id);
  },
};
