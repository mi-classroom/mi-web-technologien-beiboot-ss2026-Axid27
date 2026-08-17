# ADR-06 — API-Reflexion: Gesture Library im Anwendungseinsatz

## Status
Accepted

## Kontext
Issue #4 fordert den Einsatz der Gesture Library in einer eigenständigen
Anwendung (`news-app/`), um API-Schwächen zu identifizieren, die aus der
Bibliothek selbst heraus nicht sichtbar sind. `news-app/` nutzt
ausschließlich die öffentlichen Exporte aus `body-tracking/src/lib/`.

## Beobachtete API-Probleme

### Problem 1: Koordinaten-Konvention ist nicht dokumentiert
Beschreibung: `PointerGesture.update()` liefert `position: { x, y }` als
rohe, normalisierte MediaPipe-Landmark-Koordinaten (0.0–1.0). Die
Bibliothek spiegelt `x` nicht. Nirgends — weder im `Gesture`-Interface
noch in `GestureOutput` noch im Docstring von `PointerGesture` — steht,
dass Konsumenten die x-Achse selbst spiegeln müssen, um ein natürliches
"Hand nach rechts → Cursor nach rechts"-Verhalten für eine gespiegelte
Kamera-Ansicht zu bekommen.
Auswirkung: Ohne Kenntnis der bestehenden `canvasPoint()`-Hilfsfunktion
in `body-tracking/src/main.ts` hätte die Cursor-Implementierung in
`news-app/app.js` sich exakt spiegelverkehrt zur Handbewegung bewegt.
Der einzige Weg, das herauszufinden, war der direkte Vergleich mit dem
bereits bestehenden Konsumenten-Code — nicht die API selbst.
Lösung: In `news-app/app.js` wird `x` beim Rendern des Cursors manuell
gespiegelt (`(1 - x) * window.innerWidth`), mit Kommentar, der auf diese
Notwendigkeit hinweist. Die Library selbst wurde nicht geändert.

### Problem 2: Kein öffentlicher Einstiegspunkt, kein Browser-Build
Beschreibung: `src/lib/` hat kein `index.ts`/Barrel-File. Jede Klasse
liegt als einzelne `.ts`-Datei vor (`GestureRecognizer.ts`,
`gestures/pistol.ts`, `gestures/zoom.ts`, …), die nur als TypeScript-
Quellcode existiert — kein kompiliertes Browser-Bundle, kein
`package.json`-Eintrag, der eine Nutzung außerhalb von `body-tracking/`
vorsieht.
Auswirkung: `news-app/` sollte erst eine rein statische Seite
ohne Build-Step sein. Um die Library trotzdem zu nutzen, musste
`news-app/` zu einem eigenen Vite-Projekt mit eigener `package.json`
und `vite.config.js` (inkl. `server.fs.allow`) ausgebaut werden — nur
damit der Browser die `.ts`-Syntax überhaupt laden kann. Zusätzlich
müssen alle vier Gesten-Klassen einzeln aus ihrem internen Dateipfad
importiert werden (`../body-tracking/src/lib/gestures/pistol` statt
z. B. `../body-tracking/src/lib`), was die interne Ordnerstruktur der
Library nach außen offenlegt.
Lösung: Kein Fix in der Library — als Workaround dient der eigene
Vite-Dev-Server in `news-app/`. Das API-Problem bleibt bestehen.

### Problem 3: Inkonsistente Trigger-Semantik zwischen Gesten
Beschreibung: `PistolGesture`/`PistolGestureLeft` sind "edge-triggered"
— dank interner Cooldown-State-Machine liefern sie `triggered: true`
exakt einmal pro Aktion. `ZoomGesture` ist dagegen "level-triggered" —
sie liefert `triggered: true` auf jedem einzelnen Frame, solange die
OK-Geste gehalten wird, ohne eigene Cooldown-Logik.
Auswirkung: Eine naive Implementierung von `zoom → element.click()`
hätte das fokussierte Element mehrfach pro Sekunde aktiviert, solange
die Geste gehalten wird. Das `Gesture`-Interface und `GestureOutput`
machen an keiner Stelle kenntlich, welches Verhalten für eine gegebene
Geste zu erwarten ist — das lässt sich nur durch Ausprobieren oder
Quellcode-Lektüre herausfinden.
Auswirkung/Lösung: `news-app/app.js` trackt selbst den Vorframe-Zustand
(`zoomWasActive`), um eine Flanken-Erkennung nachzubauen. Die Library
wurde nicht geändert — das Problem ist rein dokumentarisch/konzeptionell
und beträfe jede neue Geste mit kontinuierlichem Trigger-Verhalten.

### Problem 4: `update()` vermischt diskrete Events und kontinuierliche Stream-Daten
Beschreibung: `GestureRecognizer.update()` gab bisher ein `GestureEvent[]`
zurück, das sowohl echte, einmalige Trigger (`go-forward`) als auch
kontinuierliche, pro Frame aktualisierte Stream-Daten (`pointer.position`)
im selben Array mischte — unterscheidbar nur daran, welches optionale
Feld (`triggered`, `position`, `value`) auf dem `GestureOutput` gerade
gesetzt war. Der Konsument musste raten bzw. den Quellcode lesen, um zu
verstehen, dass ein "Event" mit `position` eigentlich kein Event im
Sinne von "etwas ist passiert" ist, sondern ein Polling-Wert.
Auswirkung: Der Code zum Lesen der Pointer-Position
(`if (event.name === 'pointer' && event.output.position) { ... }`)
funktionierte, wirkte aber konzeptionell falsch — ein "Event" mit einer
kontinuierlichen Position ist für Konsumenten der Library unintuitiv und
verleitet dazu, Positions-Handling versehentlich an Event-Handling-Logik
(z. B. Debouncing) zu koppeln, die dafür nicht gedacht ist.
Lösung (diesmal **in der Library**, nicht nur im Konsumenten):
`GestureRecognizer` trennt jetzt beide Konzepte:
- `update(input)` gibt nur noch echte Trigger-Events zurück
  (`output.triggered === true`).
- Neue Methode `getOutput(name): GestureOutput | null` liefert den
  zuletzt berechneten Output einer Geste zum Pollen — parallel zur
  bereits bestehenden `getState()`.

  Konsumenten lesen die Pointer-Position jetzt so:
  ```ts
  const events = recognizer.update(input);          // nur Trigger
  const position = recognizer.getOutput('pointer')?.position; // Stream
  ```
  `body-tracking/src/main.ts` und `news-app/app.js` wurden entsprechend
  angepasst.

## Änderungen an der Library
Für Problem 4 ja — `GestureRecognizer.update()`/`getOutput()` wie oben
beschrieben. Für die Probleme 1–3 keine; diese wurden ausschließlich in
`news-app/` kompensiert (Koordinaten-Spiegelung, Vite-Workaround,
Flanken-Erkennung) und bleiben als offene, dokumentierte API-Schwächen
bestehen.

Begründung: Für Problem 4 war eine reine Konsumenten-seitige Umgehung
nicht sinnvoll möglich — das Problem liegt strukturell in der Rückgabeform
von `update()` selbst, nicht in der Auswertung durch den Konsumenten.
Für die Probleme 1–3 reichte die bestehende API funktional aus (alle
nötigen Daten waren vorhanden), sodass ein Fix in der Library dort nicht
zwingend nötig war. Das bestätigt insgesamt, dass das in ADR-03/ADR-04
gewählte Grunddesign (Registry + einheitlicher Input-Contract) trägt —
die gefundenen Probleme betreffen Dokumentation, Konsistenz zwischen
Gesten-Implementierungen und, im Fall von Problem 4, eine einzelne, klar
abgegrenzte Design-Entscheidung in `GestureRecognizer`.

## Erkenntnisse für zukünftige Issues
- **Koordinaten-Konvention dokumentieren**: JSDoc an `GestureOutput.position`
  ergänzen, das explizit festhält, dass die Koordinaten normalisiert und
  nicht gespiegelt sind.
- **Öffentlichen Einstiegspunkt schaffen**: Ein `src/lib/index.ts`-Barrel,
  das `GestureRecognizer`, die Typen aus `types.ts` und alle Gesten-Klassen
  re-exportiert, damit Konsumenten nicht in die interne Ordnerstruktur
  importieren müssen.
- **Trigger-Semantik vereinheitlichen oder kennzeichnen**: Entweder alle
  Gesten konsequent edge-triggered gestalten, oder `GestureOutput`/den
  `Gesture`-Vertrag um eine explizite Kennzeichnung erweitern (z. B.
  `triggerMode: 'edge' | 'level'`), damit Konsumenten nicht rätseln müssen.
- **MediaPipe-Initialisierung**: Aktuell muss jede konsumierende App
  Kamera-Setup, `FilesetResolver`, `PoseLandmarker`/`HandLandmarker` und
  die Handedness-Auflösung komplett selbst implementieren (in `news-app/`
  eine Kopie der ~60 Zeilen aus `body-tracking/src/main.ts`). Für Issue #5
  lohnt sich die Überlegung, ob die Library einen optionalen Helper für
  Kamera- und Modell-Setup anbieten sollte, statt dass jeder Konsument das
  Boilerplate dupliziert.
- **Event/Stream-Trennung ist jetzt Präzedenzfall**: Problem 4 wurde
  direkt in der Library gelöst (`update()` + `getOutput()`), statt es nur
  zu dokumentieren. Für Issue #5 sollte jede neue Geste von vornherein
  klar einordnen, ob sie ein diskretes Trigger-Event oder kontinuierliche
  Stream-Daten liefert, statt beides über dieselben `GestureOutput`-Felder
  zu vermischen.
