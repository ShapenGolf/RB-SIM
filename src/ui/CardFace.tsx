import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
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

export function CardFace({
  card,
  instance,
  size = "md",
  selected,
  onClick,
  footer,
  frame,
  rotated,
  draggable,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  dropActive,
  dragging,
  equippedGear,
  wrapperStyle,
  cardStyle,
  onMouseEnter,
  onMouseLeave,
}: {
  card: Card;
  instance?: CardInstance;
  size?: "sm" | "md";
  selected?: boolean;
  onClick?: () => void;
  footer?: ReactNode;
  /**
   * "Einfacher Modus" visual aid (see ui/Board.tsx simpleMode toggle): a colored outline showing
   * whether this card is currently affordable/actionable ("ok") or not ("blocked") — e.g. not
   * enough Runes to play it, or a unit that's already exhausted. Purely informational; illegal
   * actions are still blocked the same way regardless of this prop.
   */
  frame?: "ok" | "blocked";
  /** Rotate 90° sideways, like a physically tapped card (see Board.tsx's Rune Pool — Runes rotate on exhaust instead of using the generic dim/desaturate `instance.exhausted` look, since a Rune isn't a CardInstance). Caller is responsible for giving the surrounding layout enough room (see .rb-rune-slot in cards.css). */
  rotated?: boolean;
  /** Native HTML5 drag-and-drop (see ui/Board.tsx's dnd helpers) — thin pass-through to the underlying .rb-card div, kept card-shape-agnostic here so Board.tsx owns all drag-payload/game-logic decisions. */
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  /** True while a compatible drag is hovering this card (see Board.tsx) — shows a drop-target highlight. */
  dropActive?: boolean;
  /** True while this specific card is the one currently being dragged (see Board.tsx) — dims it. */
  dragging?: boolean;
  /** Gear cards currently attached to this unit/champion (resolved from `instance.equipment`'s instanceIds by the caller, which has `getCard`/`G.instances` — see Board.tsx). Shown as small thumbnails next to the hover-zoom preview, in addition to the small 🗡N badge on the card face itself — the badge alone doesn't say WHICH gear. */
  equippedGear?: Card[];
  /** Inline style for the outer .rb-card-wrap — used by the Hand fan (see Board.tsx) for each card's overlap (marginLeft) and stacking (zIndex). Deliberately NOT where transform goes (see cardStyle below). */
  wrapperStyle?: React.CSSProperties;
  /** Inline style applied to both the card face and its footer (kept as two separate elements — see below) — used by the Hand fan for each card's rotation/lift/scale, so the two move as one visual unit. */
  cardStyle?: React.CSSProperties;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  // Drives the hover-zoom preview via React state + a portal (see below) instead of a CSS
  // `.rb-card-wrap:hover .rb-card-zoom` rule, which broke once the Hand fan (Board.tsx) needed to
  // put a `transform` on .rb-card-wrap itself: a transformed ancestor becomes the containing
  // block for any position:fixed descendant, re-anchoring the zoom to the tiny (and, at the time,
  // overlapping-neighbor) card box instead of the viewport corner it's meant to dock in.
  const [hovering, setHovering] = useState(false);
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
    frame === "ok" ? "rb-frame-ok" : frame === "blocked" ? "rb-frame-blocked" : "",
    rotated ? "rb-card-rotated" : "",
    draggable ? "rb-draggable" : "",
    dropActive ? "rb-drop-active" : "",
    dragging ? "rb-dragging" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const cssVars = {
    "--dom": `var(--domain-${domainKey})`,
    "--dom-dark": `var(--domain-${domainKey}-dark)`,
    "--rarity-color": `var(--rarity-${rarityKey})`,
  } as React.CSSProperties;

  const wrap = (
    <div
      className="rb-card-wrap"
      style={wrapperStyle}
      onMouseEnter={() => {
        setHovering(true);
        onMouseEnter?.();
      }}
      onMouseLeave={() => {
        setHovering(false);
        onMouseLeave?.();
      }}
    >
      <div
        className={classes}
        style={cardStyle ? { ...cssVars, ...cardStyle } : cssVars}
        onClick={onClick}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
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
          className={`rb-card-art${card.type === "battlefield" ? " rb-card-landscape-art" : ""}`}
          style={card.imageUrl ? { backgroundImage: `url(${card.imageUrl})` } : undefined}
        >
          {!card.imageUrl && <div className="rb-card-art-placeholder">{card.name}</div>}
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
      </div>

      {footer && <div className="rb-card-footer" style={cardStyle}>{footer}</div>}
    </div>
  );

  return (
    <>
      {wrap}
      {/*
        Enlarged, readable preview shown on hover, portaled straight to <body> — see the
        `hovering` state above for why: this must dock at a fixed viewport corner no matter what
        transform any ancestor (e.g. the Hand fan) puts on .rb-card-wrap, and a portal is the only
        way to guarantee that (a CSS `.rb-card-wrap:hover .rb-card-zoom` rule can't reach across
        the portal boundary, which is why visibility is plain React state instead).
      */}
      {hovering &&
        createPortal(
          <div className="rb-card-zoom" style={cssVars}>
            <div className={`rb-card-zoom-inner${card.type === "battlefield" ? " rb-card-landscape-art" : ""}`}>
              {card.imageUrl ? (
                <img src={card.imageUrl} alt={card.name} />
              ) : (
                <div className="rb-card-zoom-placeholder">
                  <p className="rb-card-zoom-name">{card.name}</p>
                  <p className="rb-card-zoom-type">
                    {card.type}
                    {card.tags && card.tags.length > 0 ? ` · ${card.tags.join(", ")}` : ""}
                  </p>
                  <p className="rb-card-zoom-text">{card.text}</p>
                </div>
              )}
            </div>
            {equippedGear && equippedGear.length > 0 && (
              <div className="rb-card-zoom-gear">
                {equippedGear.map((gearCard, i) => (
                  <div key={i} className="rb-card-zoom-gear-item">
                    {gearCard.imageUrl ? (
                      <img src={gearCard.imageUrl} alt={gearCard.name} />
                    ) : (
                      <div className="rb-card-zoom-gear-placeholder" />
                    )}
                    <span>{gearCard.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
