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

## Keyword-Glossar (recherchierter Stand)

| Keyword | Typ | Regeltext (funktional) |
|---|---|---|
| **Stun** | Status | Unit verursacht in diesem Zug keinen Kampfschaden. |
| **Empowered** | Dependent | "Solange ich den Empowered-Status habe, erhalte ich [Text]." Max. 1x pro Spiel je Karte. |
| **Ambush** | Passive | "Ich darf auf ein Battlefield gespielt werden, das du kontrollierst (Units dort)" + erhalte Reaction, solange ich dorthin gespielt werde. |
| **Level [N]** | System | Teil des XP/Level-Growth-Systems (Champions leveln über XP-Schwellen). Details noch zu verifizieren. |
| **Hunt** | Triggered | "Wenn ich Conquer oder Hold, erhält mein Controller X XP." |
| **Accelerate** | Cost-Modifier | "Beim Spielen darf zusätzlich [1][C] bezahlt werden. Falls ja: tritt ready ein." |
| **Assault [+X M]** | Passive | "Solange ich Attacker bin, habe ich +X Might." |
| **Deflect** | Passive | Wird die Karte von einem Spell/einer Ability angevisiert, muss der Zielende zusätzliche Rune(n) bezahlen/recyceln; sonst ungültiges Ziel. |
| **Legion** | Conditional Trigger | Triggert, wenn in diesem Zug bereits eine andere Main-Deck-Karte gespielt wurde. |
| **Shield [X]** | Passive | Unit hat +X Might, solange sie verteidigt (defending). |
| **Deathknell** | Triggered | Triggert, wenn die Unit zerstört wird (nach Heilung, vor Zone-Wechsel). |
| **Vision** | Triggered | "Wenn gespielt: predict" (Predict = oberste Deck-Karte ansehen/Karten filtern – Detailmechanik noch zu verifizieren). |
| **Action** | Timing | Siehe oben. |
| **Reaction** | Timing | Siehe oben. |
| **Hidden** | Timing | Siehe oben. |
| **Tough** | ? | Unklar – vermutlich Schadensreduktion (analog anderer TCGs), **zu verifizieren**. |
| **Overwhelm** | ? | Unklar – vermutlich Trample-artig (überschüssiger Schaden geht durch), **zu verifizieren**. |

**Offene Punkte für spätere Recherche-Iteration:** exakte Level/XP-Mechanik,
Predict-Mechanik (Vision), Tough, Overwhelm, sowie das vollständige Keyword-Set
laut offiziellem Glossar (es gibt vermutlich weitere, seltenere Keywords in
späteren Sets, für Set 1 aber vermutlich mit den obigen weitgehend abgedeckt).

## Architektur-Konsequenz

Die generische Keyword-Engine (siehe `src/keywords/`) implementiert jedes
Keyword oben als eigenständigen, parametrisierbaren Handler. Karten referenzieren
Keywords per Name + Parameter (z.B. `{ "keyword": "shield", "value": 2 }`) statt
eigenen Code zu benötigen. Nur echte Unique-Card-Texte (v.a. Legends/Champions)
bekommen kartenspezifische Handler in `src/cards/special-cases/`.
