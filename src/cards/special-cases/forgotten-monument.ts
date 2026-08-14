import type { SpecialCaseHandler } from "./types";

const REQUIRED_TURN = 3;

/** Players can't score here until their third turn. */
export const forgottenMonument: SpecialCaseHandler = {
  cardId: "forgotten-monument",
  blocksScoringHere: (ctx) => ctx.game.players[ctx.instance.controller].turnsTaken < REQUIRED_TURN,
};
