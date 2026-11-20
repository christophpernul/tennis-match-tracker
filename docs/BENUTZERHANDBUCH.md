# Tennis Tracker – Benutzerhandbuch

Tennis-Matches auf der **Amazfit GTR 3** mitzählen: Spielstand, Aufschlag,
Kategorie jedes Punktes (Ass, Winner, Fehler …), Statistik pro Match und
über alle Matches, Export in ein Google Sheet.

- [1. Installieren und aktualisieren](#1-installieren-und-aktualisieren)
- [2. Startmenü](#2-startmenü)
- [3. Neues Match starten](#3-neues-match-starten)
- [4. Während des Matches](#4-während-des-matches)
- [5. Match pausieren oder beenden](#5-match-pausieren-oder-beenden)
- [6. Statistik](#6-statistik)
- [7. Export nach Google Sheets](#7-export-nach-google-sheets)
- [8. Zählregeln](#8-zählregeln)
- [9. Tipps und Probleme](#9-tipps-und-probleme)

---

## 1. Installieren und aktualisieren

Die App wird über den Entwicklermodus der Zepp App installiert.

**Einmalig auf dem Handy:** Zepp App → *Profil → Einstellungen → Über* →
7× auf das Zepp-Logo tippen. Damit ist der Entwicklermodus aktiv.

**Installieren / Update** (am PC im Projektordner):

```powershell
zeus preview
```

GTR 3 auswählen → es erscheint ein QR-Code. In der Zepp App:
*Profil → GTR 3 → Developer Mode → Scan* → QR-Code scannen. Die neue Version
ersetzt die alte, gespeicherte Matches bleiben erhalten.

---

## 2. Startmenü

| Button | Funktion |
|---|---|
| **Fortsetzen** | Offenes (pausiertes) Match weiterspielen |
| **Neues Match** | Neues Match einrichten |
| **Statistik** | Liste aller beendeten Matches, Summen, Export |

---

## 3. Neues Match starten

Fünf kurze Schritte, je ein Tipp:

1. **Gegner** – einen der zuletzt gespielten Gegner wählen, *Neuer Name*
   oder *Ohne Name*.
2. **Name eingeben** (nur bei *Neuer Name*) – Buchstaben antippen.
   `_` = Leerzeichen, `<` = letztes Zeichen löschen, dann **Fertig**.
   Wortanfänge werden automatisch großgeschrieben, max. 16 Zeichen.
   Keine Umlaute: *Müller* → *Mueller*.
3. **Format**
   - *1 Satz*
   - *2 Sätze + MTB* – bei 1:1 Sätzen entscheidet ein Match-Tiebreak bis 10
   - *Best of 3* – der 3. Satz wird voll ausgespielt
   - *Nur Match-TB* – das ganze Match ist ein Match-Tiebreak bis 10
4. **Einstand** – *Mit Vorteil* oder *No-Ad* (bei 40:40 entscheidet ein
   Punkt). Entfällt bei *Nur Match-TB*.
5. **Wer schlägt auf?** – *Ich* oder der Gegner. Danach geht es sofort los.

> Ist noch ein Match offen, wird es beim Start des neuen automatisch als
> *abgebrochen* gespeichert – es geht nichts verloren.

---

## 4. Während des Matches

```
        6:4  3:2            ← Sätze / aktueller Satz (TB = Tiebreak)
   ICH (A)     HUBER        ← (A) gelb = schlägt auf
  ┌────────┐ ┌────────┐
  │   30   │ │   15   │    ← Spielstand 0/15/30/40/AD
  └────────┘ └────────┘
       [  UNDO  ]
```

### Punkte zählen

| Eingabe | Wirkung |
|---|---|
| Linke Hälfte (blau) antippen **oder** obere Taste kurz | Punkt für mich |
| Rechte Hälfte (rot) antippen **oder** untere Taste kurz | Punkt für den Gegner |
| **UNDO** | letzten Punkt zurücknehmen |

Der Punkt zählt **sofort beim Berühren**, die Uhr vibriert kurz.
UNDO vibriert länger, damit man es unterscheidet. Spielstand, Spiele, Sätze,
Tiebreaks und der Aufschlagwechsel laufen automatisch.

### Kategorie des Punktes

Nach jedem Punkt erscheint für 6 Sekunden eine Auswahl. Angeboten wird nur,
was zur Situation passt:

| Punkt gewinnt … | Auswahl |
|---|---|
| der Aufschläger | Ass · Service-Winner · Winner · UE/FE des Rückschlägers |
| der Rückschläger | Doppelfehler · Winner · UE/FE des Aufschlägers |

*UE* = Unforced Error (unerzwungener Fehler), *FE* = Forced Error
(erzwungener Fehler). „UE Gegner“ heißt: der Gegner hat den Fehler gemacht.

- **Nichts wählen** ist erlaubt: nach Ablauf des Countdowns (`OK 6 … 1`)
  bleibt der Punkt *ohne Kategorie*.
- **OK** schließt sofort ohne Kategorie.
- **UNDO** nimmt den gerade gezählten Punkt zurück (z. B. falsche Seite).
- Ein **Tastendruck** zählt direkt den nächsten Punkt.

### Display

Die App hält das Display bis zu 30 Minuten an und bleibt auch geöffnet,
wenn es sich ausschaltet. Beim Aufwachen siehst du wieder den Spielstand.
Alles wird **nach jedem Punkt gespeichert** – auch bei Absturz oder leerem
Akku ist der Stand nicht verloren.

### Weitere Tasten

| Eingabe | Wirkung |
|---|---|
| Obere Taste **lang** | Statistik des laufenden Matches (Taste oder Wischen → zurück) |
| Untere Taste **lang** | Menü (siehe 5.) |
| Wischen nach rechts | gesperrt, damit man das Match nicht versehentlich verlässt |

---

## 5. Match pausieren oder beenden

Untere Taste **lang** drücken → Menü:

- **Weiterspielen** – Menü schließen.
- **Pausieren** – Match verlassen. Es bleibt offen; im Startmenü mit
  **Fortsetzen** weiterspielen.
- **Match beenden** → Sicherheitsfrage → **Ja, beenden**. Das Match wird
  mit dem aktuellen Stand als *abgebrochen* gespeichert und die Statistik
  angezeigt. Ein Match ohne Punkte wird einfach verworfen.

Ein Match, das regulär zu Ende gespielt wird, wird automatisch gespeichert
und die Statistik öffnet sich. Wer den Matchball per UNDO zurücknimmt, kann
weiterspielen.

---

## 6. Statistik

Startmenü → **Statistik** → Match-Liste (neueste oben):

| Farbe | Bedeutung | Anzeige rechts |
|---|---|---|
| grün | Sieg | gewonnene Sätze, z. B. `2:1` |
| rot | Niederlage | gewonnene Sätze |
| grau | abgebrochen | Stand beim Abbruch, z. B. `6:4 3:2` |

- **Filter** – wechselt zwischen *Alle*, *Vollständig*, *Abgebrochen*.
- **Summe** – zusammengerechnete Statistik aller Matches im Filter, mit
  Anzahl Siege / Niederlagen / Abbrüche.
- **Match antippen** – Statistik dieses Matches mit Datum, Gegner, Format
  und Satzstand.
- **Export** – siehe 7.

### Werte

| Zeile | Bedeutung |
|---|---|
| Punkte | gewonnene Punkte |
| Aufschlag gew. | % der Punkte bei eigenem Aufschlag gewonnen |
| Return gew. | % der Punkte bei gegnerischem Aufschlag gewonnen |
| Asse, Doppelfehler, Service-Winner | beim eigenen Aufschlag |
| Winner | Gewinnschläge |
| Unforced / Forced Err. | **eigene** Fehler |
| Ohne Kategorie | gewonnene Punkte, für die keine Kategorie gewählt wurde |

---

## 7. Export nach Google Sheets

Die Uhr schickt die Matches über die Zepp App an ein Google Apps Script,
das sie in ein Google Sheet in **deinem Google Drive** schreibt
(Tabellenblatt `Matches`, eine Zeile pro Match).

### Einmalige Einrichtung

1. In Google Drive ein **neues Google Sheet** anlegen.
2. Im Sheet: *Erweiterungen → Apps Script*. Den vorhandenen Code löschen und
   den Inhalt von [`apps-script/Code.gs`](../apps-script/Code.gs) einfügen.
3. In der Zeile `var TOKEN = "HIER-GEHEIMES-WORT-EINTRAGEN";` ein eigenes
   geheimes Wort eintragen. Speichern.
4. *Bereitstellen → Neue Bereitstellung* → Zahnrad → **Web-App**.
   *Ausführen als:* **Ich**, *Zugriff:* **Jeder** → *Bereitstellen*.
   Google fragt nach Zugriff auf dein Konto; bei „App nicht überprüft“ →
   *Erweitert → Weiter* (es ist dein eigenes Script).
5. Die **Web-App-URL** kopieren (endet auf `/exec`). Zum Testen im Browser
   öffnen – es muss „Tennis Tracker Export bereit“ erscheinen.
6. **Zepp App** → *Profil → GTR 3 → App-Einstellungen → Tennis Tracker* →
   **Script-URL** und **Token** eintragen.

> URL und Token zusammen erlauben das Schreiben in dein Sheet. Nicht
> weitergeben und nicht in ein öffentliches Repository einchecken.

### Exportieren

Auf der Uhr: **Statistik → Export**

- **Neue senden** – nur Matches seit dem letzten Export.
- **Alle senden** – alle Matches. Schon vorhandene Zeilen werden
  aktualisiert, nicht doppelt angelegt; das ist also jederzeit möglich.

Die Zepp App muss auf dem Handy laufen (Bluetooth + Internet). Am Ende
zeigt die Uhr z. B. „Fertig: 3 neu, 0 aktualisiert“. Der letzte Status
steht auch in den App-Einstellungen in der Zepp App unter *Letzter Export*.

### Im Sheet auswerten

Die Spalten heißen z. B. `datum`, `gegner`, `status`, `ergebnis`, `stand`,
`punkte_ich`, `punkte_geg`, `asse_ich`, `unforced_geg` … (vollständige
Liste in der [README](../README.md#spalten-vertrag-zwischen-uhr-und-apps-script)).
Prozentwerte selbst berechnen, z. B. Aufschlagpunkte gewonnen:
`= aufschlag_gew_ich / aufschlag_pkt_ich`. Eigene Auswertungen am besten
auf einem **eigenen Tabellenblatt** anlegen; das Blatt `Matches` wird vom
Script beschrieben.

Wird `Code.gs` später geändert: *Bereitstellen → Bereitstellungen verwalten
→ Bearbeiten → Version: Neue Version*. Die URL bleibt gleich.

---

## 8. Zählregeln

- **Spiel:** 0, 15, 30, 40, Spiel. Mit Vorteil: bei 40:40 Einstand / Vorteil
  bis zwei Punkte Vorsprung. No-Ad: bei 40:40 entscheidet ein Punkt.
- **Satz:** 6 Spiele mit zwei Vorsprung (6:4, 7:5); bei 6:6 Tiebreak bis 7
  mit zwei Punkten Vorsprung.
- **Match-Tiebreak:** bis 10 mit zwei Punkten Vorsprung, zählt als Satz.
- **Aufschlag:** wechselt jedes Spiel. Im Tiebreak schlägt der erste
  Spieler einen Punkt auf, danach jeweils zwei. Wer im Tiebreak zuerst
  returniert hat, schlägt im nächsten Satz zuerst auf.
- Seitenwechsel werden nicht angezeigt.

---

## 9. Tipps und Probleme

| Problem | Lösung |
|---|---|
| Falsche Seite getippt | sofort **UNDO** (auch in der Kategorie-Auswahl) |
| Kategorie falsch gewählt | **UNDO** und den Punkt neu zählen |
| App versehentlich verlassen | Startmenü → **Fortsetzen** |
| Export: „Keine Script-URL …“ | Einrichtung Schritt 6 |
| Export: „Token falsch“ | Token in Zepp App und `Code.gs` vergleichen (Groß-/Kleinschreibung) |
| Export: „Keine Antwort vom Handy“ | Zepp App öffnen, Bluetooth prüfen, erneut senden |
| Export: „Handy ohne Internet?“ | Internetverbindung des Handys prüfen |
| Akku | Display bleibt während des Matches an; nach dem Match die App verlassen |

Gespeichert wird nur auf der Uhr (und nach dem Export im Google Sheet).
Wird die App auf der Uhr deinstalliert, sind nicht exportierte Matches weg –
vorher **Alle senden**.
