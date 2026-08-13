#!/usr/bin/env node
/**
 * Companion to match-templated-effects.mjs: recognizes the "[Cost,] Exhaust:
 * Effect." activated-ability shape (a player-paid cost + Exhausting the card
 * itself, then a simple effect) instead of an automatic trigger. Precision
 * over recall, same as the trigger matcher — see its header comment.
 *
 * v1 scope: an Energy cost and/or a single Domain Rune cost, plus
 * Exhausting the card itself. No sacrifice costs ("Kill this:", "Recycle a
 * card..."). Cards with richer costs are left for bespoke implementation.
 *
 * Usage: node scripts/match-activated-abilities.mjs <todo.json> <matched-out.json> <remaining-todo-out.json>
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parseAction } from "./lib/action-patterns.mjs";

const [, , todoPath, matchedOutPath, remainingOutPath] = process.argv;
if (!todoPath || !matchedOutPath || !remainingOutPath) {
  console.error("Usage: node scripts/match-activated-abilities.mjs <todo.json> <matched-out.json> <remaining-todo-out.json>");
  process.exit(1);
}

const DOMAIN_RUNE = /(Fury|Calm|Mind|Body|Chaos|Order) Rune/i;
const ABILITY_PATTERN = new RegExp(
  `^(?:(\\d+) Energy)?(?:${DOMAIN_RUNE.source})?,?\\s*Exhaust:\\s*(.+)$`,
  "is",
);

function matchActivatedAbility(text) {
  // "This enters exhausted." is redundant with our actual default (createInstance always enters
  // exhausted unless Accelerate paid) — safe to drop before checking for a single-ability shape.
  const trimmed = text.trim().replace(/^This enters exhausted\.\s*\n?/i, "").trim();
  // Only accept a single-ability card: no second ability line, no other leftover sentences.
  if (trimmed.includes("\n")) return null;
  const m = trimmed.match(ABILITY_PATTERN);
  if (!m) return null;
  const energy = m[1] ? Number(m[1]) : 0;
  const runeDomain = m[2] ? m[2][0].toUpperCase() + m[2].slice(1).toLowerCase() : undefined;
  const actions = parseAction(m[3].trim());
  if (!actions) return null;
  const cost = { energy, exhaustSelf: true };
  if (runeDomain) cost.runeDomain = runeDomain;
  return { cost, actions };
}

const todo = JSON.parse(readFileSync(todoPath, "utf-8"));
const matched = {};
const remaining = [];
const stats = {};

for (const entry of todo) {
  const ability = matchActivatedAbility(entry.residualText);
  if (!ability) {
    remaining.push(entry);
    continue;
  }
  matched[entry.id] = ability;
  const key = ability.actions[0].type;
  stats[key] = (stats[key] ?? 0) + 1;
}

writeFileSync(matchedOutPath, JSON.stringify(matched, null, 2));
writeFileSync(remainingOutPath, JSON.stringify(remaining, null, 2));

console.log(`Matched ${Object.keys(matched).length} / ${todo.length} cards.`);
console.log(`Remaining bespoke todo: ${remaining.length}`);
console.log("By first action type:");
for (const [k, v] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${v.toString().padStart(4)}  ${k}`);
}
