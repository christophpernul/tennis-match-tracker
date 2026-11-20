# Tennis Match Tracker (Zepp OS 1.0, Amazfit GTR 3)

Mini Program für die Amazfit GTR 3 (Zepp OS 1.0, 454×454, deviceSource 226/227).
Nutzt die 1.0-API (`hmUI`, `hmApp`, `hmFS`, `hmSetting`), **nicht** die 2.0/3.x-API.

## Stand

| Schritt | Inhalt | Status |
|---|---|---|
| 1 | Hello World (Startseite) – Toolchain verifizieren | gebaut, Test auf Gerät offen |
| 2 | Zwei-Tasten-Punktezähler (nur Rohpunkte, Undo, keine Persistenz) | gebaut, Test auf Gerät offen |
| 3 | Zählregeln, Kategorien, Persistenz in `/data`, Statistik | wartet auf Regel-Entscheidung |

## Setup

```powershell
npm i @zeppos/zeus-cli -g
npm install
zeus login
zeus build      # nur bauen -> dist/*.zab
zeus preview    # baut + zeigt QR-Code
```

Auf dem Handy (Zepp App):
1. Profil → Einstellungen → Über → 7× aufs Zepp-Icon tippen (Developer Mode).
2. Profil → GTR 3 → Developer Mode → Scan → QR-Code von `zeus preview` scannen.

Bei `zeus preview` die GTR 3 als Zielgerät wählen. Falls die Installation wegen
der `appId` (aktuell `1093277`, frei gewählt) abgelehnt wird: in der Zepp
Developer Console eine App anlegen und deren `appId` in `app.json` eintragen.

## Bedienung Zähler (Schritt 2)

| Eingabe | Wirkung |
|---|---|
| Tippen linke Hälfte (blau) | +1 Ich (zählt schon beim Berühren) |
| Tippen rechte Hälfte (rot) | +1 Gegner |
| UNDO unten | letzten Punkt zurücknehmen (längere Vibration) |
| Taste `HOME` kurz | +1 Ich *(Annahme: obere Taste)* |
| Taste `SHORTCUT` kurz | +1 Gegner *(Annahme: untere Taste)* |
| Eine der Tasten lang | Zähler verlassen |
| Wisch nach rechts | blockiert (kein versehentliches Verlassen) |

Oben am Rand zeigt eine Debug-Zeile `key X / act Y` für jeden Tastendruck.
Bitte notieren, welche Werte obere/untere Taste liefern und ob ein kurzer
Druck die App trotzdem verlässt.

Screen-off: `hmApp.setScreenKeep(true)` + `hmSetting.setBrightScreen(1800)`
(bei jedem Punkt erneuert), `setBrightScreenCancel()` in `onDestroy`.

## Entscheidungen für Schritt 3 (2026-11-20)

- **Format**: beim Matchstart wählbar, Auswahl als scrollbare Liste
  untereinander: Sätze Best of 1 / 2 / 3, Match-Tiebreak ja/nein.
  *Offen*: was „Best of 2" genau bedeutet (2 Sätze + Match-TB als Entscheidung?).
- **Einstand**: pro Match wählbar (Ad / No-Ad).
- **Kategorien**: Ass, Doppelfehler, Servicewinner, Winner, Unforced Error,
  Forced Error.
- **Timeout ohne Auswahl**: Punkt bleibt *ohne Kategorie* (eigener Eintrag
  in der Statistik).
- Annahme bis zur Klärung: Tiebreak bei 6:6 bis 7, Match-TB bis 10,
  jeweils 2 Punkte Vorsprung.

## Struktur

```
app.json                      Manifest, nur Target gtr3
app.js
assets/gtr3/icon.png          86×86
page/gtr3/home/               Hello World + Button "Zähler"
page/gtr3/counter/            Punktezähler
page/i18n/en-US.po
```
