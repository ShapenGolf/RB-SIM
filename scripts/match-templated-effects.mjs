#!/usr/bin/env node
/**
 * Conservative pattern-matcher: scans special-cases-todo.json's residualText
 * for a small set of well-templated trigger+effect sentence shapes and turns
 * matches into structured TemplatedEffect specs (src/cards/types.ts) that the
 * generic interpreter (src/game/templatedEffects/interpreter.ts) can execute
 * at runtime — no bespoke code per card.
 *
 * Precision over recall: a template only matches if the ENTIRE remaining
 * sentence (after the trigger clause) fits a known simple shape. Multi-clause,
 * conditional, or otherwise unusual text is deliberately left in the todo
 * list rather than guessed at.
 *
 * Usage: node scripts/match-templated-effects.mjs <todo.json> <matched-out.json> <remaining-todo-out.json>
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parseAction } from "./lib/action-patterns.mjs";

const [, , todoPath, matchedOutPath, remainingOutPath] = process.argv;
if (!todoPath || !matchedOutPath || !remainingOutPath) {
  console.error("Usage: node scripts/match-templated-effects.mjs <todo.json> <matched-out.json> <remaining-todo-out.json>");
  process.exit(1);
}

// --- Trigger clause detection -------------------------------------------------

const TRIGGER_PATTERNS = [
  { trigger: "onPlay", re: /^when you play (?:me|this)(?: to a battlefield)?,\s*/i },
  { trigger: "onPlay", re: /^when i(?:'m| am) played,\s*/i },
  { trigger: "onPlay", re: /^as you play (?:me|this),\s*/i },
  { trigger: "onConquer", re: /^when i conquer,\s*/i },
  { trigger: "onHold", re: /^when i hold,\s*/i },
  { trigger: "onHold", re: /^when you hold here,\s*/i },
  { trigger: "onAttack", re: /^when i attack,\s*/i },
  { trigger: "onDefend", re: /^when i defend,\s*/i },
  { trigger: "onAttackOrDefend", re: /^when i attack or defend,\s*/i },
  { trigger: "onMove", re: /^when i move(?: to a battlefield)?,\s*/i },
  { trigger: "onDestroy", re: /^when i die,\s*/i },
];

/**
 * Spells have no "when you play me," prefix in the official text — playing
 * the spell IS the trigger, so its entire ability text is the effect. Every
 * other card type requires an explicit recognized trigger clause.
 */
function stripTrigger(text, cardType) {
  for (const { trigger, re } of TRIGGER_PATTERNS) {
    const m = text.match(re);
    if (m) return { trigger, remainder: text.slice(m[0].length).trim() };
  }
  if (cardType === "spell") return { trigger: "onPlay", remainder: text.trim() };
  return null;
}

// --- Main ------------------------------------------------------------------

const todo = JSON.parse(readFileSync(todoPath, "utf-8"));
const matched = {};
const remaining = [];
const stats = {};

for (const entry of todo) {
  const stripped = stripTrigger(entry.residualText.trim(), entry.type);
  if (!stripped) {
    remaining.push(entry);
    continue;
  }
  const actions = parseAction(stripped.remainder);
  if (!actions) {
    remaining.push(entry);
    continue;
  }
  matched[entry.id] = { trigger: stripped.trigger, actions };
  const key = `${stripped.trigger}:${actions[0].type}`;
  stats[key] = (stats[key] ?? 0) + 1;
}

writeFileSync(matchedOutPath, JSON.stringify(matched, null, 2));
writeFileSync(remainingOutPath, JSON.stringify(remaining, null, 2));

console.log(`Matched ${Object.keys(matched).length} / ${todo.length} cards.`);
console.log(`Remaining bespoke todo: ${remaining.length}`);
console.log("By trigger:action:");
for (const [k, v] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${v.toString().padStart(4)}  ${k}`);
}
