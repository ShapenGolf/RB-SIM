import { useState } from "react";
import type { BoardProps } from "boardgame.io/react";
import type { GameState, PlayerId, CardInstance } from "../game/state";
import { getCard } from "../cards/db";
import { computeAutoPayment } from "../ui/autoPay";
import { KeywordEngine } from "../keywords/registry";
import { templatedEffectNeedsPlayTarget, activatedAbilityNeedsTarget } from "../cards/templatedEffects";
import { specialCaseNeedsPlayTarget, SpecialCaseEngine } from "../cards/special-cases/registry";
import { CardFace } from "./CardFace";
import "./cards.css";

function blankInstance(cardId: string, controller: PlayerId): CardInstance {
  return {
    instanceId: "preview",
    cardId,
    controller,
    zone: "base",
    battlefieldIndex: null,
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

export function Board({ G, ctx, moves, playerID, isActive }: BoardProps<GameState>) {
  const [attackMode, setAttackMode] = useState<{ selected: Set<string> } | null>(null);
  const [pendingTarget, setPendingTarget] = useState<{
    handIndex: number;
    payAdditionalCost: boolean;
    ambushBattlefieldIndex?: number;
  } | null>(null);
  const [pendingAbility, setPendingAbility] = useState<{ instanceId: string } | null>(null);
  const [pendingEquip, setPendingEquip] = useState<{ gearInstanceId: string } | null>(null);

  const me = playerID as PlayerId | null;
  const canAct = isActive && me !== null && ctx.currentPlayer === me;

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

  function playCardAuto(handIndex: number, payAdditionalCost: boolean, ambushBattlefieldIndex?: number) {
    const cardId = player.hand[handIndex];
    const card = getCard(cardId);
    const dummyInstance = blankInstance(cardId, me!);
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

  function confirmTarget(targetInstanceId: string) {
    if (!pendingTarget) return;
    const cardId = player.hand[pendingTarget.handIndex];
    const card = getCard(cardId);
    const dummyInstance = blankInstance(cardId, me!);
    const payment = computeAutoPayment(G, card, dummyInstance, player.runePool, pendingTarget.payAdditionalCost);
    if (!payment) return;
    moves.playCard({
      handIndex: pendingTarget.handIndex,
      energyRuneIds: payment.energyRuneIds,
      powerRuneIds: payment.powerRuneIds,
      payAdditionalCost: pendingTarget.payAdditionalCost,
      targetInstanceId,
      ambushBattlefieldIndex: pendingTarget.ambushBattlefieldIndex,
    });
    setPendingTarget(null);
  }

  function abilityCostFor(card: ReturnType<typeof getCard>) {
    return card.activatedAbility?.cost ?? SpecialCaseEngine.activatedAbilityCost(card);
  }

  function abilityNeedsTargetFor(card: ReturnType<typeof getCard>) {
    return card.activatedAbility
      ? activatedAbilityNeedsTarget(card.activatedAbility)
      : SpecialCaseEngine.activateNeedsTarget(card);
  }

  function computeAbilityPayment(cost: NonNullable<ReturnType<typeof abilityCostFor>>) {
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
    const cost = abilityCostFor(card);
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

  function confirmAbilityTarget(targetInstanceId: string) {
    if (!pendingAbility) return;
    const instance = G.instances[pendingAbility.instanceId];
    const card = getCard(instance.cardId);
    const cost = abilityCostFor(card);
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

  function confirmEquipTarget(targetInstanceId: string) {
    if (!pendingEquip) return;
    const gear = G.instances[pendingEquip.gearInstanceId];
    const cost = getCard(gear.cardId).equipCost;
    if (!cost) return;
    const payment = computeEquipPayment(cost);
    if (!payment) return;
    moves.equipGear({
      gearInstanceId: pendingEquip.gearInstanceId,
      targetInstanceId,
      ...payment,
    });
    setPendingEquip(null);
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

  function targetPicker(onPick: (id: string) => void) {
    return (
      <div className="rb-callout-targets">
        {Object.values(G.instances)
          .filter((i) => i.zone === "base" || i.zone === "battlefield")
          .map((i) => (
            <CardFace key={i.instanceId} card={getCard(i.cardId)} instance={i} size="sm" onClick={() => onPick(i.instanceId)} />
          ))}
      </div>
    );
  }

  const opponent = G.players[opponentId];

  return (
    <div className="rb-board">
      <div className="rb-topbar">
        <div>
          <h2>Spieler {me}</h2>
          <div className="rb-status">
            Zug {ctx.turn} · Phase: {G.turnPhase}
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
      </div>

      {/* Opponent sits across the table: their hand (face down, count only) and base up top. */}
      <div className="rb-opponent-zone">
        <div className="rb-section-label">
          Gegner-Hand <span className="rb-count">{opponent.hand.length}</span>
        </div>
        <div className="rb-row">
          {opponent.hand.map((_, i) => (
            <div key={i} className="rb-card-back" />
          ))}
        </div>

        <div className="rb-section-label">
          Gegner-Base <span className="rb-count">{opponent.base.length}</span>
        </div>
        <div className="rb-row">
          {opponent.base.map((id) => (
            <CardFace key={id} card={getCard(G.instances[id].cardId)} instance={G.instances[id]} size="sm" />
          ))}
        </div>
      </div>

      <div className="rb-table-divider">Battlefields</div>

      {pendingTarget && (
        <div className="rb-callout warn">
          <div className="rb-callout-title">Ziel wählen</div>
          {targetPicker(confirmTarget)}
          <button className="cancel" onClick={() => setPendingTarget(null)}>
            Abbrechen
          </button>
        </div>
      )}

      {G.pendingOptionalCost && G.pendingOptionalCost.playerId === me && (
        <div className="rb-callout optional">
          <div className="rb-callout-title">
            Optionale Kosten zahlen? ({G.pendingOptionalCost.cost.energy} Energy
            {G.pendingOptionalCost.cost.runeDomain ? ` + ${G.pendingOptionalCost.cost.runeDomain} Rune` : ""})
          </div>
          <button onClick={payOptionalCost}>Bezahlen</button>
          <button className="cancel" style={{ marginLeft: 6 }} onClick={declineOptionalCost}>
            Ablehnen
          </button>
        </div>
      )}

      {pendingAbility && (
        <div className="rb-callout info">
          <div className="rb-callout-title">Ziel für Fähigkeit wählen</div>
          {targetPicker(confirmAbilityTarget)}
          <button className="cancel" onClick={() => setPendingAbility(null)}>
            Abbrechen
          </button>
        </div>
      )}

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
          return (
            <div key={idx} className="rb-battlefield">
              <div className="rb-battlefield-header">
                <span className="rb-battlefield-name">{getCard(slot.cardId).name}</span>
                <span className={`rb-battlefield-control${controlClass}`}>
                  {slot.controller === null ? "frei" : slot.controller === me ? "du" : "Gegner"}
                </span>
              </div>

              <div className="rb-battlefield-side-label">Du</div>
              <div className="rb-battlefield-units">
                {slot.units[me].map((id) => (
                  <CardFace key={id} card={getCard(G.instances[id].cardId)} instance={G.instances[id]} size="sm" />
                ))}
              </div>

              <div className="rb-battlefield-side-label">Gegner</div>
              <div className="rb-battlefield-units">
                {slot.units[opponentId].map((id) => (
                  <CardFace key={id} card={getCard(G.instances[id].cardId)} instance={G.instances[id]} size="sm" />
                ))}
              </div>

              {canAct && attackMode && attackMode.selected.size > 0 && (
                <button className="rb-attack-here" onClick={() => launchAttack(idx)}>
                  Hierhin angreifen
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="rb-table-divider">Deine Seite</div>

      <div className="rb-section-label">
        Rune Pool <span className="rb-count">{player.runePool.length}</span>
      </div>
      <div className="rb-rune-strip">
        {player.runePool.map((r) => (
          <span key={r.instanceId} className={`rb-rune${r.exhausted ? "" : " ready"}`}>
            {r.domain}
            {r.exhausted ? " · ex" : ""}
          </span>
        ))}
      </div>

      <div className="rb-section-label">
        Base <span className="rb-count">{player.base.length}</span>
      </div>
      <div className="rb-row">
        {player.base.map((id) => {
          const instance = G.instances[id];
          const card = getCard(instance.cardId);
          const isUnit = card.type === "unit" || card.type === "champion";
          const ability = abilityCostFor(card);
          const canActivate = ability && (!ability.exhaustSelf || !instance.exhausted);
          return (
            <CardFace
              key={id}
              card={card}
              instance={instance}
              size="sm"
              selected={isUnit ? attackMode?.selected.has(id) : undefined}
              onClick={canAct && isUnit && !instance.exhausted ? () => toggleAttacker(id) : undefined}
              footer={
                canAct && (card.equipCost || canActivate) ? (
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
                  </>
                ) : undefined
              }
            />
          );
        })}
      </div>

      <div className="rb-section-label">
        Hand <span className="rb-count">{player.hand.length}</span>
      </div>
      <div className="rb-hand-strip">
        {player.hand.map((cardId, idx) => {
          const card = getCard(cardId);
          const hasAccelerate = KeywordEngine.hasKeyword(card, "accelerate");
          const discardCostConfig = SpecialCaseEngine.additionalCostDiscardForReduction(card);
          const dummyInstance = blankInstance(cardId, me!);
          const bonusEffectEnergy = SpecialCaseEngine.additionalPlayCostEnergy(G, card, dummyInstance);
          const isChampion = card.type === "champion";
          const ambushBattlefields = isChampion
            ? G.battlefields.map((_slot, i) => ({ index: i }))
            : card.type === "unit"
              ? G.battlefields
                  .map((slot, i) => ({
                    index: i,
                    ownOccupied: slot.units[me].length > 0,
                    enemyOccupied: slot.units[opponentId].length > 0,
                  }))
                  .filter(
                    (b) =>
                      (b.ownOccupied && KeywordEngine.hasKeyword(card, "ambush")) ||
                      (b.enemyOccupied &&
                        SpecialCaseEngine.allowsPlayToEnemyOccupiedBattlefield(G, card, dummyInstance)) ||
                      (!b.ownOccupied &&
                        !b.enemyOccupied &&
                        (SpecialCaseEngine.allowsPlayToOpenBattlefield(G, card, dummyInstance) ||
                          SpecialCaseEngine.othersCanPlayToOpenBattlefield(G, getCard, dummyInstance))),
                  )
              : [];
          return (
            <CardFace
              key={idx}
              card={card}
              footer={
                canAct ? (
                  <>
                    <button onClick={() => playCardAuto(idx, false)}>Spielen</button>
                    {hasAccelerate && <button onClick={() => playCardAuto(idx, true)}>+Accelerate</button>}
                    {discardCostConfig && (
                      <button onClick={() => playCardAuto(idx, true)}>
                        Discard {discardCostConfig.discardCount} (-{discardCostConfig.energyReduction}E)
                      </button>
                    )}
                    {bonusEffectEnergy !== undefined && (
                      <button onClick={() => playCardAuto(idx, true)}>+{bonusEffectEnergy}E Bonus</button>
                    )}
                    {ambushBattlefields.map((b) => (
                      <button key={b.index} onClick={() => playCardAuto(idx, false, b.index)}>
                        {isChampion ? "Zu" : "Ambush →"} Battlefield {b.index + 1}
                      </button>
                    ))}
                  </>
                ) : undefined
              }
            />
          );
        })}
      </div>

      {canAct && (
        <button className="rb-end-turn" onClick={() => moves.endTurn()}>
          Zug beenden
        </button>
      )}
    </div>
  );
}
