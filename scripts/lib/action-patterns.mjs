/**
 * Shared conservative action-clause parser, used by both
 * match-templated-effects.mjs (triggered effects) and
 * match-activated-abilities.mjs (Cost, Exhaust: Effect). Parses the sentence
 * that remains after a trigger/cost clause has been stripped off, and only
 * returns a result if the ENTIRE remaining text matches one of a small set
 * of known simple action shapes — precision over recall throughout.
 */

export const ACTION_PATTERNS = [
  {
    re: /^draw (\d+)\.?$/i,
    build: (m) => [{ type: "drawCards", player: "controller", amount: Number(m[1]) }],
  },
  {
    re: /^gain (\d+) xp\.?$/i,
    build: (m) => [{ type: "gainXP", player: "controller", amount: Number(m[1]) }],
  },
  {
    re: /^you score (\d+) points?\.?$/i,
    build: (m) => [{ type: "scorePoints", player: "controller", amount: Number(m[1]) }],
  },
  {
    re: /^discard (\d+)\.?$/i,
    build: (m) => [{ type: "discardCards", player: "controller", amount: Number(m[1]) }],
  },
  {
    re: /^ready me\.?$/i,
    build: () => [{ type: "readyTarget", target: { kind: "self" } }],
  },
  {
    re: /^i enter ready\.?$/i,
    build: () => [{ type: "readyTarget", target: { kind: "self" } }],
  },
  {
    re: /^ready (a|an|a friendly) (unit|gear)\.?$/i,
    build: (m) => [
      { type: "readyTarget", target: { kind: m[2].toLowerCase() === "gear" ? "chooseFriendlyGear" : "chooseFriendlyUnit" } },
    ],
  },
  {
    // "Buff" is Riftbound's own term for a permanent +1 Might counter (idempotent — a unit either
    // has one or doesn't). Our interpreter currently treats "permanent" duration the same as
    // "thisTurn" (documented gap, see templatedEffectEngine.ts) until real counters are modeled.
    re: /^buff (me|a friendly unit|a unit)\.?$/i,
    build: (m) => [
      {
        type: "buffMight",
        target: { kind: m[1] === "me" ? "self" : m[1] === "a unit" ? "chooseUnit" : "chooseFriendlyUnit" },
        amount: 1,
        duration: "permanent",
      },
    ],
  },
  {
    re: /^give me ([+-]\d+) Might(?: this turn)?\.?$/i,
    build: (m) => [{ type: "buffMight", target: { kind: "self" }, amount: Number(m[1]), duration: "thisTurn" }],
  },
  {
    re: /^give (a friendly unit|a unit|an enemy unit)( here)?\s*([+-]\d+) Might this turn(?:, to a minimum of \d+ Might)?\.?$/i,
    build: (m) => [
      {
        type: "buffMight",
        target: {
          kind: m[1].includes("enemy") ? "chooseEnemyUnit" : m[1] === "a unit" ? "chooseUnit" : "chooseFriendlyUnit",
          atBattlefieldOnly: Boolean(m[2]),
        },
        amount: Number(m[3]),
        duration: "thisTurn",
      },
    ],
  },
  {
    re: /^deal (\d+) to (?:a|an) (enemy )?unit( here| at a battlefield)?\.?$/i,
    build: (m) => [
      {
        type: "dealDamage",
        target: { kind: m[2] ? "chooseEnemyUnit" : "chooseUnit", atBattlefieldOnly: Boolean(m[3]) },
        amount: Number(m[1]),
      },
    ],
  },
  {
    re: /^kill a gear\.?$/i,
    build: () => [{ type: "killTarget", target: { kind: "chooseFriendlyGear" } }],
  },
  {
    re: /^kill (?:a|an) (friendly |enemy )?unit( here| at a battlefield)?\.?$/i,
    build: (m) => [
      {
        type: "killTarget",
        target: {
          kind: m[1]?.trim() === "enemy" ? "chooseEnemyUnit" : m[1]?.trim() === "friendly" ? "chooseFriendlyUnit" : "chooseUnit",
          atBattlefieldOnly: Boolean(m[2]),
        },
      },
    ],
  },
  {
    re: /^deal (\d+) to all enemy units(?: (here|in combat|at a battlefield))?\.?$/i,
    build: (m) => [{ type: "dealDamage", target: { kind: "allEnemyUnitsAtBattlefield" }, amount: Number(m[1]) }],
  },
  {
    re: /^(?:recall|return) (?:a|an) (friendly |enemy )?unit(?: here| at a battlefield)? (?:exhausted )?to (?:its|their) owner'?s? hand\.?$/i,
    build: (m) => [
      {
        type: "recallTarget",
        target: { kind: m[1]?.trim() === "enemy" ? "chooseEnemyUnit" : "chooseFriendlyUnit" },
      },
    ],
  },
  {
    re: /^channel (\d+) runes? exhausted\.?$/i,
    build: (m) => [{ type: "channelRunes", player: "controller", amount: Number(m[1]) }],
  },
  {
    re: /^—?\s*(Fury|Calm|Mind|Body|Chaos|Order) Rune\.?$/i,
    build: (m) => [{ type: "gainRune", player: "controller", domain: m[1], amount: 1 }],
  },
];

/**
 * Riftbound card text consistently uses a trailing "(...)" as a plain-English
 * restatement of the rule that was just stated, not an additional action —
 * e.g. "Buff a friendly unit. (If it doesn't have a buff, it gets a +1 Might
 * buff.)" Stripping it is safe for matching purposes: worst case we still
 * fail to match (conservative), never mis-execute a hidden second effect.
 */
function stripTrailingReminder(text) {
  const stripped = text.replace(/\s*\([^()]*\)\s*$/, "").trim();
  return stripped.length > 0 ? stripped : text;
}

export function parseSingleAction(text) {
  for (const { re, build } of ACTION_PATTERNS) {
    const m = text.match(re);
    if (m) return build(m);
  }
  const stripped = stripTrailingReminder(text);
  if (stripped !== text) {
    for (const { re, build } of ACTION_PATTERNS) {
      const m = stripped.match(re);
      if (m) return build(m);
    }
  }
  return null;
}

/**
 * A chained pair is only safe to auto-combine if at most one action needs a
 * player-chosen target — otherwise both would be forced onto the same
 * instance (via the single explicit target the engine passes through),
 * silently removing the real choice to split them across two targets
 * (e.g. "Deal 3 to a unit. Deal 3 to a unit." lets you split 3+3 or stack 6).
 */
function safeToChain(first, second) {
  const needsTarget = (actions) => actions.some((a) => "target" in a && a.target.kind.startsWith("choose"));
  return !(needsTarget(first) && needsTarget(second));
}

/** Parses one action, or a safe two-action chain ("X, then Y." or "X. Y.") of independently-recognized actions. */
export function parseAction(remainder) {
  const text = remainder.trim().replace(/^you may\s+/i, "");

  const thenMatch = text.match(/^(.+?),\s*then\s+(.+)$/i);
  if (thenMatch) {
    const first = parseSingleAction(thenMatch[1].trim() + ".");
    const second = parseSingleAction(thenMatch[2].trim());
    if (first && second && safeToChain(first, second)) return [...first, ...second];
  }

  const periodMatch = text.match(/^([^.]+\.)\s+([^.]+\.?)$/);
  if (periodMatch) {
    const first = parseSingleAction(periodMatch[1].trim());
    const second = parseSingleAction(periodMatch[2].trim());
    if (first && second && safeToChain(first, second)) return [...first, ...second];
  }

  return parseSingleAction(text);
}
