import { describe, it, expect } from "vitest";
import { getCard } from "../src/cards/db";
import { SpecialCaseEngine } from "../src/cards/special-cases/registry";
import { makeGame, putOnBase } from "./helpers";

describe("Moot no-op registrations (batch 92)", () => {
  const cases: [string, string][] = [
    ["sfd-180", "fiora-worthy"],
    ["sfd-205", "grand-duelist"],
    ["sfd-251", "grand-duelist"],
    ["ogn-281", "hallowed-tomb"],
    ["sfd-142", "jae-medarda"],
    ["unl-138", "the-list"],
    ["unl-163", "mageseeker-investigator"],
  ];

  for (const [cardId, specialCaseId] of cases) {
    it(`${cardId} resolves to the ${specialCaseId} handler`, () => {
      expect(getCard(cardId).specialCaseId).toBe(specialCaseId);
    });
  }
});

describe("Ivern, Friend to All (unl-177)", () => {
  it("grants itself the tribal tag it has fewest of, then scores on conquer once all 4 are present", () => {
    const game = makeGame();
    const ivern = putOnBase(game, "unl-177", "0");
    const card = getCard(ivern.cardId);

    // No tribal-tagged units yet — should pick Bird (first in the fixed order).
    SpecialCaseEngine.onPlay(game, card, ivern);
    expect(ivern.statuses.grantedTagBird).toBe(true);

    // Not all 4 tags present yet — conquering shouldn't score.
    SpecialCaseEngine.onConquer(game, card, ivern, 0);
    expect(game.players["0"].points).toBe(0);

    // Add the other 3 tags via other units.
    const cat = putOnBase(game, "unit-doomed-recruit", "0");
    cat.statuses.grantedTagCat = true;
    const dog = putOnBase(game, "unit-doomed-recruit", "0");
    dog.statuses.grantedTagDog = true;
    const poro = putOnBase(game, "unit-doomed-recruit", "0");
    poro.statuses.grantedTagPoro = true;

    SpecialCaseEngine.onConquer(game, card, ivern, 0);
    expect(game.players["0"].points).toBe(1);
  });

  it("scores on hold too, once all 4 tags are present", () => {
    const game = makeGame();
    const ivern = putOnBase(game, "unl-177", "0");
    const card = getCard(ivern.cardId);
    ivern.statuses.grantedTagBird = true;
    ivern.statuses.grantedTagCat = true;
    ivern.statuses.grantedTagDog = true;
    ivern.statuses.grantedTagPoro = true;

    SpecialCaseEngine.onHold(game, card, ivern);

    expect(game.players["0"].points).toBe(1);
  });

  it("picks a different tag than one already covered by another unit", () => {
    const game = makeGame();
    const other = putOnBase(game, "unit-doomed-recruit", "0");
    other.statuses.grantedTagBird = true;
    const ivern = putOnBase(game, "unl-177", "0");
    const card = getCard(ivern.cardId);

    SpecialCaseEngine.onPlay(game, card, ivern);

    expect(ivern.statuses.grantedTagBird).toBeUndefined();
    expect(ivern.statuses.grantedTagCat).toBe(true);
  });
});
