import type { ReactNode } from "react";
import type { Card, Domain } from "../cards/types";
import type { CardInstance } from "../game/state";

const DOMAIN_VAR: Record<Domain, string> = {
  Fury: "fury",
  Calm: "calm",
  Mind: "mind",
  Body: "body",
  Order: "order",
  Chaos: "chaos",
  Colorless: "colorless",
};

const RARITY_VAR: Record<string, string> = {
  common: "common",
  uncommon: "uncommon",
  rare: "rare",
  epic: "epic",
  showcase: "showcase",
};

/** Wraps [Bracketed] keyword tags in the rules text so they stand out, same convention as the printed cards. */
function renderRulesText(text: string) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((part, i) =>
    part.startsWith("[") && part.endsWith("]") ? (
      <b className="rb-kw" key={i}>
        {part}
      </b>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function CardFace({
  card,
  instance,
  size = "md",
  selected,
  onClick,
  footer,
}: {
  card: Card;
  instance?: CardInstance;
  size?: "sm" | "md";
  selected?: boolean;
  onClick?: () => void;
  footer?: ReactNode;
}) {
  const domainKey = DOMAIN_VAR[card.domains[0]] ?? "colorless";
  const rarityKey = card.rarity ? (RARITY_VAR[card.rarity] ?? "common") : "common";
  const might = card.might !== null ? card.might + (instance?.tempMightBonus ?? 0) : null;
  const buffed = Boolean(instance?.statuses.buffed) || (instance?.tempMightBonus ?? 0) > 0;

  const classes = [
    "rb-card",
    size === "sm" ? "rb-card-sm" : "",
    onClick ? "rb-clickable" : "",
    selected ? "rb-selected" : "",
    instance?.exhausted ? "rb-exhausted" : "",
    instance?.statuses.stunned ? "rb-stunned" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      style={
        {
          "--dom": `var(--domain-${domainKey})`,
          "--dom-dark": `var(--domain-${domainKey}-dark)`,
          "--rarity-color": `var(--rarity-${rarityKey})`,
        } as React.CSSProperties
      }
      onClick={onClick}
      title={card.text}
    >
      <div className="rb-card-rarity-dot" />
      {card.energyCost !== null && <div className="rb-card-cost">{card.energyCost}</div>}
      {card.powerCost.length > 0 && (
        <div className="rb-card-power">
          {card.powerCost.flatMap((p, pi) =>
            Array.from({ length: p.amount }, (_, i) => (
              <span
                key={`${pi}-${i}`}
                className="rb-card-power-pip"
                style={{ background: `var(--domain-${DOMAIN_VAR[p.domain] ?? "colorless"})` }}
              />
            )),
          )}
        </div>
      )}

      <div
        className="rb-card-art"
        style={card.imageUrl ? { backgroundImage: `url(${card.imageUrl})` } : undefined}
      >
        {!card.imageUrl && <div className="rb-card-art-placeholder">{card.name}</div>}
      </div>

      <div className="rb-card-body">
        <p className="rb-card-name">{card.name}</p>
        <p className="rb-card-type">
          {card.type}
          {card.tags && card.tags.length > 0 ? ` · ${card.tags.join(", ")}` : ""}
        </p>
        {size === "md" && card.text && <div className="rb-card-text">{renderRulesText(card.text)}</div>}
      </div>

      {might !== null && <div className={`rb-card-might${buffed ? " buffed" : ""}`}>{might}</div>}

      {instance && (instance.exhausted || instance.statuses.stunned || instance.equipment.length > 0) && (
        <div className="rb-card-badges">
          {instance.exhausted && <span className="rb-badge" title="Exhausted">⟳</span>}
          {instance.statuses.stunned && <span className="rb-badge" title="Stunned">💫</span>}
          {instance.equipment.length > 0 && (
            <span className="rb-badge" title={`${instance.equipment.length} Equipment`}>
              🗡{instance.equipment.length}
            </span>
          )}
        </div>
      )}

      {footer && <div className="rb-card-footer">{footer}</div>}
    </div>
  );
}
