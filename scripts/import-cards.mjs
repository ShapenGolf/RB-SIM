#!/usr/bin/env node
/**
 * Imports the official Riftbound card gallery JSON (as saved from
 * https://riftbound.leagueoflegends.com/_next/data/<BUILD_ID>/en-us/card-gallery.json,
 * see docs/data-sourcing.md) into our internal card schema.
 *
 * Usage: node scripts/import-cards.mjs <raw-gallery.json> <output-catalog.json> <special-cases-todo.json>
 *
 * Strategy (see docs/rules-reference.md and CardsImportNotes below):
 *  - Every card's ability text is scanned for bracket keyword tags, e.g.
 *    "[Shield 2]", "[Reaction]", "[Hunt 2] (When I conquer or hold, gain 2 XP.)".
 *  - Recognized tags become structured `keywords` entries.
 *  - Whatever text is left after stripping tags + their immediately-adjacent
 *    reminder text is "residual" unique text. Cards with non-trivial residual
 *    text are flagged `needsSpecialCase: true` and written to the todo list
 *    instead of being guessed at — per the project brief, special cases are
 *    catalogued, not auto-implemented.
 */
import { readFileSync, writeFileSync } from "node:fs";

const [, , inputPath, outputPath, todoPath] = process.argv;
if (!inputPath || !outputPath || !todoPath) {
  console.error("Usage: node scripts/import-cards.mjs <raw-gallery.json> <output-catalog.json> <special-cases-todo.json>");
  process.exit(1);
}

const KNOWN_KEYWORDS = new Set([
  "reaction", "action", "empowered", "hidden", "deflect", "equip", "empower",
  "ganking", "add", "accelerate", "temporary", "tank", "deathknell", "repeat",
  "assault", "ambush", "shield", "weaponmaster", "stun", "flow", "legion",
  "vision", "mighty", "buff", "hunt", "quick-draw", "backline", "predict",
  "unique", "level",
]);

const ICON_MAP = {
  rb_might: "Might",
  rb_exhaust: "Exhaust",
  rb_rune_rainbow: "Rune",
  rb_rune_fury: "Fury Rune",
  rb_rune_body: "Body Rune",
  rb_rune_calm: "Calm Rune",
  rb_rune_mind: "Mind Rune",
  rb_rune_chaos: "Chaos Rune",
  rb_rune_order: "Order Rune",
};

function iconText(token) {
  const energyMatch = token.match(/^rb_energy_(\d+)$/);
  if (energyMatch) return `${energyMatch[1]} Energy`;
  return ICON_MAP[token] ?? `[${token}]`;
}

function htmlToPlainText(html) {
  return html
    .replace(/:([a-z_0-9]+):/g, (_, token) => iconText(token))
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

/** Extracts bracket keyword tags and strips them (+ an immediately-adjacent reminder parenthetical) from the text. */
function extractKeywords(plainText) {
  const keywords = [];
  let residual = plainText;

  // Drop bare "[>]" dependent-effect markers; they modify the preceding keyword, not a keyword themselves.
  residual = residual.replace(/\[>\]/g, "");
  // "[NO TEXT]" is the gallery's literal placeholder for blank-text cards (plain Runes).
  if (residual.replace(/\[NO TEXT\]/g, "").trim() === "") {
    return { keywords: [], residual: "" };
  }

  // "[Empower] COST (COST: Empower me/this. Use only if not Empowered.)" repeats its own cost text
  // before the reminder parenthetical, so the generic tag+adjacent-paren stripper below can't match it
  // (there's a cost clause between "]" and "("). Handle it as its own shape first, keeping the cost text.
  residual = residual.replace(
    /\[Empower\]\s*([^()]+?)\s*\(\s*\1\s*:\s*Empower (?:me|this)\.(?:[^()]*)?\)/gi,
    (_full, cost) => {
      keywords.push({ keyword: "empower", grantedText: cost.trim() });
      return "";
    },
  );

  // Match a bracket tag and, optionally, an immediately-adjacent reminder parenthetical
  // (e.g. "[Deflect] (Opponents must pay...)") as a single unit so both get removed together.
  const tagPattern = /\[([A-Za-z][A-Za-z\- ]*?)(?:\s+(\d+))?\](\s*(?:\u2014\s*)?\([^()]*\))?/g;
  residual = residual.replace(tagPattern, (full, name, value) => {
    const normalized = name.trim().toLowerCase();
    if (!KNOWN_KEYWORDS.has(normalized)) return full; // leave unrecognized bracket text untouched, it'll show up as residual
    const entry = { keyword: normalized };
    if (value !== undefined) entry.value = Number(value);
    keywords.push(entry);
    return "";
  });

  return { keywords, residual: residual.trim() };
}

function isMeaningfulResidual(residual) {
  const letters = residual.replace(/[^A-Za-z]/g, "");
  return letters.length > 3;
}

const DOMAIN_MAP = {
  fury: "Fury", calm: "Calm", mind: "Mind", body: "Body", chaos: "Chaos", order: "Order", colorless: "Colorless",
};

function toDomain(id) {
  const mapped = DOMAIN_MAP[id];
  if (!mapped) throw new Error(`Unknown domain id: ${id}`);
  return mapped;
}

function cardType(rawCardType) {
  const baseType = rawCardType.type?.[0]?.id;
  const isChampion = (rawCardType.superType ?? []).some((s) => s.id === "champion");
  if (baseType === "unit" && isChampion) return "champion";
  return baseType;
}

function canonicalGroupKey(item) {
  // Alt-art / showcase variants share a collector number with a letter suffix (e.g. "121a").
  // Group by the numeric part + set so we keep exactly one printing per unique game card.
  const numericPart = String(item.collectorNumber).replace(/[a-z]+$/i, "");
  return `${item.set.value.id}-${numericPart}`;
}

// Real cards whose text we've confirmed matches an already-implemented special-case handler
// (see src/cards/special-cases/). Keyed by our internal card id (setCode-collectorNumber).
const IMPLEMENTED_SPECIAL_CASES = {
  "ogn-16": "dangerous-duo", // Dangerous Duo: "[Legion] — When you play me, give a unit +2 Might this turn."
};

const raw = JSON.parse(readFileSync(inputPath, "utf-8"));
const items = raw?.pageProps?.page?.blades?.[2]?.cards?.items;
if (!Array.isArray(items)) {
  console.error("Could not find pageProps.page.blades[2].cards.items in the input file.");
  process.exit(1);
}

const groups = new Map();
for (const item of items) {
  const key = canonicalGroupKey(item);
  const existing = groups.get(key);
  // Prefer the printing whose publicCode has no letter suffix (the "main" printing over alt art).
  if (!existing || /^[A-Z]+-\d+\/\d+$/.test(item.publicCode)) {
    groups.set(key, item);
  }
}

const catalog = {};
const todo = [];
const warnings = [];

for (const item of groups.values()) {
  const type = cardType(item.cardType);
  const domains = (item.domain?.values ?? []).map((d) => toDomain(d.id));
  const energyCost = item.energy?.value?.id ?? null;
  const powerAmount = item.power?.value?.id ?? null;
  const powerCost = [];
  if (powerAmount) {
    if (domains.length > 1) {
      warnings.push(`${item.name} (${item.publicCode}): multiple domains + Power cost, guessed domain "${domains[0]}" — verify against the card image.`);
    }
    powerCost.push({ domain: domains[0] ?? "Fury", amount: powerAmount });
  }
  const might = item.might?.value?.id ?? null;
  const rawBody = item.text?.richText?.body ?? "";
  const plainText = htmlToPlainText(rawBody);
  const { keywords, residual } = extractKeywords(plainText);
  const needsSpecialCase = isMeaningfulResidual(residual);

  const numericCollector = Number(String(item.collectorNumber).replace(/[a-z]+$/i, ""));
  const id = `${item.set.value.id.toLowerCase()}-${numericCollector}`;

  const card = {
    id,
    name: item.name,
    type,
    setCode: item.set.value.id,
    collectorNumber: numericCollector,
    rarity: item.rarity?.value?.id,
    domains,
    energyCost,
    powerCost,
    might,
    text: plainText.replace(/\[>\]/g, "").trim(),
    keywords,
    tags: item.tags?.tags ?? [],
    sourceNote: `Imported from the official Riftbound card gallery (playriftbound.com), set ${item.set.value.label}, ${item.publicCode}.`,
  };
  if (IMPLEMENTED_SPECIAL_CASES[id]) {
    card.specialCaseId = IMPLEMENTED_SPECIAL_CASES[id];
  } else if (needsSpecialCase) {
    todo.push({ id, name: item.name, set: item.set.value.id, type, residualText: residual, fullText: plainText });
  }

  catalog[id] = card;
}

writeFileSync(outputPath, JSON.stringify(Object.values(catalog), null, 2));
writeFileSync(todoPath, JSON.stringify(todo, null, 2));

console.log(`Imported ${Object.keys(catalog).length} unique cards (from ${items.length} raw entries).`);
console.log(`Flagged ${todo.length} cards with unique text as special-case TODOs.`);
console.log(`${warnings.length} warnings.`);
for (const w of warnings.slice(0, 20)) console.log("  WARN:", w);
if (warnings.length > 20) console.log(`  ...and ${warnings.length - 20} more.`);

const bySet = {};
for (const c of Object.values(catalog)) bySet[c.setCode] = (bySet[c.setCode] ?? 0) + 1;
console.log("By set:", bySet);
