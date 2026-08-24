import { useEffect, useState } from "react";
import type { BoardProps } from "boardgame.io/react";
import type { GameState, PlayerId, CardInstance } from "../game/state";
import type { Card, Domain } from "../cards/types";
import { getCard, getRuneCardForDomain } from "../cards/db";
import { computeAutoPayment, computeRequiredCost } from "../game/autoPay";
import { KeywordEngine } from "../keywords/registry";
import { templatedEffectNeedsPlayTarget, activatedAbilityNeedsTarget, firstChooseTargetSpec } from "../cards/templatedEffects";
import { specialCaseNeedsPlayTarget, SpecialCaseEngine } from "../cards/special-cases/registry";
import { eligibleAmbushBattlefields } from "../game/moves";
import { candidatesForTarget } from "../game/templatedEffectEngine";
import { previewInstance as blankInstance } from "../game/pseudoInstance";
import { validateDeck } from "../cards/deckValidation";
import { listSavedDecks } from "../decks/store";
import { CardFace } from "./CardFace";
import "./cards.css";

/**
 * Per-card transform for the "fanned hand" look (see hoveredHandIndex above and .rb-hand-strip
 * in cards.css) — cards rotate outward from a center card like a hand of playing cards, and the
 * hovered one straightens, lifts clear, and scales up while its neighbors slide out of its way
 * (falling off with distance) so the overlap that makes the fan compact doesn't also hide it.
 */
function handFanStyle(idx: number, total: number, hoveredIndex: number | null): React.CSSProperties {
  const offset = idx - (total - 1) / 2;
  const isHovered = hoveredIndex === idx;
  const rotate = isHovered ? 0 : Math.max(-16, Math.min(16, offset * 5));
  const restY = Math.min(Math.abs(offset) * 3, 14);
  let shiftX = 0;
  if (hoveredIndex !== null && !isHovered) {
    const distance = idx - hoveredIndex;
    shiftX = Math.sign(distance) * Math.min(16, 26 / Math.abs(distance));
  }
  return {
    marginLeft: idx === 0 ? 0 : -34,
    transform: `translateX(${shiftX}px) translateY(${isHovered ? -22 : restY}px) rotate(${rotate}deg) scale(${isHovered ? 1.12 : 1})`,
    zIndex: isHovered ? 200 : idx + 1,
  };
}

export function Board({ G, ctx, moves, playerID, isActive }: BoardProps<GameState>) {
  const [mulliganSelected, setMulliganSelected] = useState<Set<number>>(new Set());
  const [attackMode, setAttackMode] = useState<{ selected: Set<string> } | null>(null);
  // "Einfacher Modus": green/red outline hints on cards (affordable? can still act?), see
  // CardFace's `frame` prop. "Standard" drops the hints — illegal actions are still blocked
  // either way (the alert()s in playCardAuto/activateAbilityAuto etc.), this is purely visual.
  const [simpleMode, setSimpleMode] = useState(true);
  const [pendingTarget, setPendingTarget] = useState<{
    handIndex?: number;
    fromChampionZone?: boolean;
    fromHiddenIndex?: number;
    payAdditionalCost: boolean;
    ambushBattlefieldIndex?: number;
    /** Set when the payment was chosen manually (see pendingManualPayment below) — confirmTarget uses these verbatim instead of calling computeAutoPayment. */
    manualEnergyRuneIds?: string[];
    manualPowerRuneIds?: string[];
    /** Set by playCardAutoWithRepeat when this spell's [Repeat] cost (rule 820) is also being paid — confirmTarget passes these through to moves.playCard verbatim. */
    payRepeatCost?: boolean;
    repeatEnergyRuneIds?: string[];
    repeatPowerRuneId?: string;
    /** Set by playFromTrashAuto for a [Flow]-cost spell needing a target — confirmTarget dispatches moves.playFromTrash instead of moves.playCard when this is set. */
    fromTrashIndex?: number;
    trashEnergyRuneIds?: string[];
    trashRuneDomainRuneIds?: string[];
    trashAnyDomainRuneIds?: string[];
  } | null>(null);
  const [pendingAbility, setPendingAbility] = useState<{ instanceId: string } | null>(null);
  const [pendingEquip, setPendingEquip] = useState<{ gearInstanceId: string } | null>(null);
  // Manual rune payment (see startManualPayment/toggleManualRune/confirmManualPayment below) —
  // an alternative to computeAutoPayment's silent auto-pick, so the player can deliberately
  // choose which physical runes to exhaust (Energy) vs recycle (Power, which actually removes
  // the rune from the pool for the rest of the turn, not just taps it — a real Nutzerfeedback
  // point: recycling is a bigger commitment than exhausting, worth choosing on purpose).
  const [pendingManualPayment, setPendingManualPayment] = useState<{
    handIndex: number;
    payAdditionalCost: boolean;
    ambushBattlefieldIndex?: number;
  } | null>(null);
  const [manualEnergyRuneIds, setManualEnergyRuneIds] = useState<string[]>([]);
  const [manualPowerRuneIds, setManualPowerRuneIds] = useState<string[]>([]);
  // Native HTML5 drag-and-drop (see cards.css .rb-draggable/.rb-drop-active): an additive
  // alternative to the click/button flows above, not a replacement — everything still works by
  // clicking. `dragPayload` is what's currently being dragged; `dropHoverId` is whichever drop
  // target (an instanceId, or the literal "base") is currently under the pointer, for the
  // dashed-outline hover hint. Actually committing a drop reuses the exact same move-building
  // logic as the equivalent button (computeEquipPayment, playCardAuto, moves.attackBattlefield).
  const [dragPayload, setDragPayload] = useState<
    { type: "gear"; gearInstanceId: string } | { type: "handCard"; handIndex: number } | { type: "unit"; instanceId: string } | null
  >(null);
  const [dropHoverId, setDropHoverId] = useState<string | null>(null);
  // Which own-hand card index the pointer is currently over — drives the "fanned hand" look
  // (see the Hand render below and .rb-hand-strip in cards.css): every card gets a slight
  // rotation/overlap like cards held in a hand, and the hovered one straightens up, lifts clear,
  // and pushes its neighbors aside so it's fully readable despite the overlap.
  const [hoveredHandIndex, setHoveredHandIndex] = useState<number | null>(null);
  // Tracks which G.lastCombatResult.seq the player has already closed, so the post-combat
  // summary panel (see below, rendered near the topbar) reappears for every NEW Showdown but
  // stays dismissed for the one currently on screen — comparing seq (not identity) means it
  // survives boardgame.io's state cloning between moves.
  const [dismissedCombatSeq, setDismissedCombatSeq] = useState<number | null>(null);
  // Tracks which G.lastCombatResult.seq the player has clicked "Weiter" on — before that, the
  // affected battlefield renders the FROZEN combat snapshot (every participant, damage taken,
  // dead or not) right on the cards themselves, instead of the live post-combat board state
  // (where a defeated unit is already gone). Playtest feedback: a lost unit vanishing the instant
  // combat resolves, with only a small text panel explaining why, made it hard to actually see
  // what just happened. Separate from dismissedCombatSeq (below), which only controls the little
  // topbar recap SHOWN AFTER review — per-unit detail belongs on the battlefield, not up there.
  const [combatReviewedSeq, setCombatReviewedSeq] = useState<number | null>(null);
  // The click-order this player is building for the open PendingDamageAssignment window (see
  // game/state.ts) — an ORDERED list, unlike attackMode's unordered Set, since rule 460.2.c's
  // Tank-first/Backline-last constraint is about sequence, not just membership. Reset whenever a
  // fresh window opens (or none is open) so stale picks from an earlier Showdown never leak in.
  const [damageOrderPicks, setDamageOrderPicks] = useState<string[]>([]);
  useEffect(() => {
    setDamageOrderPicks([]);
  }, [G.pendingDamageAssignment?.battlefieldIndex, G.pendingDamageAssignment?.attacker, G.pendingDamageAssignment === null]);
  // The click-order this player is building for a pending Predict (see PlayerState.pendingPredict,
  // rule 436) — positions (0-based, from the current top of the deck) clicked so far, in the order
  // clicked. Whatever's clicked stays on top in that order; whatever isn't gets Recycled. Reset
  // whenever a fresh Predict opens (or none is open).
  const [predictKeepOrder, setPredictKeepOrder] = useState<number[]>([]);
  useEffect(() => {
    setPredictKeepOrder([]);
  }, [playerID ? G.players[playerID as PlayerId].pendingPredict : 0]);

  const me = playerID as PlayerId | null;
  // `{all: Stage.NULL}` (see combat.ts's beginCombatDamageAssignment) keeps BOTH players
  // `isActive` during a damage-assignment window, unlike the spell/combat reaction windows above
  // (which exclude one side) — so canAct explicitly closes off normal turn actions here instead of
  // relying on boardgame.io's activePlayers to do it.
  const canAct = isActive && me !== null && ctx.currentPlayer === me && !G.pendingDamageAssignment;

  if (ctx.gameover) {
    return (
      <div className="rb-board">
        <div className="rb-topbar">
          <h2>Spiel vorbei — Sieger: Spieler {ctx.gameover.winner}</h2>
        </div>
      </div>
    );
  }
  if (!me) return <div className="rb-board">Kein Spieler zugewiesen.</div>;

  const player = G.players[me];
  const opponentId: PlayerId = me === "0" ? "1" : "0";

  if (ctx.phase === "deckSelect") {
    const submitted = player.battlefieldPool.length > 0;
    const savedDecks = listSavedDecks();
    const legalDecks = savedDecks.filter((d) => validateDeck(d.deck).length === 0);
    return (
      <div className="rb-board">
        <div className="rb-topbar">
          <h2>Spieler {me} — Deck wählen</h2>
        </div>
        {submitted ? (
          <p className="rb-db-hint">Deck übermittelt — warte auf den Gegner…</p>
        ) : legalDecks.length === 0 ? (
          <p className="rb-db-hint">
            Keine legalen, gespeicherten Decks gefunden. Im Deckbuilder (eigener Browser-Tab) zuerst eins bauen und
            speichern, dann hier neu laden.
          </p>
        ) : (
          <>
            <p className="rb-db-hint">Wähle dein Deck für dieses Spiel.</p>
            <div className="rb-menu-start">
              {legalDecks.map((d) => (
                <button key={d.id} className="rb-end-turn" onClick={() => moves.submitDeck({ deck: d.deck })}>
                  {d.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (ctx.phase === "battlefieldSelect") {
    return (
      <div className="rb-board">
        <div className="rb-topbar">
          <h2>Spieler {me} — Battlefield wählen</h2>
        </div>
        {player.chosenBattlefieldId ? (
          <p className="rb-db-hint">Battlefield gewählt — warte auf den Gegner…</p>
        ) : (
          <>
            <p className="rb-db-hint">
              Wähle 1 von deinen 3 eingereichten Battlefields, das du mit an den Tisch bringst.
            </p>
            <div className="rb-row">
              {player.battlefieldPool.map((cardId) => (
                <CardFace
                  key={cardId}
                  card={getCard(cardId)}
                  size="sm"
                  onClick={() => moves.chooseBattlefield({ cardId })}
                  footer={<div className="rb-db-legend-name">{getCard(cardId).name}</div>}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (ctx.phase === "mulligan") {
    function toggleMulligan(idx: number) {
      setMulliganSelected((prev) => {
        const next = new Set(prev);
        if (next.has(idx)) next.delete(idx);
        else if (next.size < 2) next.add(idx);
        return next;
      });
    }
    function confirmMulligan() {
      moves.mulligan({ handIndices: Array.from(mulliganSelected) });
    }
    return (
      <div className="rb-board">
        <div className="rb-topbar">
          <h2>Spieler {me} — Mulligan</h2>
        </div>
        {player.mulliganDone ? (
          <p className="rb-db-hint">Mulligan bestätigt — warte auf den Gegner…</p>
        ) : (
          <>
            <p className="rb-db-hint">
              Deine Starthand: {player.hand.length} Karten. Wähle bis zu 2 aus, die du gegen zufällige neue Karten
              aus deinem Deck tauschen willst — oder bestätige ohne Auswahl, um deine Hand zu behalten.
            </p>
            <div className="rb-row">
              {player.hand.map((cardId, idx) => (
                <CardFace
                  key={idx}
                  card={getCard(cardId)}
                  size="sm"
                  selected={mulliganSelected.has(idx)}
                  onClick={() => toggleMulligan(idx)}
                />
              ))}
            </div>
            <button className="rb-end-turn" onClick={confirmMulligan}>
              {mulliganSelected.size === 0 ? "Hand behalten" : `${mulliganSelected.size} Karte(n) tauschen`}
            </button>
          </>
        )}
      </div>
    );
  }

  function playCardAuto(handIndex: number, payAdditionalCost: boolean, ambushBattlefieldIndex?: number) {
    const cardId = player.hand[handIndex];
    const card = getCard(cardId);
    const dummyInstance = blankInstance(cardId, me!);
    if (blocksPlayForMissingTarget(card, dummyInstance)) {
      window.alert("Kein gültiges Ziel verfügbar — dieser Spruch kann so nicht gespielt werden.");
      return;
    }
    const payment = computeAutoPayment(G, card, dummyInstance, player.runePool, payAdditionalCost);
    if (!payment) {
      window.alert("Nicht genug Runen, um diese Karte zu bezahlen.");
      return;
    }
    if (specialCaseNeedsPlayTarget(card) || templatedEffectNeedsPlayTarget(card.templatedEffect)) {
      setPendingTarget({ handIndex, payAdditionalCost, ambushBattlefieldIndex });
      return;
    }
    moves.playCard({
      handIndex,
      energyRuneIds: payment.energyRuneIds,
      powerRuneIds: payment.powerRuneIds,
      payAdditionalCost,
      ambushBattlefieldIndex,
    });
  }

  /**
   * Same as playCardAuto, but ALSO pays the spell's [Repeat] cost (rule 820, card.repeatCost) as
   * an additional cost on top of the base payment — auto-picking the extra runes from whatever's
   * left in the pool after the base cost's picks, same greedy spirit as computeAutoPayment. Only
   * offered when both the base cost and the Repeat cost can be covered simultaneously.
   */
  function playCardAutoWithRepeat(handIndex: number) {
    const cardId = player.hand[handIndex];
    const card = getCard(cardId);
    const dummyInstance = blankInstance(cardId, me!);
    if (card.type !== "spell" || !card.repeatCost) return;
    if (blocksPlayForMissingTarget(card, dummyInstance)) {
      window.alert("Kein gültiges Ziel verfügbar — dieser Spruch kann so nicht gespielt werden.");
      return;
    }
    const payment = computeAutoPayment(G, card, dummyInstance, player.runePool, false);
    if (!payment) {
      window.alert("Nicht genug Runen, um diese Karte zu bezahlen.");
      return;
    }
    const used = new Set([...payment.energyRuneIds, ...payment.powerRuneIds]);
    const repeatPowerRuneId = card.repeatCost.runeDomain
      ? player.runePool.find((r) => r.domain === card.repeatCost!.runeDomain && !used.has(r.instanceId))?.instanceId
      : undefined;
    if (card.repeatCost.runeDomain && !repeatPowerRuneId) {
      window.alert("Nicht genug Runen für den Repeat-Zusatzkosten.");
      return;
    }
    if (repeatPowerRuneId) used.add(repeatPowerRuneId);
    const repeatEnergyNeeded = Math.max(
      0,
      card.repeatCost.energy - SpecialCaseEngine.repeatEnergyReductionFromControlledBattlefields(G, getCard, me!),
    );
    const repeatEnergyRuneIds = player.runePool
      .filter((r) => !r.exhausted && !used.has(r.instanceId))
      .slice(0, repeatEnergyNeeded)
      .map((r) => r.instanceId);
    if (repeatEnergyRuneIds.length !== repeatEnergyNeeded) {
      window.alert("Nicht genug Runen für den Repeat-Zusatzkosten.");
      return;
    }
    if (specialCaseNeedsPlayTarget(card) || templatedEffectNeedsPlayTarget(card.templatedEffect)) {
      setPendingTarget({ handIndex, payAdditionalCost: false, payRepeatCost: true, repeatEnergyRuneIds, repeatPowerRuneId });
      return;
    }
    moves.playCard({
      handIndex,
      energyRuneIds: payment.energyRuneIds,
      powerRuneIds: payment.powerRuneIds,
      payRepeatCost: true,
      repeatEnergyRuneIds,
      repeatPowerRuneId,
    });
  }

  /**
   * [Flow]: auto-pays a trashed spell's Flow cost (Card.flowCost) and plays it from trash. Picks
   * domain-specific rune slots first, then any-domain slots (the one cost shape unique to Flow —
   * pay a Rune of ANY domain per slot), then Energy last from whatever's left, so scarcer
   * domain-specific runes aren't accidentally consumed by the Energy portion first.
   */
  function playFromTrashAuto(trashIndex: number) {
    const cardId = player.trash[trashIndex];
    const card = getCard(cardId);
    if (card.type !== "spell" || !card.flowCost) return;
    const flowCost = card.flowCost;
    const dummyInstance = blankInstance(cardId, me!);
    if (blocksPlayForMissingTarget(card, dummyInstance)) {
      window.alert("Kein gültiges Ziel verfügbar — dieser Spruch kann so nicht gespielt werden.");
      return;
    }
    const used = new Set<string>();
    const trashRuneDomainRuneIds = player.runePool
      .filter((r) => !used.has(r.instanceId) && r.domain === flowCost.runeDomain)
      .slice(0, flowCost.runeDomainCount)
      .map((r) => r.instanceId);
    trashRuneDomainRuneIds.forEach((id) => used.add(id));
    const trashAnyDomainRuneIds = player.runePool
      .filter((r) => !used.has(r.instanceId))
      .slice(0, flowCost.anyDomainRuneCount)
      .map((r) => r.instanceId);
    trashAnyDomainRuneIds.forEach((id) => used.add(id));
    const energyNeeded = Math.max(
      0,
      flowCost.energy - SpecialCaseEngine.flowEnergyReductionForController(G, getCard, me!, flowCost.energy),
    );
    const trashEnergyRuneIds = player.runePool
      .filter((r) => !r.exhausted && !used.has(r.instanceId))
      .slice(0, energyNeeded)
      .map((r) => r.instanceId);
    if (
      trashRuneDomainRuneIds.length !== flowCost.runeDomainCount ||
      trashAnyDomainRuneIds.length !== flowCost.anyDomainRuneCount ||
      trashEnergyRuneIds.length !== energyNeeded
    ) {
      window.alert("Nicht genug Runen, um diese Karte per [Flow] zu spielen.");
      return;
    }
    if (specialCaseNeedsPlayTarget(card)) {
      setPendingTarget({
        payAdditionalCost: false,
        fromTrashIndex: trashIndex,
        trashEnergyRuneIds,
        trashRuneDomainRuneIds,
        trashAnyDomainRuneIds,
      });
      return;
    }
    moves.playFromTrash({
      trashIndex,
      energyRuneIds: trashEnergyRuneIds,
      runeDomainRuneIds: trashRuneDomainRuneIds,
      anyDomainRuneIds: trashAnyDomainRuneIds,
    });
  }

  function startManualPayment(handIndex: number, payAdditionalCost: boolean, ambushBattlefieldIndex?: number) {
    setPendingManualPayment({ handIndex, payAdditionalCost, ambushBattlefieldIndex });
    setManualEnergyRuneIds([]);
    setManualPowerRuneIds([]);
  }

  /** Cycles one rune through unused -> Energy -> Power -> unused. Exhausted runes skip the Energy step (matching moves.ts's own validation: only ready runes may pay Energy; recycling for Power doesn't care). */
  function toggleManualRune(runeId: string, exhausted: boolean) {
    if (manualEnergyRuneIds.includes(runeId)) {
      setManualEnergyRuneIds((prev) => prev.filter((id) => id !== runeId));
      setManualPowerRuneIds((prev) => [...prev, runeId]);
    } else if (manualPowerRuneIds.includes(runeId)) {
      setManualPowerRuneIds((prev) => prev.filter((id) => id !== runeId));
    } else if (!exhausted) {
      setManualEnergyRuneIds((prev) => [...prev, runeId]);
    } else {
      setManualPowerRuneIds((prev) => [...prev, runeId]);
    }
  }

  function confirmManualPayment() {
    if (!pendingManualPayment) return;
    const { handIndex, payAdditionalCost, ambushBattlefieldIndex } = pendingManualPayment;
    const cardId = player.hand[handIndex];
    const card = getCard(cardId);
    if (specialCaseNeedsPlayTarget(card) || templatedEffectNeedsPlayTarget(card.templatedEffect)) {
      setPendingTarget({
        handIndex,
        payAdditionalCost,
        ambushBattlefieldIndex,
        manualEnergyRuneIds,
        manualPowerRuneIds,
      });
    } else {
      moves.playCard({
        handIndex,
        energyRuneIds: manualEnergyRuneIds,
        powerRuneIds: manualPowerRuneIds,
        payAdditionalCost,
        ambushBattlefieldIndex,
      });
    }
    setPendingManualPayment(null);
  }

  /** Battlefields this player controls that don't already have a facedown card hidden there (rule 811.1.b) — the legal targets for hideCardAuto below. */
  function eligibleHideBattlefields(): number[] {
    return G.battlefields
      .map((_slot, index) => index)
      .filter((index) => G.battlefields[index].controller === me && !player.hiddenZone.some((h) => h.battlefieldIndex === index));
  }

  /** Plays a [Hidden] hand card face-down into the player's Hidden zone, bound to `battlefieldIndex` (see state.ts's `HiddenCard`) — instead of resolving it. Costs recycling 1 Rune, any domain (no player choice, matching this codebase's established auto-payment convention). */
  function hideCardAuto(handIndex: number, battlefieldIndex: number) {
    const rune = player.runePool[0];
    if (!rune) {
      window.alert("Keine Rune zum Verdecken verfügbar.");
      return;
    }
    moves.hideCard({ handIndex, runeId: rune.instanceId, battlefieldIndex });
  }

  /** Plays a card out of the Hidden zone for free (0 Energy/Power) — same target-picker handling as playCardAuto, just via moves.playFromHidden instead of moves.playCard. Deploy location (for a unit/champion) is forced to the Battlefield it was hidden at (rule 811.1.d) — no ambush choice here, unlike a normal play. */
  function playFromHiddenAuto(hiddenIndex: number) {
    const hidden = player.hiddenZone[hiddenIndex];
    if (!hidden) return;
    const card = getCard(hidden.cardId);
    const dummyInstance = blankInstance(hidden.cardId, me!);
    if (blocksPlayForMissingTarget(card, dummyInstance, hidden.battlefieldIndex)) {
      window.alert("Kein gültiges Ziel verfügbar — dieser Spruch kann so nicht gespielt werden.");
      return;
    }
    if (specialCaseNeedsPlayTarget(card) || templatedEffectNeedsPlayTarget(card.templatedEffect)) {
      setPendingTarget({ fromHiddenIndex: hiddenIndex, payAdditionalCost: false });
      return;
    }
    moves.playFromHidden({ hiddenIndex });
  }

  /** Same as playCardAuto, but sourcing the card from the player's Champion Zone (see state.ts's `championZone`) instead of a hand index — the Chosen Champion is playable any time it's affordable, not just when drawn into hand. */
  function playChampionAuto(payAdditionalCost: boolean, ambushBattlefieldIndex?: number) {
    const cardId = player.championZone;
    if (!cardId) return;
    const card = getCard(cardId);
    const dummyInstance = blankInstance(cardId, me!);
    const payment = computeAutoPayment(G, card, dummyInstance, player.runePool, payAdditionalCost);
    if (!payment) {
      window.alert("Nicht genug Runen, um diese Karte zu bezahlen.");
      return;
    }
    if (specialCaseNeedsPlayTarget(card) || templatedEffectNeedsPlayTarget(card.templatedEffect)) {
      setPendingTarget({ fromChampionZone: true, payAdditionalCost, ambushBattlefieldIndex });
      return;
    }
    moves.playCard({
      fromChampionZone: true,
      energyRuneIds: payment.energyRuneIds,
      powerRuneIds: payment.powerRuneIds,
      payAdditionalCost,
      ambushBattlefieldIndex,
    });
  }

  function confirmTarget(targetInstanceId?: string) {
    if (!pendingTarget) return;
    if (pendingTarget.fromHiddenIndex !== undefined) {
      moves.playFromHidden({
        hiddenIndex: pendingTarget.fromHiddenIndex,
        targetInstanceId,
      });
      setPendingTarget(null);
      return;
    }
    if (pendingTarget.fromTrashIndex !== undefined) {
      moves.playFromTrash({
        trashIndex: pendingTarget.fromTrashIndex,
        targetInstanceId,
        energyRuneIds: pendingTarget.trashEnergyRuneIds ?? [],
        runeDomainRuneIds: pendingTarget.trashRuneDomainRuneIds ?? [],
        anyDomainRuneIds: pendingTarget.trashAnyDomainRuneIds ?? [],
      });
      setPendingTarget(null);
      return;
    }
    const cardId = pendingTarget.fromChampionZone ? player.championZone : player.hand[pendingTarget.handIndex ?? -1];
    if (!cardId) return;
    const card = getCard(cardId);
    let payment: { energyRuneIds: string[]; powerRuneIds: string[] } | null;
    if (pendingTarget.manualEnergyRuneIds) {
      payment = { energyRuneIds: pendingTarget.manualEnergyRuneIds, powerRuneIds: pendingTarget.manualPowerRuneIds ?? [] };
    } else {
      const dummyInstance = blankInstance(cardId, me!);
      payment = computeAutoPayment(G, card, dummyInstance, player.runePool, pendingTarget.payAdditionalCost);
    }
    if (!payment) return;
    moves.playCard({
      handIndex: pendingTarget.handIndex,
      fromChampionZone: pendingTarget.fromChampionZone,
      energyRuneIds: payment.energyRuneIds,
      powerRuneIds: payment.powerRuneIds,
      payAdditionalCost: pendingTarget.payAdditionalCost,
      targetInstanceId,
      ambushBattlefieldIndex: pendingTarget.ambushBattlefieldIndex,
      payRepeatCost: pendingTarget.payRepeatCost,
      repeatEnergyRuneIds: pendingTarget.repeatEnergyRuneIds,
      repeatPowerRuneId: pendingTarget.repeatPowerRuneId,
    });
    setPendingTarget(null);
  }

  function abilityCostFor(card: ReturnType<typeof getCard>, instance: CardInstance) {
    return card.activatedAbility?.cost ?? SpecialCaseEngine.activatedAbilityCost(G, card, instance);
  }

  function abilityNeedsTargetFor(card: ReturnType<typeof getCard>) {
    return card.activatedAbility
      ? activatedAbilityNeedsTarget(card.activatedAbility)
      : SpecialCaseEngine.activateNeedsTarget(card);
  }

  function computeAbilityPayment(cost: { energy: number; runeDomain?: Domain }) {
    const powerRune = cost.runeDomain ? player.runePool.find((r) => r.domain === cost.runeDomain) : undefined;
    if (cost.runeDomain && !powerRune) return null;
    const readyRunes = player.runePool.filter((r) => !r.exhausted && r.instanceId !== powerRune?.instanceId);
    if (readyRunes.length < cost.energy) return null;
    return {
      energyRuneIds: readyRunes.slice(0, cost.energy).map((r) => r.instanceId),
      powerRuneId: powerRune?.instanceId,
    };
  }

  function activateAbilityAuto(instanceId: string) {
    const instance = G.instances[instanceId];
    const card = getCard(instance.cardId);
    if (blocksActivateForMissingTarget(card, instance)) {
      window.alert("Kein gültiges Ziel verfügbar — diese Fähigkeit kann gerade nicht aktiviert werden.");
      return;
    }
    const cost = abilityCostFor(card, instance);
    if (!cost) return;
    const payment = computeAbilityPayment(cost);
    if (!payment) {
      window.alert("Nicht genug Runen, um diese Fähigkeit zu aktivieren.");
      return;
    }
    if (abilityNeedsTargetFor(card)) {
      setPendingAbility({ instanceId });
      return;
    }
    moves.activateAbility({ instanceId, ...payment });
  }

  function empowerAuto(instanceId: string) {
    const instance = G.instances[instanceId];
    const card = getCard(instance.cardId);
    const cost = SpecialCaseEngine.empowerCost(G, card, instance);
    if (!cost) return;
    const payment = computeAbilityPayment(cost);
    if (!payment) {
      window.alert("Nicht genug Runen, um das zu bezahlen.");
      return;
    }
    moves.empowerInstance({ instanceId, ...payment });
  }

  function confirmAbilityTarget(targetInstanceId: string) {
    if (!pendingAbility) return;
    const instance = G.instances[pendingAbility.instanceId];
    const card = getCard(instance.cardId);
    const cost = abilityCostFor(card, instance);
    if (!cost) return;
    const payment = computeAbilityPayment(cost);
    if (!payment) return;
    moves.activateAbility({
      instanceId: pendingAbility.instanceId,
      ...payment,
      targetInstanceId,
    });
    setPendingAbility(null);
  }

  function computeEquipPayment(cost: { energy: number; runeDomain?: import("../cards/types").Domain }) {
    const powerRune = cost.runeDomain ? player.runePool.find((r) => !r.exhausted && r.domain === cost.runeDomain) : undefined;
    if (cost.runeDomain && !powerRune) return null;
    const readyRunes = player.runePool.filter((r) => !r.exhausted && r.instanceId !== powerRune?.instanceId);
    if (readyRunes.length < cost.energy) return null;
    return {
      energyRuneIds: readyRunes.slice(0, cost.energy).map((r) => r.instanceId),
      powerRuneId: powerRune?.instanceId,
    };
  }

  function startEquip(gearInstanceId: string) {
    const gear = G.instances[gearInstanceId];
    const cost = getCard(gear.cardId).equipCost;
    if (!cost) return;
    if (!computeEquipPayment(cost)) {
      window.alert("Nicht genug Runen, um diese Ausrüstung anzulegen.");
      return;
    }
    setPendingEquip({ gearInstanceId });
  }

  function equipOnto(gearInstanceId: string, targetInstanceId: string) {
    const gear = G.instances[gearInstanceId];
    const cost = getCard(gear.cardId).equipCost;
    if (!cost) return;
    const payment = computeEquipPayment(cost);
    if (!payment) {
      window.alert("Nicht genug Runen, um diese Ausrüstung anzulegen.");
      return;
    }
    moves.equipGear({ gearInstanceId, targetInstanceId, ...payment });
  }

  function confirmEquipTarget(targetInstanceId: string) {
    if (!pendingEquip) return;
    equipOnto(pendingEquip.gearInstanceId, targetInstanceId);
    setPendingEquip(null);
  }

  // ---- Drag-and-drop (see cards.css .rb-draggable/.rb-drop-active) ----
  // Additive alternative to the click flows above; every drop reuses the same underlying
  // move-building functions (equipOnto, playCardAuto, moves.attackBattlefield).
  function dragStart(payload: NonNullable<typeof dragPayload>) {
    return (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = "move";
      // Firefox requires setData to be called for a drag to initiate at all; the actual payload
      // travels via React state (dragPayload), not this string.
      e.dataTransfer.setData("text/plain", "drag");
      setDragPayload(payload);
    };
  }
  function dragEnd() {
    setDragPayload(null);
    setDropHoverId(null);
  }
  function dropZone<T extends string>(id: T, accepts: (payload: NonNullable<typeof dragPayload>) => boolean) {
    return {
      onDragOver: (e: React.DragEvent) => {
        if (!dragPayload || !accepts(dragPayload)) return;
        e.preventDefault();
        if (dropHoverId !== id) setDropHoverId(id);
      },
      onDragLeave: () => setDropHoverId((prev) => (prev === id ? null : prev)),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        setDropHoverId(null);
        if (!dragPayload || !accepts(dragPayload)) return;
        const payload = dragPayload;
        setDragPayload(null);
        if (payload.type === "gear") equipOnto(payload.gearInstanceId, id);
        else if (payload.type === "handCard") playCardAuto(payload.handIndex, false);
        else if (payload.type === "unit") {
          // Stage this unit as an attacker (same as clicking it) instead of committing combat
          // immediately — dragging several units, one at a time, onto the same battlefield needs
          // to build up a group BEFORE the fight happens, not resolve combat after just the
          // first one. The existing "Hierhin angreifen" button (rendered once >=1 unit is
          // staged) commits the actual attackBattlefield move for all staged units at once.
          toggleAttacker(payload.instanceId);
        }
      },
    };
  }

  function payOptionalCost() {
    const pending = G.pendingOptionalCost;
    if (!pending) return;
    const powerRune = pending.cost.runeDomain
      ? player.runePool.find((r) => r.domain === pending.cost.runeDomain)
      : undefined;
    if (pending.cost.runeDomain && !powerRune) {
      window.alert("Nicht genug Runen, um diese Entscheidung zu bezahlen.");
      return;
    }
    const readyRunes = player.runePool.filter((r) => !r.exhausted && r.instanceId !== powerRune?.instanceId);
    if (readyRunes.length < pending.cost.energy) {
      window.alert("Nicht genug Runen, um diese Entscheidung zu bezahlen.");
      return;
    }
    moves.resolveOptionalCost({
      pay: true,
      energyRuneIds: readyRunes.slice(0, pending.cost.energy).map((r) => r.instanceId),
      powerRuneId: powerRune?.instanceId,
    });
  }

  function declineOptionalCost() {
    moves.resolveOptionalCost({ pay: false, energyRuneIds: [] });
  }

  /** Resolves a unit/champion instance's attached Gear instanceIds (CardInstance.equipment) into real Card objects, for CardFace's `equippedGear` hover preview. */
  function getEquippedGear(instance: CardInstance): Card[] {
    return instance.equipment.map((id) => getCard(G.instances[id].cardId));
  }

  /**
   * Real eligible candidates for a DATA-DRIVEN (auto-matched TemplatedAction) target, computed
   * the exact same way moves.ts validates them server-side (see game/templatedEffectEngine.ts's
   * candidatesForTarget) — so the picker only ever shows legal choices, and "Spielen"/"Aktivieren"
   * can be blocked up front instead of letting the player pay for a card that can't do anything.
   * Returns null for a bespoke special-case target, which has no such spec — those keep the old
   * "show every board instance" picker (see targetPicker below), since there's no eligibility rule
   * exposed to filter by.
   */
  /** `restrictToBattlefieldIndex` mirrors moves.ts's rejectsInvalidTemplatedTarget — rule 811.1.d.2, for a card played from Hidden (see playFromHiddenAuto/the pendingTarget picker below). */
  function templatedTargetInfo(
    actions: import("../cards/templatedEffects").TemplatedAction[] | undefined,
    source: CardInstance,
    restrictToBattlefieldIndex?: number,
  ) {
    const spec = actions ? firstChooseTargetSpec(actions) : undefined;
    if (!spec) return null;
    let candidates = candidatesForTarget(G, getCard, source, spec);
    if (restrictToBattlefieldIndex !== undefined) {
      candidates = candidates.filter((c) => c.battlefieldIndex === restrictToBattlefieldIndex);
    }
    return { spec, candidates };
  }

  /**
   * True if playing `card` right now is pointless: a SPELL whose entire effect is a mandatory
   * target with zero legal candidates (see moves.ts's rejectsInvalidTemplatedTarget for the
   * matching server-side rejection and its doc comment on why only spells are blocked this way —
   * a unit/champion/gear's onPlay trigger is a bonus on top of deploying the card, which still
   * happens even if the trigger fizzles).
   */
  function blocksPlayForMissingTarget(card: Card, source: CardInstance, restrictToBattlefieldIndex?: number): boolean {
    if (card.type !== "spell" || card.templatedEffect?.trigger !== "onPlay") return false;
    const info = templatedTargetInfo(card.templatedEffect.actions, source, restrictToBattlefieldIndex);
    return Boolean(info && !info.spec.optional && info.candidates.length === 0);
  }

  /** Same idea as blocksPlayForMissingTarget, for activated abilities — always blocked with zero candidates (see moves.ts: no activated ability's target is `optional`, and activating is a deliberate cost-paying choice the same way casting a spell is). */
  function blocksActivateForMissingTarget(card: Card, source: CardInstance): boolean {
    if (!card.activatedAbility) return false;
    const info = templatedTargetInfo(card.activatedAbility.actions, source);
    return Boolean(info && info.candidates.length === 0);
  }

  function toggleAttacker(instanceId: string) {
    setAttackMode((prev) => {
      const selected = new Set(prev?.selected ?? []);
      if (selected.has(instanceId)) selected.delete(instanceId);
      else selected.add(instanceId);
      return { selected };
    });
  }

  function launchAttack(battlefieldIndex: number) {
    if (!attackMode || attackMode.selected.size === 0) return;
    moves.attackBattlefield({
      battlefieldIndex,
      unitInstanceIds: Array.from(attackMode.selected),
    });
    setAttackMode(null);
  }

  /**
   * `eligibleIds`, when given, restricts the picker to real legal candidates (see
   * templatedTargetInfo) instead of every instance on the board — set by the two call sites below
   * for DATA-DRIVEN targets; left undefined for bespoke special-case targets, which fall back to
   * the old "show everything, server validates" behavior since there's no eligibility rule to
   * filter by. `onSkip`, when given, adds a "kein Ziel" button for an `optional` ("you may...")
   * target — skipping is a real, distinct choice from picking a (possibly nonexistent) target.
   */
  function targetPicker(onPick: (id: string) => void, options?: { eligibleIds?: Set<string>; onSkip?: () => void }) {
    const instances = Object.values(G.instances).filter((i) => i.zone === "base" || i.zone === "battlefield");
    const shown = options?.eligibleIds ? instances.filter((i) => options.eligibleIds!.has(i.instanceId)) : instances;
    return (
      <div className="rb-callout-targets">
        {options?.onSkip && (
          <button className="rb-skip-target" onClick={options.onSkip}>
            Kein Ziel (überspringen)
          </button>
        )}
        {shown.map((i) => (
          <CardFace
            key={i.instanceId}
            card={getCard(i.cardId)}
            instance={i}
            size="sm"
            onClick={() => onPick(i.instanceId)}
            equippedGear={getEquippedGear(i)}
          />
        ))}
      </div>
    );
  }

  const opponent = G.players[opponentId];

  // Not yet reviewed (see combatReviewedSeq above) — the battlefield itself shows this instead of
  // its live units.
  const combatPendingReview =
    G.lastCombatResult && G.lastCombatResult.seq !== combatReviewedSeq ? G.lastCombatResult : null;
  // Reviewed — the small topbar recap shows this until dismissed (or replaced by the next fight).
  const combatResult =
    G.lastCombatResult && G.lastCombatResult.seq === combatReviewedSeq && G.lastCombatResult.seq !== dismissedCombatSeq
      ? G.lastCombatResult
      : null;

  // A spell or a declared attack is paused waiting for a [Reaction] response — see
  // game/state.ts's PendingSpellReaction/PendingCombatReaction. canReact uses `isActive` (not
  // `canAct`'s `ctx.currentPlayer === me`, which stays with whoever opened the window throughout
  // — see game/game.ts) since boardgame.io grants the RESPONDER move access here via
  // activePlayers, not a currentPlayer change. The two windows can never both be open at once
  // (see PendingCombatReaction's doc comment), so at most one of these is ever true.
  const canReactToSpell = isActive && G.pendingSpellReaction !== null && G.pendingSpellReaction.casterId !== me;
  const canReactToCombat = isActive && G.pendingCombatReaction !== null && G.pendingCombatReaction.attacker !== me;
  const canReact = canReactToSpell || canReactToCombat;
  const reactableHand = canReact
    ? player.hand
        .map((cardId, idx) => ({ cardId, idx }))
        .filter(({ cardId }) => {
          const card = getCard(cardId);
          // During a combat window, an [Action] spell is ALSO playable, not just [Reaction] — rule
          // 806.1.b (see moves.ts's hasReactionOrActionSpellInHand/playCard for the matching
          // engine-side legality). Spell-only, matching this window's own type restriction.
          const eligibleKeyword =
            KeywordEngine.hasKeyword(card, "reaction") || (canReactToCombat && card.type === "spell" && KeywordEngine.hasKeyword(card, "action"));
          if (!eligibleKeyword) return false;
          // A "Counter a spell" card only makes sense reacting to an actual pending spell —
          // there's nothing to counter during a combat reaction window (see moves.ts's playCard).
          if (canReactToCombat && SpecialCaseEngine.hasCounterIntent(card)) return false;
          return true;
        })
    : [];

  const championCard = player.championZone ? getCard(player.championZone) : null;
  const championDummyInstance = player.championZone ? blankInstance(player.championZone, me) : null;
  const championCanAfford =
    championCard && championDummyInstance
      ? computeAutoPayment(G, championCard, championDummyInstance, player.runePool, false) !== null
      : false;
  const championAmbushBattlefields =
    championCard && championDummyInstance ? eligibleAmbushBattlefields(G, championCard, championDummyInstance) : [];

  return (
    <div className="rb-board">
      <div className="rb-topbar">
        <div>
          <h2>Spieler {me}</h2>
          <div className="rb-status">
            {/* ctx.turn counts globally from the very start of the match, including the three
                pregame phases' own turn slots ("deckSelect", "battlefieldSelect", "mulligan") —
                subtract 3 so the player-facing counter reads "Zug 1" for the first real turn. */}
            Zug {ctx.turn - 3} · Phase: {G.turnPhase}
          </div>
        </div>
        <div className="rb-scoreline">
          <span>
            Punkte: <b>{player.points}</b> — Gegner <b>{opponent.points}</b>
          </span>
          <span>
            XP: <b>{player.xp}</b>
          </span>
        </div>
        <div className={`rb-turn-pill${canAct ? " active" : ""}`}>{canAct ? "Am Zug" : "Wartet"}</div>
        <button
          className="rb-mode-toggle"
          title="Einfacher Modus zeigt grüne/rote Rahmen für spielbar/bezahlbar bzw. blockiert. Standard blendet die Rahmen aus, blockiert illegale Züge aber genauso."
          onClick={() => setSimpleMode((v) => !v)}
        >
          Modus: {simpleMode ? "Einfach" : "Standard"}
        </button>
      </div>

      {/* Post-combat damage summary — playtesters reported combat resolving "too instantly" with
          no visible feedback on who dealt/took how much damage. Purely a read-only recap of a
          Showdown that already resolved (see GameState.lastCombatResult); dismissible, and
          replaced automatically by the next Showdown's summary. */}
      {combatResult &&
        (() => {
          const battlefieldName = getCard(G.battlefields[combatResult.battlefieldIndex].cardId).name;
          const outcomeText =
            combatResult.conqueredBy === me
              ? "Du hast das Battlefield erobert."
              : combatResult.conqueredBy === opponentId
                ? "Der Gegner hat das Battlefield erobert."
                : "Battlefield bleibt umkämpft.";
          return (
            <div className="rb-combat-summary">
              <div className="rb-combat-summary-header">
                <b>Kampf bei {battlefieldName}</b>
                <button className="rb-combat-summary-close" onClick={() => setDismissedCombatSeq(combatResult.seq)}>
                  ×
                </button>
              </div>
              <div className="rb-combat-summary-totals">
                <span>
                  {combatResult.attacker === me ? "Du" : "Gegner"} verursachte <b>{combatResult.attackerDamageDealt}</b>{" "}
                  Schaden
                </span>
                <span>
                  {combatResult.defender === me ? "Du" : "Gegner"} verursachte <b>{combatResult.defenderDamageDealt}</b>{" "}
                  Schaden
                </span>
              </div>
              <div className="rb-combat-summary-outcome">{outcomeText}</div>
              <div className="rb-row">
                {combatResult.hits.map((hit) => (
                  <CardFace
                    key={hit.instanceId}
                    card={getCard(hit.cardId)}
                    size="sm"
                    footer={
                      <span className={hit.died ? "rb-combat-hit-died" : "rb-combat-hit-damage"}>
                        {hit.died ? "☠ zerstört" : hit.damage > 0 ? `-${hit.damage}` : "unverletzt"}
                      </span>
                    }
                  />
                ))}
              </div>
            </div>
          );
        })()}

      {/* Spell reaction window (see game/state.ts's PendingSpellReaction) — the caster sees a
          read-only wait banner, the responder sees their own [Reaction] cards plus a pass button.
          Everything else (normal hand/attack/ability buttons) stays gated on `canAct`, which is
          already false for both players here (caster: not currentPlayer's turn to act again yet
          — well, they ARE currentPlayer but boardgame.io excludes them from activePlayers during
          the window; responder: `ctx.currentPlayer !== me`), so nothing else is clickable by
          accident while this is up. */}
      {G.pendingSpellReaction && (
        <div className="rb-callout warn">
          {G.pendingSpellReaction.casterId === me ? (
            <div className="rb-callout-title">
              Warte auf Reaktion des Gegners auf {getCard(G.pendingSpellReaction.cardId).name}…
            </div>
          ) : (
            <>
              <div className="rb-callout-title">
                Gegner spielt {getCard(G.pendingSpellReaction.cardId).name} — reagieren?
              </div>
              {reactableHand.length > 0 && (
                <div className="rb-row">
                  {reactableHand.map(({ cardId, idx }) => (
                    <CardFace
                      key={idx}
                      card={getCard(cardId)}
                      size="sm"
                      footer={<button onClick={() => playCardAuto(idx, false)}>Reagieren</button>}
                    />
                  ))}
                </div>
              )}
              <button className="cancel" onClick={() => moves.passReaction()}>
                Passen
              </button>
            </>
          )}
        </div>
      )}

      {/* Combat reaction window (see game/state.ts's PendingCombatReaction) — same idea as the
          spell reaction window above, but before a declared attack's Showdown math runs, so a
          [Reaction] spell here (e.g. removal on the attacker) still changes the outcome. */}
      {G.pendingCombatReaction && (
        <div className="rb-callout warn">
          {G.pendingCombatReaction.attacker === me ? (
            <div className="rb-callout-title">Warte auf Reaktion des Gegners auf deinen Angriff…</div>
          ) : (
            <>
              <div className="rb-callout-title">Gegner greift an — reagieren, bevor der Kampf sich auflöst?</div>
              {reactableHand.length > 0 && (
                <div className="rb-row">
                  {reactableHand.map(({ cardId, idx }) => (
                    <CardFace
                      key={idx}
                      card={getCard(cardId)}
                      size="sm"
                      footer={<button onClick={() => playCardAuto(idx, false)}>Reagieren</button>}
                    />
                  ))}
                </div>
              )}
              <button className="cancel" onClick={() => moves.passCombatReaction()}>
                Passen
              </button>
            </>
          )}
        </div>
      )}

      {/* Damage-assignment window (see game/state.ts's PendingDamageAssignment, rule 460.2.c) —
          opens only when a side's targets have 2+ units sharing a Tank/normal/Backline rank, so
          there's an actual choice; otherwise combat resolves without ever pausing here. Either or
          both sides may need to pick — `{all: Stage.NULL}` keeps both isActive, see canAct above. */}
      {G.pendingDamageAssignment &&
        (() => {
          const pending = G.pendingDamageAssignment;
          const iAmAttacker = pending.attacker === me;
          const iAmDefender = pending.defender === me;
          const myOrder = iAmAttacker ? pending.attackerOrder : iAmDefender ? pending.defenderOrder : undefined;
          if (!iAmAttacker && !iAmDefender) return null;
          if (myOrder !== null) {
            return (
              <div className="rb-callout warn">
                <div className="rb-callout-title">Schadensverteilung wird festgelegt — warte auf den Gegner…</div>
              </div>
            );
          }

          const targets = G.battlefields[pending.battlefieldIndex].units[iAmAttacker ? pending.defender : pending.attacker];
          const orderedIds = damageOrderPicks.filter((id) => targets.includes(id));

          function toggleDamageTarget(instanceId: string) {
            setDamageOrderPicks((prev) =>
              prev.includes(instanceId) ? prev.filter((id) => id !== instanceId) : [...prev, instanceId],
            );
          }

          return (
            <div className="rb-callout warn">
              <div className="rb-callout-title">
                Schaden verteilen: klicke die gegnerischen Einheiten in der Reihenfolge an, in der sie Schaden
                erhalten sollen (Tank zuerst, Backline zuletzt).
              </div>
              <div className="rb-row">
                {targets.map((instanceId) => {
                  const instance = G.instances[instanceId];
                  if (!instance) return null;
                  const orderIndex = orderedIds.indexOf(instanceId);
                  return (
                    <CardFace
                      key={instanceId}
                      card={getCard(instance.cardId)}
                      instance={instance}
                      size="sm"
                      selected={orderIndex !== -1}
                      onClick={() => toggleDamageTarget(instanceId)}
                      footer={orderIndex !== -1 ? <span>#{orderIndex + 1}</span> : undefined}
                    />
                  );
                })}
              </div>
              <div className="rb-row">
                <button
                  disabled={orderedIds.length !== targets.length}
                  onClick={() => {
                    moves.submitDamageAssignment({ order: orderedIds });
                    setDamageOrderPicks([]);
                  }}
                >
                  Bestätigen
                </button>
                <button className="cancel" onClick={() => setDamageOrderPicks([])}>
                  Zurücksetzen
                </button>
              </div>
            </div>
          );
        })()}

      <div className="rb-hud">
        {/* Opponent sits across the table: a compact strip — Runes above, then Legend&Champion /
            Deck / Base / Hidden / Trash stacked in a narrow column beside their hand (face down,
            count only). Mirrors "own side" below (see .rb-hud in cards.css) so the whole match
            fits one screen without scrolling. */}
        <div className="rb-hud-side rb-hud-side-opponent">
          <div className="rb-hud-row">
            <div className="rb-mat">
              <div className="rb-mat-wide">
                <div className="rb-mat-zone rb-mat-zone-base">
                  <div className="rb-row rb-hud-scroll-row">
                    {opponent.base.map((id) => (
                      <CardFace
                        key={id}
                        card={getCard(G.instances[id].cardId)}
                        instance={G.instances[id]}
                        size="sm"
                        equippedGear={getEquippedGear(G.instances[id])}
                      />
                    ))}
                  </div>
                  <div className="rb-mat-zone-label">
                    Gegner-Base <span className="rb-count">{opponent.base.length}</span>
                  </div>
                </div>

                <div className="rb-mat-row">
                  {/* Main Deck sits face-down for both players — only its SIZE is public info, never
                      its contents (see PlayerState.mainDeck). One card-back stands in for the pile. */}
                  <div className="rb-mat-zone rb-mat-zone-runedeck">
                    <div className="rb-row">{opponent.runeDeck.length > 0 && <div className="rb-card-back rb-deck-pile" />}</div>
                    <div className="rb-mat-zone-label">
                      Gegner-Runendeck <span className="rb-count">{opponent.runeDeck.length}</span>
                    </div>
                  </div>
                  {/* Runes sit face-up in a player's own play area in the physical game — visible to
                      both sides, unlike the hand. */}
                  <div className="rb-mat-zone rb-mat-zone-runepool">
                    <div className="rb-rune-strip">
                      {opponent.runePool.map((r) => (
                        <div key={r.instanceId} className="rb-rune-slot" title={`${r.domain} Rune${r.exhausted ? " (exhausted)" : ""}`}>
                          <CardFace card={getRuneCardForDomain(r.domain)} size="sm" rotated={r.exhausted} />
                        </div>
                      ))}
                    </div>
                    <div className="rb-mat-zone-label">
                      Gegner-Runen <span className="rb-count">{opponent.runePool.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rb-mat-narrow">
                {/* Legend and Chosen Champion are public information (chosen at deck-build time, see
                    docs/deck-building-rules.md) — shown face-up for both players, unlike the private hand. */}
                <div className="rb-mat-row">
                  <div className="rb-mat-zone rb-mat-zone-legend">
                    {opponent.legend && <CardFace card={getCard(opponent.legend.cardId)} size="sm" />}
                    <div className="rb-mat-zone-label">Gegner-Legend</div>
                  </div>
                  <div className="rb-mat-zone rb-mat-zone-champion">
                    {opponent.championZone && <CardFace card={getCard(opponent.championZone)} size="sm" />}
                    <div className="rb-mat-zone-label">Gegner-Champion</div>
                  </div>
                </div>

                <div className="rb-mat-zone rb-mat-zone-deck">
                  <div className="rb-row">{opponent.mainDeck.length > 0 && <div className="rb-card-back rb-deck-pile" />}</div>
                  <div className="rb-mat-zone-label">
                    Gegner-Deck <span className="rb-count">{opponent.mainDeck.length}</span>
                  </div>
                </div>

                {opponent.hiddenZone.length > 0 && (
                  <div className="rb-mat-zone rb-mat-zone-hidden">
                    <div className="rb-row rb-hud-scroll-row">
                      {opponent.hiddenZone.map((_, i) => (
                        <div key={i} className="rb-card-back" />
                      ))}
                    </div>
                    <div className="rb-mat-zone-label">
                      Gegner-Verdeckt <span className="rb-count">{opponent.hiddenZone.length}</span>
                    </div>
                  </div>
                )}

                {opponent.trash.length > 0 && (
                  <div className="rb-mat-zone rb-mat-zone-trash">
                    {/* Trash is public information (see docs/rules-reference.md) — shown face-up,
                        unlike hand/Hidden. Newest-on-top so the most recently trashed card is easy
                        to spot. */}
                    <div className="rb-row rb-hud-scroll-row">
                      {[...opponent.trash].reverse().map((cardId, i) => (
                        <CardFace key={i} card={getCard(cardId)} size="sm" />
                      ))}
                    </div>
                    <div className="rb-mat-zone-label">
                      Gegner-Trash <span className="rb-count">{opponent.trash.length}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rb-hud-hand">
              <div className="rb-section-label">
                Gegner-Hand <span className="rb-count">{opponent.hand.length}</span>
              </div>
              <div className="rb-row rb-hud-scroll-row">
                {opponent.hand.map((_, i) => (
                  <div key={i} className="rb-card-back" />
                ))}
              </div>
            </div>
          </div>
        </div>

      {pendingTarget &&
        (() => {
          const hiddenCard = pendingTarget.fromHiddenIndex !== undefined ? player.hiddenZone[pendingTarget.fromHiddenIndex] : undefined;
          const cardId = hiddenCard
            ? hiddenCard.cardId
            : pendingTarget.fromChampionZone
              ? player.championZone
              : player.hand[pendingTarget.handIndex ?? -1];
          const card = cardId ? getCard(cardId) : null;
          const info =
            card && cardId
              ? templatedTargetInfo(
                  card.templatedEffect?.trigger === "onPlay" ? card.templatedEffect.actions : undefined,
                  blankInstance(cardId, me!),
                  hiddenCard?.battlefieldIndex,
                )
              : null;
          return (
            <div className="rb-callout warn">
              <div className="rb-callout-title">Ziel wählen</div>
              {targetPicker(confirmTarget, {
                eligibleIds: info ? new Set(info.candidates.map((c) => c.instanceId)) : undefined,
                onSkip: info?.spec.optional ? () => confirmTarget() : undefined,
              })}
              <button className="cancel" onClick={() => setPendingTarget(null)}>
                Abbrechen
              </button>
            </div>
          );
        })()}

      {pendingManualPayment &&
        (() => {
          const cardId = player.hand[pendingManualPayment.handIndex];
          const card = getCard(cardId);
          const dummyInstance = blankInstance(cardId, me!);
          const required = computeRequiredCost(G, card, dummyInstance, pendingManualPayment.payAdditionalCost);
          const powerChosenByDomain = new Map<string, number>();
          for (const runeId of manualPowerRuneIds) {
            const rune = player.runePool.find((r) => r.instanceId === runeId);
            if (rune) powerChosenByDomain.set(rune.domain, (powerChosenByDomain.get(rune.domain) ?? 0) + 1);
          }
          const powerSatisfied = required.power.every((p) => (powerChosenByDomain.get(p.domain) ?? 0) >= p.amount);
          const powerOverfilled = required.power.some((p) => (powerChosenByDomain.get(p.domain) ?? 0) > p.amount);
          const energySatisfied = manualEnergyRuneIds.length === required.energy;
          const canConfirm = energySatisfied && powerSatisfied && !powerOverfilled;
          return (
            <div className="rb-callout warn">
              <div className="rb-callout-title">
                {card.name} manuell bezahlen — Energy {manualEnergyRuneIds.length}/{required.energy}
                {required.power.map((p) => (
                  <span key={p.domain}>
                    {" "}
                    · {p.domain} {powerChosenByDomain.get(p.domain) ?? 0}/{p.amount}
                  </span>
                ))}
              </div>
              <p className="rb-db-hint">
                Klicken schaltet je Rune durch: ungenutzt → Energy (exhausten) → Power (recyceln, verlässt den Pool
                für den Rest der Runde) → ungenutzt.
              </p>
              <div className="rb-callout-targets">
                {player.runePool.map((r) => {
                  const state = manualEnergyRuneIds.includes(r.instanceId)
                    ? "energy"
                    : manualPowerRuneIds.includes(r.instanceId)
                      ? "power"
                      : "unused";
                  return (
                    <button
                      key={r.instanceId}
                      className={`rb-rune-pick rb-rune-pick-${state}`}
                      onClick={() => toggleManualRune(r.instanceId, r.exhausted)}
                    >
                      {r.domain}
                      {r.exhausted ? " (ex)" : ""}
                      <br />
                      {state === "energy" ? "→ Energy" : state === "power" ? "→ Power" : ""}
                    </button>
                  );
                })}
              </div>
              <button disabled={!canConfirm} onClick={confirmManualPayment}>
                Bestätigen
              </button>
              <button className="cancel" style={{ marginLeft: 6 }} onClick={() => setPendingManualPayment(null)}>
                Abbrechen
              </button>
            </div>
          );
        })()}

      {G.pendingOptionalCost && G.pendingOptionalCost.playerId === me && (
        <div className="rb-callout optional">
          <div className="rb-callout-title">
            Optionale Kosten zahlen? ({G.pendingOptionalCost.cost.energy} Energy
            {G.pendingOptionalCost.cost.runeDomain ? ` + ${G.pendingOptionalCost.cost.runeDomain} Rune` : ""}
            {G.pendingOptionalCost.cost.exhaustSourceInstanceId ? " + Erschöpfen" : ""}
            {G.pendingOptionalCost.cost.discardCount ? ` + ${G.pendingOptionalCost.cost.discardCount} abwerfen` : ""})
          </div>
          <button onClick={payOptionalCost}>Bezahlen</button>
          <button className="cancel" style={{ marginLeft: 6 }} onClick={declineOptionalCost}>
            Ablehnen
          </button>
        </div>
      )}

      {pendingAbility &&
        (() => {
          const instance = G.instances[pendingAbility.instanceId];
          const card = getCard(instance.cardId);
          const info = templatedTargetInfo(card.activatedAbility?.actions, instance);
          return (
            <div className="rb-callout info">
              <div className="rb-callout-title">Ziel für Fähigkeit wählen</div>
              {targetPicker(confirmAbilityTarget, {
                eligibleIds: info ? new Set(info.candidates.map((c) => c.instanceId)) : undefined,
              })}
              <button className="cancel" onClick={() => setPendingAbility(null)}>
                Abbrechen
              </button>
            </div>
          );
        })()}

      {pendingEquip && (
        <div className="rb-callout equip">
          <div className="rb-callout-title">An welche Einheit anlegen?</div>
          <div className="rb-callout-targets">
            {Object.values(G.instances)
              .filter(
                (i) =>
                  i.controller === me &&
                  (i.zone === "base" || i.zone === "battlefield") &&
                  (getCard(i.cardId).type === "unit" || getCard(i.cardId).type === "champion"),
              )
              .map((i) => (
                <CardFace
                  key={i.instanceId}
                  card={getCard(i.cardId)}
                  instance={i}
                  size="sm"
                  onClick={() => confirmEquipTarget(i.instanceId)}
                  equippedGear={getEquippedGear(i)}
                />
              ))}
          </div>
          <button className="cancel" onClick={() => setPendingEquip(null)}>
            Abbrechen
          </button>
        </div>
      )}

      <div className="rb-battlefields">
        {G.battlefields.map((slot, idx) => {
          const controlClass =
            slot.controller === null ? "" : slot.controller === me ? " mine" : " theirs";
          const battlefieldDropId = `battlefield-${idx}`;
          const reviewHere = combatPendingReview?.battlefieldIndex === idx ? combatPendingReview : null;

          /** Renders `controller`'s side of this battlefield — the frozen combat snapshot (every
              participant as it was mid-fight, damage/death shown right on the card) while a review
              is pending here, otherwise the normal live board state. */
          function renderSide(controller: PlayerId) {
            if (reviewHere) {
              return reviewHere.hits
                .filter((h) => h.controller === controller)
                .map((hit) => {
                  const survivor = G.instances[hit.instanceId];
                  return (
                    <CardFace
                      key={hit.instanceId}
                      card={getCard(hit.cardId)}
                      instance={survivor}
                      size="sm"
                      equippedGear={survivor ? getEquippedGear(survivor) : undefined}
                      footer={
                        <span className={hit.died ? "rb-combat-hit-died" : "rb-combat-hit-damage"}>
                          {hit.died ? "☠ zerstört" : hit.damage > 0 ? `-${hit.damage}` : "unverletzt"}
                        </span>
                      }
                    />
                  );
                });
            }
            return slot.units[controller].map((id) => (
              <CardFace
                key={id}
                card={getCard(G.instances[id].cardId)}
                instance={G.instances[id]}
                size="sm"
                equippedGear={getEquippedGear(G.instances[id])}
              />
            ));
          }

          return (
            <div
              key={idx}
              className={`rb-battlefield rb-drop-zone${dragPayload?.type === "unit" && dropHoverId === battlefieldDropId ? " rb-drop-active" : ""}`}
              {...dropZone(battlefieldDropId, (p) => p.type === "unit")}
            >
              <div className="rb-battlefield-header">
                <CardFace card={getCard(slot.cardId)} size="sm" />
                <div className="rb-battlefield-header-text">
                  <span className="rb-battlefield-name">{getCard(slot.cardId).name}</span>
                  <span className={`rb-battlefield-control${controlClass}`}>
                    {slot.controller === null ? "frei" : slot.controller === me ? "du" : "Gegner"}
                  </span>
                </div>
              </div>

              <div className="rb-battlefield-side-label">Du</div>
              <div className="rb-battlefield-units">{renderSide(me)}</div>

              <div className="rb-battlefield-side-label">Gegner</div>
              <div className="rb-battlefield-units">{renderSide(opponentId)}</div>

              {reviewHere ? (
                <button className="rb-attack-here" onClick={() => setCombatReviewedSeq(reviewHere.seq)}>
                  Weiter
                </button>
              ) : (
                canAct &&
                attackMode &&
                attackMode.selected.size > 0 && (
                  <button className="rb-attack-here" onClick={() => launchAttack(idx)}>
                    Hierhin angreifen
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>

      {/* [Predict N] (rule 436): look at the top N cards of your own Main Deck — never hidden info
          from yourself — recycle any number of them (to the bottom, random order if 2+), and keep
          the rest on top in any order you like. Click a card to keep it (in click order); anything
          left unclicked when you confirm gets recycled. */}
      {player.pendingPredict > 0 &&
        (() => {
          const top = player.mainDeck.slice(0, player.pendingPredict);
          const keepOrder = predictKeepOrder.filter((p) => p < top.length);
          function togglePredictCard(position: number) {
            setPredictKeepOrder((prev) =>
              prev.includes(position) ? prev.filter((p) => p !== position) : [...prev, position],
            );
          }
          return (
            <div className="rb-callout warn">
              <div className="rb-callout-title">
                Predict {top.length > 1 ? top.length : ""} — oberste {top.length === 1 ? "Karte" : `${top.length} Karten`} deines
                Decks. Anklicken = oben behalten (in Klickreihenfolge), Rest wird recycelt.
              </div>
              <div className="rb-row">
                {top.map((cardId, position) => {
                  const keepIndex = keepOrder.indexOf(position);
                  return (
                    <CardFace
                      key={position}
                      card={getCard(cardId)}
                      size="sm"
                      selected={keepIndex !== -1}
                      onClick={() => togglePredictCard(position)}
                      footer={keepIndex !== -1 ? <span>#{keepIndex + 1}</span> : <span>recycelt</span>}
                    />
                  );
                })}
              </div>
              <button
                onClick={() => {
                  const recyclePositions = top.map((_, position) => position).filter((position) => !keepOrder.includes(position));
                  moves.resolvePredict({ recyclePositions, keepOrder });
                  setPredictKeepOrder([]);
                }}
              >
                Bestätigen
              </button>
            </div>
          );
        })()}

        {/* Own side — mirrors the opponent strip above: a boxed "mat" (Base / Rune Deck+Runes /
            Legend+Champion / Deck / Hidden / Trash) beside the Hand, which gets the remaining
            width (see .rb-hud and .rb-mat in cards.css). */}
        <div className="rb-hud-side">
          <div className="rb-hud-row">
            <div className="rb-mat">
              <div className="rb-mat-wide">
                <div className="rb-mat-zone rb-mat-zone-base">
                  <div
                    className={`rb-row rb-hud-scroll-row rb-drop-zone rb-base-drop-zone${dragPayload?.type === "handCard" && dropHoverId === "base" ? " rb-drop-active" : ""}`}
                    {...dropZone("base", (p) => p.type === "handCard")}
                  >
                    {player.base.map((id) => {
          const instance = G.instances[id];
          const card = getCard(instance.cardId);
          const isUnit = card.type === "unit" || card.type === "champion";
          const ability = abilityCostFor(card, instance);
          const canActivate = ability && (!ability.exhaustSelf || !instance.exhausted);
          const empowerCost = SpecialCaseEngine.empowerCost(G, card, instance);
          const canEmpower = empowerCost && !instance.statuses.everEmpowered && (!empowerCost.exhaustSelf || !instance.exhausted);
          const canDragAttack = canAct && isUnit && !instance.exhausted;
          return (
            <CardFace
              key={id}
              card={card}
              instance={instance}
              size="sm"
              equippedGear={getEquippedGear(instance)}
              selected={isUnit ? attackMode?.selected.has(id) : undefined}
              onClick={canAct && isUnit && !instance.exhausted ? () => toggleAttacker(id) : undefined}
              frame={simpleMode && isUnit ? (instance.exhausted ? "blocked" : "ok") : undefined}
              draggable={canDragAttack || Boolean(canAct && card.equipCost)}
              dragging={
                (dragPayload?.type === "unit" && dragPayload.instanceId === id) ||
                (dragPayload?.type === "gear" && dragPayload.gearInstanceId === id)
              }
              onDragStart={
                canDragAttack
                  ? dragStart({ type: "unit", instanceId: id })
                  : canAct && card.equipCost
                    ? dragStart({ type: "gear", gearInstanceId: id })
                    : undefined
              }
              onDragEnd={dragEnd}
              dropActive={isUnit && dropHoverId === id}
              {...(isUnit ? dropZone(id, (p) => p.type === "gear") : {})}
              footer={
                canAct && (card.equipCost || canActivate || canEmpower) ? (
                  <>
                    {card.equipCost && (
                      <button onClick={() => startEquip(id)}>
                        Anlegen E{card.equipCost.energy}
                        {card.equipCost.runeDomain ? `+${card.equipCost.runeDomain}` : ""}
                      </button>
                    )}
                    {canActivate && (
                      <button onClick={() => activateAbilityAuto(id)}>Aktivieren E{ability!.energy}</button>
                    )}
                    {canEmpower && (
                      <button onClick={() => empowerAuto(id)}>
                        Empower E{empowerCost!.energy}
                        {empowerCost!.runeDomain ? `+${empowerCost!.runeDomain}` : ""}
                      </button>
                    )}
                  </>
                ) : undefined
              }
            />
          );
        })}
                  </div>
                  <div className="rb-mat-zone-label">
                    Base <span className="rb-count">{player.base.length}</span>
                  </div>
                </div>

                <div className="rb-mat-row">
                  {/* Main Deck sits face-down — only its SIZE is public info (see
                      PlayerState.mainDeck). One card-back stands in for the whole pile. */}
                  <div className="rb-mat-zone rb-mat-zone-runedeck">
                    <div className="rb-row">
                      {player.runeDeck.length > 0 && <div className="rb-card-back rb-deck-pile" title={`${player.runeDeck.length} Runen`} />}
                    </div>
                    <div className="rb-mat-zone-label">
                      Runendeck <span className="rb-count">{player.runeDeck.length}</span>
                    </div>
                  </div>
                  <div className="rb-mat-zone rb-mat-zone-runepool">
                    <div className="rb-rune-strip">
                      {player.runePool.map((r) => (
                        <div key={r.instanceId} className="rb-rune-slot" title={`${r.domain} Rune${r.exhausted ? " (exhausted)" : ""}`}>
                          <CardFace card={getRuneCardForDomain(r.domain)} size="sm" rotated={r.exhausted} />
                        </div>
                      ))}
                    </div>
                    <div className="rb-mat-zone-label">
                      Runen <span className="rb-count">{player.runePool.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rb-mat-narrow">
                <div className="rb-mat-row">
                  <div className="rb-mat-zone rb-mat-zone-legend">
                    {player.legend && <CardFace card={getCard(player.legend.cardId)} size="sm" />}
                    <div className="rb-mat-zone-label">Legend</div>
                  </div>
                  <div className="rb-mat-zone rb-mat-zone-champion">
                    {championCard && (
                      <CardFace
                        card={championCard}
                        size="sm"
                        frame={simpleMode ? (championCanAfford ? "ok" : "blocked") : undefined}
                        footer={
                          canAct ? (
                            <>
                              <button onClick={() => playChampionAuto(false)}>Spielen</button>
                              {championAmbushBattlefields.map((index) => (
                                <button key={index} onClick={() => playChampionAuto(false, index)}>
                                  Zu Battlefield {index + 1}
                                </button>
                              ))}
                            </>
                          ) : undefined
                        }
                      />
                    )}
                    <div className="rb-mat-zone-label">Champion</div>
                  </div>
                </div>

                <div className="rb-mat-zone rb-mat-zone-deck">
                  <div className="rb-row">
                    {player.mainDeck.length > 0 && <div className="rb-card-back rb-deck-pile" title={`${player.mainDeck.length} Karten`} />}
                  </div>
                  <div className="rb-mat-zone-label">
                    Deck <span className="rb-count">{player.mainDeck.length}</span>
                  </div>
                </div>

                {player.hiddenZone.length > 0 && (
                  <div className="rb-mat-zone rb-mat-zone-hidden">
                    <div className="rb-row rb-hud-scroll-row">
                      {player.hiddenZone.map((hidden, idx) => {
                        const card = getCard(hidden.cardId);
                        // Rule 811.1.b: playable no earlier than the turn AFTER it was hidden.
                        const eligible = ctx.turn > hidden.hiddenOnGameTurn;
                        return (
                          <CardFace
                            key={idx}
                            card={card}
                            size="sm"
                            footer={
                              canAct ? (
                                eligible ? (
                                  <button onClick={() => playFromHiddenAuto(idx)}>
                                    Aufdecken (kostenlos) → Battlefield {hidden.battlefieldIndex + 1}
                                  </button>
                                ) : (
                                  <span>Ab nächstem Zug spielbar (Battlefield {hidden.battlefieldIndex + 1})</span>
                                )
                              ) : undefined
                            }
                          />
                        );
                      })}
                    </div>
                    <div className="rb-mat-zone-label">
                      Verdeckt <span className="rb-count">{player.hiddenZone.length}</span>
                    </div>
                  </div>
                )}

                {player.trash.length > 0 && (
                  <div className="rb-mat-zone rb-mat-zone-trash">
                    <div className="rb-row rb-hud-scroll-row">
                      {player.trash
                        .map((cardId, trashIndex) => ({ cardId, trashIndex }))
                        .reverse()
                        .map(({ cardId, trashIndex }) => {
                          const card = getCard(cardId);
                          return (
                            <CardFace
                              key={trashIndex}
                              card={card}
                              size="sm"
                              footer={
                                canAct && card.flowCost ? (
                                  <button onClick={() => playFromTrashAuto(trashIndex)}>
                                    +Flow ({Math.max(0, card.flowCost.energy - SpecialCaseEngine.flowEnergyReductionForController(G, getCard, me!, card.flowCost.energy))}E
                                    {card.flowCost.runeDomain ? `+${card.flowCost.runeDomainCount > 1 ? card.flowCost.runeDomainCount : ""}${card.flowCost.runeDomain}` : ""}
                                    {card.flowCost.anyDomainRuneCount > 0 ? `+${card.flowCost.anyDomainRuneCount}Rune` : ""})
                                  </button>
                                ) : undefined
                              }
                            />
                          );
                        })}
                    </div>
                    <div className="rb-mat-zone-label">
                      Trash <span className="rb-count">{player.trash.length}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rb-hud-hand">
              <div className="rb-section-label">
                Hand <span className="rb-count">{player.hand.length}</span>
              </div>
              <div className="rb-hand-strip">
                {player.hand.map((cardId, idx) => {
          const card = getCard(cardId);
          const hasAccelerate = KeywordEngine.hasKeyword(card, "accelerate");
          const hasHidden = KeywordEngine.hasKeyword(card, "hidden");
          const discardCostConfig = SpecialCaseEngine.additionalCostDiscardForReduction(card);
          const dummyInstance = blankInstance(cardId, me!);
          const bonusEffectEnergy = SpecialCaseEngine.additionalPlayCostEnergy(G, card, dummyInstance);
          const canAfford = computeAutoPayment(G, card, dummyInstance, player.runePool, false) !== null;
          const isChampion = card.type === "champion";
          const ambushBattlefields = eligibleAmbushBattlefields(G, card, dummyInstance);
          return (
            <CardFace
              key={idx}
              card={card}
              frame={simpleMode ? (canAfford ? "ok" : "blocked") : undefined}
              draggable={canAct}
              dragging={dragPayload?.type === "handCard" && dragPayload.handIndex === idx}
              onDragStart={canAct ? dragStart({ type: "handCard", handIndex: idx }) : undefined}
              onDragEnd={dragEnd}
              wrapperStyle={handFanStyle(idx, player.hand.length, hoveredHandIndex)}
              onMouseEnter={() => setHoveredHandIndex(idx)}
              onMouseLeave={() => setHoveredHandIndex((current) => (current === idx ? null : current))}
              footer={
                canAct ? (
                  <>
                    <button onClick={() => playCardAuto(idx, false)}>Spielen</button>
                    <button onClick={() => startManualPayment(idx, false)}>Manuell zahlen</button>
                    {hasAccelerate && <button onClick={() => playCardAuto(idx, true)}>+Accelerate</button>}
                    {discardCostConfig && (
                      <button onClick={() => playCardAuto(idx, true)}>
                        Discard {discardCostConfig.discardCount} (-{discardCostConfig.energyReduction}E)
                      </button>
                    )}
                    {bonusEffectEnergy !== undefined && (
                      <button onClick={() => playCardAuto(idx, true)}>+{bonusEffectEnergy}E Bonus</button>
                    )}
                    {card.type === "spell" && card.repeatCost && (
                      <button onClick={() => playCardAutoWithRepeat(idx)}>
                        +Repeat (
                        {Math.max(0, card.repeatCost.energy - SpecialCaseEngine.repeatEnergyReductionFromControlledBattlefields(G, getCard, me!))}E
                        {card.repeatCost.runeDomain ? `+${card.repeatCost.runeDomain}` : ""})
                      </button>
                    )}
                    {ambushBattlefields.map((index) => (
                      <button key={index} onClick={() => playCardAuto(idx, false, index)}>
                        {isChampion ? "Zu" : "Ambush →"} Battlefield {index + 1}
                      </button>
                    ))}
                    {hasHidden &&
                      player.runePool.length > 0 &&
                      eligibleHideBattlefields().map((index) => (
                        <button key={index} onClick={() => hideCardAuto(idx, index)}>
                          Verdeckt spielen (1 Rune) → Battlefield {index + 1}
                        </button>
                      ))}
                  </>
                ) : undefined
              }
            />
          );
        })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {canAct && (
        <button className="rb-end-turn" onClick={() => moves.endTurn()}>
          Zug beenden
        </button>
      )}
    </div>
  );
}
