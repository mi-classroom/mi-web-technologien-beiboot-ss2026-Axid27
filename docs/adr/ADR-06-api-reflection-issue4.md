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
Auswirkung: `news-app/` sollte laut Ticket 1 eine rein statische Seite
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

## Änderungen an der Library
Keine. Alle drei Probleme wurden ausschließlich in `news-app/`
kompensiert (Koordinaten-Spiegelung, Vite-Workaround, Flanken-Erkennung).

Begründung: Die API war in ihrer aktuellen Form funktional ausreichend
— `Gesture`, `GestureInput`, `GestureOutput`, `GestureRecognizer` boten
alle nötigen Daten und Erweiterungspunkte, um `news-app/` ohne
Änderungen an `src/lib/` umzusetzen. Das bestätigt, dass das in
ADR-03/ADR-04 gewählte Design (Registry + einheitlicher Input-Contract)
strukturell trägt. Die gefundenen Probleme sind keine strukturellen
Mängel, sondern fehlende Dokumentation und fehlende Konsistenz-Garantien
zwischen einzelnen Gesten-Implementierungen.

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
