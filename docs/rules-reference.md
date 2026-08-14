# Riftbound – Rules Reference (Recherche-Stand: 2026-08-13)

Diese Datei fasst die recherchierten offiziellen Riftbound-Regeln (Riot Games TCG)
zusammen, so weit sie über Suchergebnisse zugänglich waren (direkter Zugriff auf
riftbound.gg / playriftbound.com / riftbound.leagueoflegends.com war aus dieser
Sandbox-Umgebung nicht möglich, siehe `docs/data-sourcing.md`). Dient als Grundlage
für die Keyword-Engine und das Spielmodell. **Unsicherheiten sind markiert.**

Quellen (Snippets via Suche): riftbound.gg/rules/core-rules, riftwatcher.com/rules,
mobalytics.gg/riftbound/guides/keywords, riftboundguide.com/keywords,
runesandrift.com/riftbound-keywords, riftbound.zone, rules.flexslot.gg,
riftboundfaq.com, wiki.leagueoflegends.com/Riftbound:Game_flow.

## Kartentypen

- **Legend** – die Karte, um die das ganze Deck gebaut wird (Domain-Identität).
- **Champion** – Unit-Karte, teilt Namen/Tag mit der Legend, jederzeit aus der
  Champion Zone spielbar, sobald genug Runen vorhanden sind.
- **Unit** – Feldpräsenz; wird zur Base gespielt, greift an/verteidigt,
  kontrolliert Battlefields.
- **Spell** – Einmaleffekt, geht danach in den Trash.
- **Gear** – wird ready zur Base gespielt, dauerhafte Fähigkeiten, bewegt sich
  nicht und greift nicht an.
- **Battlefield** – Punktequelle; hat eigene Fähigkeit (while-held / on-conquer).
- **Rune** – Ressourcenkarte im separaten 12-Karten-Rune-Deck.
- **Token** – durch Effekte erzeugte Hilfskarten.

## Zonen

| Zone | Eigenschaft |
|---|---|
| Main Deck | 40 Karten, verdeckt |
| Hand | privat (Anzahl sichtbar, Inhalt nicht) |
| Champion Zone | Chosen Champion, spielbar sobald bezahlbar |
| Battlefield Zone | 2 aktive Battlefields (je 1 von 3 eingereichten pro Spieler), umkämpft |
| Trash | Spells nach Resolve, zerstörte/abgeworfene Karten – öffentlich |
| Banishment | durch Effekte entfernte Karten – öffentlich, separat vom Trash |
| Rune Deck / Rune Pool | 12 Karten Ressourcen-Deck, daraus Runen in den Pool |

## Ressourcensystem (Runen)

- Pro Zug werden 2 Runen aus dem Rune Deck in den Rune Pool "gechannelt"
  (Spieler 2 channelt in seinem ersten Zug 3 statt 2).
- Eine Rune kann **exhausted** (getappt) werden → generische **Energy**.
- Eine Rune kann **recycled** werden (zurück unter das Rune Deck) → domänenspezifische
  **Power** (Domain-Farbe der Rune muss zur Kartenanforderung passen).
- Dieselbe Rune kann im selben Zug erst für Energy exhausted und danach für Power
  recycled werden (Ressourcen-Puzzle).
- Kartenkosten bestehen aus: (a) Energy-Zahl (generisch), (b) Power-Anforderung
  (domänenspezifische Rune(n) recyceln).

## Zugstruktur (A-B-C-D)

1. **Awaken** – alle exhausted Karten werden ready (automatisch).
2. **Beginning** – 1 Punkt pro kontrolliertem Battlefield.
3. **Channel** – 2 Runen vom Rune Deck in den Pool (Spieler 2, Zug 1: 3).
4. **Draw** – 1 Karte vom Main Deck ziehen.

Danach freie Aktionsphase (Main Phase) mit Chain/Priority-System (siehe unten).

## Chain / Priority / Timing

- **Open State**: kein Chain aktiv – Spieler mit Priority (bzw. Focus im Combat)
  darf eine neue Aktion/Reaktion beginnen.
- **Closed State**: ein Chain existiert – nur **Reaction**-fähige Karten/Effekte
  dürfen dazu gespielt werden.
- In einem **Showdown** (Combat) bekommt der Attacker zuerst Focus/Priority;
  danach alternierend, bis beide passen → Chain resolved top-down (LIFO).
- Timing-Keywords:
  - **Action** – spielbar während eines Showdowns, auch im gegnerischen Zug
    (nur im Open State).
  - **Reaction** – wie Action, zusätzlich auch im Closed State spielbar
    (universelles "Instant").
  - **Hidden** – verdeckt spielbar, später aufdeckbar.

## Kampf (Showdown)

1. Attacker bewegt Unit(s) zu einem Battlefield.
2. Ist das Battlefield leer → sofortige Conquer, 1 Punkt, kein Kampf.
3. Sonst: Summe Might aller Attacker vs. Summe Might aller Defender.
4. Attacker vergibt zuerst Schaden (Might) an Defender-Units (frei verteilbar,
   Overkill fließt zur nächsten Unit), danach Defender (falls noch lebend)
   an Attacker-Units.
5. Units mit Schaden ≥ Might werden zerstört (Deathknell triggert danach).
6. Nach Combat: alle überlebenden Units heilen vollständig (Schaden bleibt nicht
   zwischen Combats bestehen); Heilung passiert **vor** Deathknell-Resolution.
7. Hat Attacker nach Combat noch stehende Units auf dem Battlefield und Defender
   keine mehr → Attacker conquert, +1 Punkt.

## Siegbedingung

Erster Spieler mit **8 Punkten** gewinnt.

## Keyword-Glossar

Stand nach Import des kompletten offiziellen Kartenkatalogs (1019 Karten, alle
5 Sets, siehe `docs/data-sourcing.md`). Der Katalog markiert Keywords
durchgängig in eckigen Klammern im Kartentext (z.B. `[Shield 2]`), das macht
die Liste unten deutlich verlässlicher als die ursprüngliche Web-Recherche.
Häufigkeit = Anzahl Vorkommen im Kartentext über alle 5 Sets.

| Keyword | Häufigkeit | Engine-Handler | Regeltext (funktional) |
|---|---|---|---|
| **Reaction** | 131 | ✅ (Timing, vereinfacht) | Spielbar jederzeit, auch bevor andere Spells/Abilities resolven. |
| **Action** | 102 | ✅ (Timing, vereinfacht) | Spielbar im eigenen Zug oder in Showdowns. |
| **Empowered** | 70 | ✅ (Status-Tracking) | "Solange ich Empowered bin, erhalte ich [Text]." Granted Text ist immer kartenspezifisch (Special Case). |
| **Hidden** | 61 | ⬜ noch kein Handler | Verdeckt spielbar, später aufdeckbar. |
| **Deflect [X]** | 59 | ✅ | Gegner muss X zusätzliche Rune(n) zahlen/recyceln, um mich als Ziel zu wählen. |
| **Equip** | 53 | ✅ (Teilweise, ~32/53) | Gear/Ausrüstung wird an eine Unit angehängt — eigener `equipGear`-Move (moves.ts) + `Card.equipCost` (db.ts, geparst aus dem Equip-Keyword-Text für die gängigen "<Domain> Rune"/"N Energy+<Domain> Rune"-Muster). Kosten mit Zusatzklausel ("— Order Rune, Kill a friendly unit" etc.) bleiben unbehandelt, brauchen eigenen Special Case. Der Might-Bonus angehängter Ausrüstung wird summiert (`might.ts`), ist aber laut aktuellen Importdaten für alle 40 Equipment-Karten `null`/0 — vermutlich eine Importer-Lücke, nicht verifizierbar ohne Netzwerkzugriff. |
| **Empower [Kosten]** | 53 | ⬜ noch kein Handler | Aktivierte Fähigkeit: Kosten zahlen → Empowered-Status erhalten (nur falls noch nicht empowered). |
| **Ganking** | 52 | ✅ (Move-Regel) | Kann von Battlefield zu Battlefield ziehen (Bewegungs-Keyword) — direkt in `attackBattlefield` (moves.ts) umgesetzt, kein separater Handler nötig. |
| **Add** | 50 | ⬜ noch kein Handler | Im Kontext von Ressourcen-Effekten ("[Add] that much Rune"). |
| **Accelerate [X]** | 41 | ✅ | Beim Spielen darf zusätzlich X Energy (+ oft eine Domain-Rune) bezahlt werden; falls ja, tritt die Karte ready statt exhausted ein. |
| **Temporary** | 35 | ✅ | Zerstört sich selbst zu Beginn der Beginning Phase des Controllers, vor dem Scoring — Status wird bei `createInstance` gesetzt (gedruckt) oder von Karten wie Last Stand vergeben (`instance.statuses.temporary`), Kill-Check in `turnFlow.ts runBeginning`. |
| **Tank** | 32 | ⬜ noch kein Handler | "Muss zuerst Kampfschaden zugewiesen bekommen." |
| **Deathknell** | 27 | ✅ (Event-Hook) | Triggert beim Zerstören, nach Heilung, vor Zonenwechsel. Payload immer Special Case. |
| **Repeat [Kosten]** | 24 | ⬜ noch kein Handler | Effekt darf gegen Zusatzkosten wiederholt werden. |
| **Assault [+X]** | 23 | ✅ | +X Might solange ich Attacker bin. |
| **Ambush** | 23 | ✅ (Zieleinstellung + Move-Regel) | Darf als Reaction direkt auf ein Battlefield gespielt werden, wo man **bereits eigene** Units hat (nicht Gegner-Units — frühere Version dieser Zeile hatte das vertauscht). `ambushBattlefieldIndex` in `playCard` (moves.ts), UI-Button in Board.tsx. Reaction-Timing bleibt wie bei allen Reaction-Karten vereinfacht (kein echtes Chain-System). |
| **Shield [X]** | 21 | ✅ | +X Might solange ich verteidige. |
| **Weaponmaster** | 20 | ✅ (Vereinfacht) | "Beim Spielen darfst du eine deiner Equipment-Karten für Rune weniger an mich anhängen." Handler in `keywords/handlers/weaponmaster.ts`: nimmt immer die erste gefundene Equipment (keine Auswahl-UI) und behandelt die Kostenreduktion als vollständig kostenlos. Karten mit zusätzlichem Text über Weaponmaster hinaus (z.B. Akshan) brauchen weiterhin einen eigenen Special Case dafür. |
| **Stun** | 18 | ✅ (Status-Check) | Verursacht diesen Zug keinen Kampfschaden. Wird i.d.R. von einer anderen Karte verhängt, nicht selbst getragen. |
| **Flow [Kosten]** | 18 | ⬜ noch kein Handler | Darf gegen Kosten aus dem Trash gespielt werden, danach banished. |
| **Legion** | 15 | ✅ (Conditional-Check) | Aktiv, wenn diesen Zug bereits eine andere Main-Deck-Karte gespielt wurde. Granted Text immer Special Case. |
| **Vision** | 15 | ✅ | "Wenn gespielt: [Predict]." |
| **Mighty** | 14 | ⬜ noch kein Handler | Statusabhängig (z.B. "Mighty solange 5+ Might"), kartenspezifisch. |
| **Buff** | 12 | ⬜ noch kein Handler | Generischer permanenter Might-Bonus-Counter. |
| **Hunt [X]** | 8 | ✅ | Wenn ich Conquer oder Hold, Controller erhält X XP. |
| **Quick-Draw** | 6 | ⬜ noch kein Handler | Kartenspezifisches Attach-Verhalten (oft kombiniert mit Reaction). |
| **Backline** | 6 | ⬜ noch kein Handler | "Muss zuletzt Kampfschaden zugewiesen bekommen" (Gegenstück zu Tank). |
| **Predict** | 5 | ⬜ noch kein Handler (Teil von Vision) | Oberste Deck-Karte ansehen, optional recyceln (unten einordnen). |
| **Unique** | 3 | ⬜ noch kein Handler | Deckbau-Regel: nur 1 Kopie mit diesem Namen pro Deck (kein Laufzeit-Verhalten). |
| **Level [N]** | ~30 | ✅ (Wert geparst, Effekt pro Karte) | Teil des XP/Level-Systems; Effekt bei Erreichen von N XP ist immer kartenspezifisch (`ctx.game.players[...].xp >= N`, analog zu `hasConditionalGanking`). Karten, die Level-abhängig **Deflect** gewähren, bekommen bisher nur ihren übrigen Effekt (z.B. Might) — Deflect hat noch keinen Conditional-Override-Mechanismus wie Ganking. |

✅ = generischer Handler existiert in `src/keywords/handlers/`. ⬜ = im echten
Kartentext gefunden und von der Import-Pipeline korrekt erkannt/geparst, aber
noch kein Laufzeit-Verhalten implementiert (nächste Ausbaustufe der Engine).

**Wichtiger Befund:** die meisten Karten haben zusätzlich zu ihren Keywords
noch echten Unique-Text (971 von 1019 importierten Karten, siehe
`src/cards/data/special-cases-todo.json`). Keywords sind eine Abkürzung für
wiederkehrende Regelbausteine, ersetzen aber nicht die individuelle
Kartenidentität — das war so nicht abzusehen, bevor der volle Datensatz vorlag.

## Architektur-Konsequenz

Die generische Keyword-Engine (siehe `src/keywords/`) implementiert jedes
Keyword oben als eigenständigen, parametrisierbaren Handler. Karten referenzieren
Keywords per Name + Parameter (z.B. `{ "keyword": "shield", "value": 2 }`) statt
eigenen Code zu benötigen. Nur echte Unique-Card-Texte (v.a. Legends/Champions)
bekommen kartenspezifische Handler in `src/cards/special-cases/`.
