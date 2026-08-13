# Kartendaten-Beschaffung für Set 1 (Origins)

## Status

Die vollständige Set-1-Kartendatenbank (~350 Karten laut Community-Quellen) ist
**noch nicht importiert**. Diese Sandbox-Umgebung blockiert ausgehenden Netzwerk-
zugriff auf praktisch alle Domains außer GitHub (git) und dem internen
Such-Backend – bestätigt sowohl über den `WebFetch`-Tool als auch direkt per
`curl`. Damit ist automatisiertes Scraping der offiziellen Card Gallery oder von
Drittanbieter-Datenbanken aus dieser Session heraus nicht möglich.

## Gefundene Quelle (für später / für den Nutzer)

Die offizielle Kartendatenbank wird von Riot als öffentliches Next.js-JSON
ausgeliefert (kein Auth nötig):

1. `GET https://riftbound.leagueoflegends.com/en-us/card-gallery/` – HTML,
   enthält die aktuelle Next.js Build-ID im Pattern
   `/_next/static/<BUILD_ID>/_buildManifest.js`.
2. `GET https://riftbound.leagueoflegends.com/_next/data/<BUILD_ID>/en-us/card-gallery.json`
   – liefert die komplette Kartendaten-Struktur
   (`pageProps.page.blades[2].cards.items`).

Ein Referenz-Implementierung dieses Fetches liegt öffentlich unter
[`vikkumar2021/RiftboundCardDatabase`](https://github.com/vikkumar2021/RiftboundCardDatabase)
(`fetch_cards.py`). Vereinfachtes Zielschema pro Karte (siehe README dort):

```json
{
  "id": "ogn-056-298",
  "name": "Adaptatron",
  "code": "OGN-056/298",
  "collector_number": 56,
  "set": "OGN",
  "set_name": "Origins",
  "type": "Unit",
  "rarity": "Uncommon",
  "domains": ["Calm"],
  "energy": 4,
  "might": 3,
  "power": null,
  "tags": ["Mech", "Piltover"],
  "ability_html": "...",
  "artists": ["Kudos Productions"]
}
```

## Optionen, wie es weitergehen kann

1. **Empfohlen:** Netzwerk-Policy dieser Environment (claude.ai/code Environment-
   Einstellungen) so anpassen, dass `riftbound.leagueoflegends.com` (oder generell
   mehr Domains) erreichbar ist – danach kann in dieser Session ein Import-Script
   (`scripts/import-cards.mjs`, siehe unten) den offiziellen Endpoint direkt
   abfragen und `src/cards/data/set1-origins.json` vollständig befüllen.
2. Der Nutzer lädt eine bereits erzeugte `cards.json` (z.B. über obiges Python-
   Script lokal ausgeführt, oder Export von Piltover Archive) in die Session hoch;
   ein Mapping-Script transformiert sie in unser internes Kartenschema
   (`src/cards/types.ts`).
3. Bis dahin: ein kuratiertes **Starter-Set** (`src/cards/data/starter-set.json`,
   ~25–40 Karten) validiert Engine/Architektur; echte Kartentexte wurden dafür
   einzeln recherchiert (siehe Quellenangaben in der Datei).

## Import-Pfad (sobald Rohdaten vorliegen)

`scripts/import-cards.mjs` nimmt eine Rohdaten-JSON (im obigen vereinfachten
Schema) und transformiert sie nach `src/cards/types.ts` `Card`, inkl.:

- Keyword-Extraktion aus `ability_html` (Regex auf bekannte Keyword-Namen +
  optionalen Zahlenwert, z.B. `Shield 2`).
- Karten, bei denen nach Keyword-Extraktion noch signifikanter Fließtext übrig
  bleibt (potenzieller Unique-Effekt), werden nach
  `src/cards/data/special-cases.json` aussortiert statt automatisch as generisch
  markiert zu werden.
