# Tennis Match Tracker (Zepp OS 1.0, Amazfit GTR 3)

Mini Program für die Amazfit GTR 3 (Zepp OS 1.0, 454×454, deviceSource 226/227).
Nutzt die 1.0-API (`hmUI`, `hmApp`, `hmFS`, `hmSetting`), **nicht** die 2.0/3.x-API.

**Bedienung für Spieler: [Benutzerhandbuch](docs/BENUTZERHANDBUCH.md).**
Diese README ist die technische Doku (Setup, Datenformat, Struktur).

## Stand

| Schritt | Inhalt | Status |
|---|---|---|
| 1 | Hello World – Toolchain | auf Gerät bestätigt |
| 2 | Zwei-Tasten-Zähler, Undo, Screen-Keep | auf Gerät bestätigt |
| 3 | Matchformat, Zählregeln, Kategorien, Persistenz, Statistik | auf Gerät bestätigt, Regeln per Unit-Test geprüft |
| 4 | Gegnername, Match beenden/pausieren, Match-Verlauf mit Filter und Summe | auf Gerät bestätigt |
| 5 | Export per QR-Code | verworfen: QRCODE-Widget bei 280 px fehlerhaft (200 px ok), Export-Codes weiß/Absturz; Längengrenze nicht weiter untersucht |
| 6 | Export per Side Service → Google Apps Script → Google Sheet | auf Gerät bestätigt, Apps Script per Test geprüft |

## Setup

```powershell
npm i @zeppos/zeus-cli -g
npm install
zeus login
zeus build      # nur bauen -> dist/*.zab
zeus preview    # baut + zeigt QR-Code
npm test        # Unit-Tests: Zählregeln, Speicher, Export, Apps Script (Node)
```

Eigene Werte (Script-URL, Token, Deployment-ID) gehören in `.env`; die Datei
ist in `.gitignore` und wird nie committet (das Repository ist öffentlich).
In `apps-script/Code.gs` bleibt im Repo immer der Platzhalter für `TOKEN`.

Falls `zeus` nicht gefunden wird: `%APPDATA%\npm` zum Benutzer-PATH hinzufügen
und VS Code neu starten.

Auf dem Handy (Zepp App):
1. Profil → Einstellungen → Über → 7× aufs Zepp-Icon tippen (Developer Mode).
2. Profil → GTR 3 → Developer Mode → Scan → QR-Code von `zeus preview` scannen.

## Bedienung

**Start**: *Fortsetzen* (offenes Match), *Neues Match*, *Statistik* (Match-Verlauf).

**Neues Match** (je ein Tipp pro Schritt):
1. Gegner: *Neuer Name* · zuletzt gespielte Gegner · *Ohne Name*
2. (bei *Neuer Name*) Buchstabenraster A–Z, `_` = Leerzeichen, `<` = löschen,
   *Fertig*. Wortanfänge werden automatisch groß geschrieben, max. 16 Zeichen,
   keine Umlaute (ü → ue).
3. Format: 1 Satz · 2 Sätze + MTB · Best of 3 · Nur Match-TB
4. Einstand: Mit Vorteil · No-Ad (entfällt bei „Nur Match-TB“)
5. Wer schlägt auf? Ich · Gegner

Ist beim Start eines neuen Matches noch ein offenes Match mit Punkten
gespeichert, wird es automatisch als *abgebrochen* archiviert.

**Match-Screen**

| Eingabe | Wirkung |
|---|---|
| Tippen linke Hälfte (blau) / obere Taste kurz | Punkt Ich |
| Tippen rechte Hälfte (rot) / untere Taste kurz | Punkt Gegner |
| UNDO | letzten Punkt zurücknehmen |
| Obere Taste lang | Statistik (Taste/Wischen → zurück zum Match) |
| Untere Taste lang | Menü: *Weiterspielen* · *Pausieren* · *Match beenden* |
| Wisch nach rechts | blockiert |

**Menü**: *Pausieren* verlässt das Match, es bleibt offen und kann über
*Fortsetzen* weitergespielt werden. *Match beenden* fragt nach
(„Ja, beenden“ liegt bewusst an anderer Stelle als „Match beenden“),
archiviert das Match als *abgebrochen* mit aktuellem Stand und zeigt die
Statistik. Ein Match ohne Punkte wird verworfen. Untere Taste lang schließt
das Menü wieder.

Ein regulär beendetes Match wird automatisch archiviert. UNDO auf den
Matchball holt es aus dem Archiv zurück.

**Statistik → Match-Liste**: neueste zuerst, grün = Sieg, rot = Niederlage,
grau = abgebrochen. Vollständige Matches zeigen die Sätze (`2:1`),
abgebrochene den Stand beim Abbruch (`1:0`, `6:4 3:2`). *Filter* wechselt Alle → Vollständig →
Abgebrochen. *Summe* zeigt die zusammengerechnete Statistik der gefilterten
Matches (Siege/Niederlagen/Abbrüche), ein Tipp auf ein Match dessen
Einzelstatistik mit Datum, Gegner und Format.

Oben: Satzstand, z. B. `6:4  3:2` (`TB` im Tiebreak, `MTB` im Match-Tiebreak).
Gelbes `(A)` am Namen = Aufschlag. Große Zahlen = Spielstand (0/15/30/40/AD,
im Tiebreak Punkte).

**Kategorie nach jedem Punkt**: Der Punkt zählt sofort, danach öffnet sich ein
Overlay mit den passenden Kategorien:

| Punkt für … | Optionen |
|---|---|
| Aufschläger | Ass, Service-W., Winner, UE/FE des Rückschlägers |
| Rückschläger | Doppelf., Winner, UE/FE des Aufschlägers |

Ohne Auswahl schließt das Overlay nach 6 s (`OK`-Countdown) und der Punkt bleibt
*ohne Kategorie*. `OK` schließt sofort, `UNDO` nimmt den Punkt zurück, ein neuer
Punkt (Taste) schließt es ebenfalls.

Tasten auf der GTR 3 gemessen: obere Taste `HOME` = 36, untere `SHORTCUT` = 93,
kurzer Klick = Aktion 1.

## Export nach Google Sheets

Weg: Uhr → Bluetooth → Side Service in der Zepp App (Handy) → HTTPS →
Google Apps Script → Tabellenblatt `Matches`.

### Einmalige Einrichtung

1. **Google Sheet anlegen** (beliebiger Name) → *Erweiterungen → Apps Script*.
2. Den Inhalt von [`apps-script/Code.gs`](apps-script/Code.gs) komplett
   einfügen (vorhandenen Code ersetzen).
3. Oben `var TOKEN = "HIER-GEHEIMES-WORT-EINTRAGEN";` durch ein eigenes
   geheimes Wort ersetzen, speichern.
4. *Bereitstellen → Neue Bereitstellung* → Typ *Web-App*:
   *Ausführen als*: **Ich**, *Zugriff*: **Jeder** → *Bereitstellen*,
   Google-Konto autorisieren (Warnung „App nicht überprüft“ → *Erweitert →
   Weiter*, es ist dein eigenes Script). Die **Web-App-URL** (endet auf
   `/exec`) kopieren.
   Test: URL im Browser öffnen → `{"ok":true,"info":"Tennis Tracker Export bereit"}`.
5. **Zepp App** → Profil → GTR 3 → App-Einstellungen (bzw. *App-Liste*) →
   *Tennis Tracker* → **Script-URL** und **Token** eintragen.

Wird `Code.gs` später geändert: *Bereitstellungen verwalten → Bearbeiten →
Version: Neue Version*, sonst läuft die alte Version weiter (URL bleibt gleich).

### Export auf der Uhr

Statistik → *Export* → **Neue senden** oder **Alle senden**. Die Zepp App
muss auf dem Handy laufen (Bluetooth verbunden, Internet).

- **Neue** = Matches, die nach dem letzten erfolgreichen Export gestartet
  wurden. **Alle** = alle Matches (unabhängig vom Listenfilter).
- Gesendet wird in Paketen zu 10 Matches; nach jedem Paket merkt sich die
  Uhr den Fortschritt.
- Das Script schreibt eine Zeile pro Match. Ist die `id` schon im Sheet,
  wird die Zeile **aktualisiert** statt doppelt angelegt. *Alle senden* ist
  also jederzeit gefahrlos.
- Ergebnis auf der Uhr: „Fertig: x neu, y aktualisiert“. Der letzte Status
  steht auch in den App-Einstellungen in der Zepp App („Letzter Export“).

Fehlermeldungen: *Keine Script-URL* → Schritt 5; *Token falsch* → Token in
Zepp App und `Code.gs` vergleichen; *Keine Antwort vom Handy* → Zepp App
öffnen, Bluetooth prüfen.

### Spalten (Vertrag zwischen Uhr und Apps Script)

Definiert in `utils/export.js` (`EXPORT_COLUMNS`). Neue Spalten nur hinten
anhängen, bestehende nie umbenennen oder umsortieren. `id` ist eindeutig
(Matchstart in ms) und verhindert doppelte Zeilen. Neue Spalten aus einer
späteren App-Version hängt das Script automatisch hinten an.

| Spalte | Inhalt |
|---|---|
| `id` | eindeutige Match-ID (Startzeit, ms seit 1970) |
| `datum` | Matchstart, Ortszeit `2026-11-20 14:30` |
| `gegner` | Name oder leer |
| `format` | `1 Satz`, `2 Saetze + MTB`, `Best of 3`, `Match-TB` |
| `einstand` | `Ad` oder `No-Ad` |
| `status` | `vollstaendig` oder `abgebrochen` |
| `ergebnis` | `Sieg`, `Niederlage`, leer bei Abbruch |
| `stand` | Satzstand, z. B. `6:4 3:6 [10:7]`, bei Abbruch Stand zum Zeitpunkt |
| `saetze_ich`, `saetze_geg` | gewonnene Sätze |

Danach jeweils als Paar `<name>_ich`, `<name>_geg` (Anzahl, ganze Zahlen):

| name | Bedeutung |
|---|---|
| `punkte` | gewonnene Punkte |
| `aufschlag_pkt` / `aufschlag_gew` | Punkte bei eigenem Aufschlag / davon gewonnen |
| `return_pkt` / `return_gew` | Punkte bei gegnerischem Aufschlag / davon gewonnen |
| `asse` | Asse |
| `doppelfehler` | Doppelfehler |
| `servicewinner` | Service-Winner |
| `winner` | Winner |
| `unforced` | eigene Unforced Errors |
| `forced` | eigene Forced Errors |
| `ohne_kategorie` | gewonnene Punkte ohne Kategorie |

Prozentwerte (z. B. Aufschlagpunkte gewonnen) im Sheet berechnen:
`=aufschlag_gew_ich / aufschlag_pkt_ich`.

## Regeln

- Spiel: mit Vorteil oder No-Ad (bei 40:40 entscheidet ein Punkt), pro Match wählbar.
- Satz: 6 Spiele mit 2 Vorsprung, 7:5, bei 6:6 Tiebreak bis 7 (2 Vorsprung).
- Match-Tiebreak bis 10 (2 Vorsprung).
- Formate: *1 Satz*; *2 Sätze + MTB* (bei 1:1 Match-Tiebreak); *Best of 3*
  (3. Satz voll); *Nur Match-TB*.
- Aufschlag wechselt jedes Spiel. Tiebreak: A schlägt 1 Punkt auf, danach je 2.
  Wer im Tiebreak zuerst returniert hat, schlägt im nächsten Satz zuerst auf.

## Daten

Alles liegt im `/data`-Ordner der App (über `hmFS`):

| Datei | Inhalt |
|---|---|
| `match.json` | aktuelles/letztes Match, nach jedem Punkt und jeder Kategorie neu geschrieben |
| `matches.json` | Archiv-Index: ein Eintrag pro beendetem Match inkl. fertiger Statistik, neueste zuerst |
| `m_<id>.json` | vollständiges archiviertes Match mit Punktliste |
| `export.json` | `{ lastDate }`: Start des neuesten bereits gesendeten Matches |

Gespeichert werden Konfiguration + Punktliste; der Spielstand wird aus den
Punkten neu berechnet (Undo = letzten Punkt entfernen).

```json
{ "v": 1, "id": 1763632800000, "opponent": "Huber", "format": "bo2", "ad": true,
  "firstServer": "me", "startedAt": 1763632800000, "finished": false, "aborted": false,
  "points": [{ "w": "me", "c": "ace" }, { "w": "opp", "c": null }] }
```

Eintrag in `matches.json`:

```json
{ "id": 1763632800000, "date": 1763632800000, "opponent": "Huber", "format": "bo2",
  "ad": true, "status": "complete", "winner": "me", "setsWon": { "me": 2, "opp": 1 },
  "setLine": "6:4  3:6  [10:7]", "nPoints": 152, "me": { "points": 80, "ace": 3, "...": 0 },
  "opp": { "points": 72, "...": 0 } }
```

`status` ist `complete` oder `aborted`, `date` der Matchstart (ms).

Kategorien: `ace`, `df`, `sw` (Service-Winner), `winner`, `ue`, `fe`, `null`.
In der Statistik zählen Ass/Doppelfehler/Service-Winner für den Aufschläger,
Winner für den Punktgewinner, UE/FE für den, der den Fehler gemacht hat.

## Struktur

```
app.json                  Manifest, nur Target gtr3
utils/tennis.js           Zählregeln, Statistik, Archiv-Zusammenfassung (reines JS, getestet)
utils/storage.js          JSON lesen/schreiben in /data, Archiv
utils/ui.js               UI-Helfer, Seiten-URLs, Vibration
page/gtr3/home/           Startmenü
page/gtr3/setup/          Gegner → (Name) → Format → Einstand → Aufschlag
page/gtr3/match/          Spielstand, Eingabe, Kategorie-Overlay, Menü
page/gtr3/stats/          Statistik eines Matches oder Summe (scrollbar)
page/gtr3/history/        Match-Liste mit Filter
page/gtr3/export/         Export an Google Sheet (senden, Status)
utils/export.js           Exportformat (Spalten), Pakete (getestet)
app-side/index.js         Side Service (Handy): Daten an Apps Script senden
setting/index.js          Einstellungen in der Zepp App: Script-URL, Token
shared/                   Bluetooth-Messaging aus der offiziellen OS-1.0-Vorlage
apps-script/Code.gs       Google Apps Script für das Sheet (getestet mit Fake-Sheet)
test/                     node --test
```
