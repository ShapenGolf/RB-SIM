import { useState } from "react";
import type { BoardProps } from "boardgame.io/react";
import type { GameState, PlayerId, CardInstance } from "../game/state";
import { getCard } from "../cards/db";
import { computeAutoPayment } from "../ui/autoPay";
import { KeywordEngine } from "../keywords/registry";
import { templatedEffectNeedsPlayTarget } from "../cards/templatedEffects";

const SPECIAL_CASES_NEEDING_TARGET = new Set(["stunning-blow", "dangerous-duo"]);

function keywordSummary(cardId: string): string {
  const card = getCard(cardId);
  if (card.keywords.length === 0) return "";
  return card.keywords.map((k) => (k.value !== undefined ? `${k.keyword} ${k.value}` : k.keyword)).join(", ");
}

function InstanceChip({
  instance,
  onClick,
  selected,
}: {
  instance: CardInstance;
  onClick?: () => void;
  selected?: boolean;
}) {
  const card = getCard(instance.cardId);
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{
        border: selected ? "2px solid #4ade80" : "1px solid #555",
        borderRadius: 6,
        padding: "4px 8px",
        margin: 2,
        background: instance.exhausted ? "#2a2a2a" : "#1f2937",
        color: "#eee",
        cursor: onClick ? "pointer" : "default",
        opacity: instance.statuses.stunned ? 0.5 : 1,
        fontSize: 12,
      }}
      title={card.text}
    >
      {card.name}
      {card.might !== null ? ` (${card.might + instance.tempMightBonus}M)` : ""}
      {instance.exhausted ? " ⟳" : ""}
      {instance.statuses.stunned ? " 💫" : ""}
    </button>
  );
}

export function Board({ G, ctx, moves, playerID, isActive }: BoardProps<GameState>) {
  const [attackMode, setAttackMode] = useState<{ selected: Set<string> } | null>(null);
  const [pendingTarget, setPendingTarget] = useState<{
    handIndex: number;
    payAdditionalCost: boolean;
  } | null>(null);

  const me = playerID as PlayerId | null;
  const canAct = isActive && me !== null && ctx.currentPlayer === me;

  if (ctx.gameover) {
    return <div style={{ padding: 24 }}>Spiel vorbei — Sieger: Spieler {ctx.gameover.winner}</div>;
  }
  if (!me) return <div>Kein Spieler zugewiesen.</div>;

  const player = G.players[me];
  const opponentId: PlayerId = me === "0" ? "1" : "0";

  function playCardAuto(handIndex: number, payAdditionalCost: boolean) {
    const cardId = player.hand[handIndex];
    const card = getCard(cardId);
    const dummyInstance: CardInstance = {
      instanceId: "preview",
      cardId,
      controller: me!,
      zone: "base",
      battlefieldIndex: null,
      damage: 0,
      exhausted: false,
      statuses: {},
      xp: 0,
      tempMightBonus: 0,
    };
    const payment = computeAutoPayment(G, card, dummyInstance, player.runePool, payAdditionalCost);
    if (!payment) {
      window.alert("Nicht genug Runen, um diese Karte zu bezahlen.");
      return;
    }
    if (
      (card.specialCaseId && SPECIAL_CASES_NEEDING_TARGET.has(card.specialCaseId)) ||
      templatedEffectNeedsPlayTarget(card.templatedEffect)
    ) {
      setPendingTarget({ handIndex, payAdditionalCost });
      return;
    }
    moves.playCard({
      handIndex,
      energyRuneIds: payment.energyRuneIds,
      powerRuneIds: payment.powerRuneIds,
      payAdditionalCost,
    });
  }

  function confirmTarget(targetInstanceId: string) {
    if (!pendingTarget) return;
    const cardId = player.hand[pendingTarget.handIndex];
    const card = getCard(cardId);
    const dummyInstance: CardInstance = {
      instanceId: "preview",
      cardId,
      controller: me!,
      zone: "base",
      battlefieldIndex: null,
      damage: 0,
      exhausted: false,
      statuses: {},
      xp: 0,
      tempMightBonus: 0,
    };
    const payment = computeAutoPayment(G, card, dummyInstance, player.runePool, pendingTarget.payAdditionalCost);
    if (!payment) return;
    moves.playCard({
      handIndex: pendingTarget.handIndex,
      energyRuneIds: payment.energyRuneIds,
      powerRuneIds: payment.powerRuneIds,
      payAdditionalCost: pendingTarget.payAdditionalCost,
      targetInstanceId,
    });
    setPendingTarget(null);
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

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: "#eee", background: "#111", padding: 16, minHeight: "100%" }}>
      <h2 style={{ margin: 0 }}>Spieler {me} {canAct ? "(am Zug)" : "(wartet)"}</h2>
      <p style={{ opacity: 0.7, margin: "4px 0" }}>
        Zug {ctx.turn} · Phase: {G.turnPhase} · Punkte: Du {player.points} — Gegner {G.players[opponentId].points} ·
        XP: {player.xp}
      </p>

      <section>
        <h3>Rune Pool</h3>
        {player.runePool.map((r) => (
          <span
            key={r.instanceId}
            style={{
              display: "inline-block",
              margin: 2,
              padding: "2px 6px",
              borderRadius: 4,
              fontSize: 11,
              background: r.exhausted ? "#333" : "#374151",
              border: "1px solid #555",
            }}
          >
            {r.domain}{r.exhausted ? " (ex)" : ""}
          </span>
        ))}
      </section>

      <section>
        <h3>Hand ({player.hand.length})</h3>
        {player.hand.map((cardId, idx) => {
          const card = getCard(cardId);
          const hasAccelerate = KeywordEngine.hasKeyword(card, "accelerate");
          return (
            <div key={idx} style={{ border: "1px solid #444", borderRadius: 6, padding: 6, margin: "4px 0" }}>
              <strong>{card.name}</strong>{" "}
              <span style={{ opacity: 0.6, fontSize: 12 }}>
                [{card.type}] E{card.energyCost ?? "-"} {card.powerCost.map((p) => `${p.domain[0]}${p.amount}`).join(" ")}
                {card.might !== null ? ` · ${card.might}M` : ""}
              </span>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{keywordSummary(cardId) || card.text}</div>
              {canAct && (
                <div style={{ marginTop: 4 }}>
                  <button onClick={() => playCardAuto(idx, false)}>Spielen</button>
                  {hasAccelerate && (
                    <button style={{ marginLeft: 6 }} onClick={() => playCardAuto(idx, true)}>
                      Spielen (+Accelerate)
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {pendingTarget && (
        <section style={{ border: "2px solid #fbbf24", padding: 8, margin: "8px 0" }}>
          <strong>Ziel wählen:</strong>
          <div>
            {Object.values(G.instances)
              .filter((i) => i.zone === "base" || i.zone === "battlefield")
              .map((i) => (
                <InstanceChip key={i.instanceId} instance={i} onClick={() => confirmTarget(i.instanceId)} />
              ))}
          </div>
          <button onClick={() => setPendingTarget(null)}>Abbrechen</button>
        </section>
      )}

      <section>
        <h3>Base</h3>
        {player.base.map((id) => {
          const instance = G.instances[id];
          const card = getCard(instance.cardId);
          if (card.type !== "unit" && card.type !== "champion") {
            return <InstanceChip key={id} instance={instance} />;
          }
          return (
            <InstanceChip
              key={id}
              instance={instance}
              selected={attackMode?.selected.has(id)}
              onClick={canAct && !instance.exhausted ? () => toggleAttacker(id) : undefined}
            />
          );
        })}
      </section>

      <section>
        <h3>Battlefields</h3>
        <div style={{ display: "flex", gap: 16 }}>
          {G.battlefields.map((slot, idx) => (
            <div key={idx} style={{ border: "1px solid #444", borderRadius: 6, padding: 8, flex: 1 }}>
              <div>
                <strong>{getCard(slot.cardId).name}</strong> — Kontrolle:{" "}
                {slot.controller === null ? "niemand" : `Spieler ${slot.controller}`}
              </div>
              <div>Du: {slot.units[me].map((id) => <InstanceChip key={id} instance={G.instances[id]} />)}</div>
              <div>
                Gegner:{" "}
                {slot.units[opponentId].map((id) => <InstanceChip key={id} instance={G.instances[id]} />)}
              </div>
              {canAct && attackMode && attackMode.selected.size > 0 && (
                <button onClick={() => launchAttack(idx)}>Hierhin angreifen</button>
              )}
            </div>
          ))}
        </div>
      </section>

      {canAct && (
        <section style={{ marginTop: 12 }}>
          <button onClick={() => moves.endTurn()}>Zug beenden</button>
        </section>
      )}
    </div>
  );
}
