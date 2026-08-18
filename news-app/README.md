# The Daily Gesture — News App

Eine eigenständige News-Demoseite, ausschließlich per Handgesten
navigierbar. Ursprünglich als reine Testanwendung für die Gesture
Library aus `body-tracking/src/lib/` gestartet (Issue #4), seit Issue #5
zu einer vollständigen Gesten-Navigations-Demo ausgebaut (siehe
[ADR-07](../docs/adr/ADR-07-issue5-vision-app-decision.md)). Die Seite
selbst enthält keine Gesten-Erkennungslogik, sondern konsumiert nur die
öffentlichen Exporte der Library: `GestureRecognizer`, `PointerGesture`,
`ZoomGesture`, `ScrollGesture`, `ToggleGesture`.

## Starten

Die Library liegt nur als TypeScript-Quellcode vor und kann nicht direkt
per `<script>`-Tag im Browser geladen werden (siehe
[ADR-06](../docs/adr/ADR-06-api-reflection-issue4.md), Problem 2). Die
App benötigt deshalb — anders als ursprünglich für Ticket 1 geplant —
einen lokalen Vite-Dev-Server:

```bash
cd news-app
npm install
npm run dev
```

Anschließend im Browser öffnen (Adresse steht in der Konsolenausgabe,
i.d.R. `http://localhost:5173`). Kamerazugriff muss erlaubt werden.

## Unterstützte Gesten

| Geste | Hand | Ausführung | Wirkung |
| --- | --- | --- | --- |
| **Pointer** | Rechts | Nur Zeigefinger gestreckt, restliche Finger angewinkelt | Bewegt einen visuellen Cursor; fokussiert programmatisch das Element unter dem Cursor (Point-to-select) |
| **OK / Klick** | Links | Daumen-Tip und Zeigefinger-Tip berühren sich (Pinch) | Aktiviert das aktuell fokussierte Element (Klick) |
| **Scroll** | Links | Offene Hand (alle fünf Finger gestreckt); y-Position relativ zur Bildmitte bestimmt Richtung/Geschwindigkeit | Scrollt die Seite (Joystick-Metapher) |
| **Toggle** | Beide | Beide Hände offen, 2 Sekunden halten | Schaltet die Gestensteuerung an/aus (Statusanzeige oben rechts) |

`PistolGesture`/`PistolGestureLeft` (Tab-artige Fokus-Navigation aus
Issue #3/#4) wurden für diese App bewusst nicht registriert — Scroll +
Anchor-Navigation ersetzen sie, siehe ADR-07. Die Klassen bleiben in der
Library für andere Anwendungsfälle erhalten.

## Bekannte Einschränkungen

- Hände sollten frontal zur Kamera gehalten werden — seitlich gehaltene
  Hände verändern die y-Achsen-Verhältnisse der Landmarks, wodurch die
  Extended-Heuristiken der Library falsch feuern oder ausfallen können.
- Der `TOUCH_THRESHOLD` der Klick-Geste (Pinch) ist auf einen mittleren
  Kameraabstand kalibriert und kann bei sehr naher oder sehr weiter
  Distanz zur Kamera ungenau werden.
- Schlechte Lichtverhältnisse verschlechtern die Erkennungsqualität von
  MediaPipe generell (siehe [ADR-01-Beobachtungen](../docs/observations/ADR-01-observations.md)).
- Es wird nur eine Person gleichzeitig unterstützt.
- Drag-Interaktionen (z. B. Slider) sind mit dem aktuellen
  Trigger-/Stream-basierten Gestensystem nicht umsetzbar — es gibt kein
  "halten während Bewegung" (siehe ADR-07).

## Deployment

Deployed via Vercel mit `@vercel/static-build` (Option A, siehe
`vercel.json` im Repo-Root). `news-app/` hat bereits ein eigenes
Vite-Setup mit `npm run build` — Vite bündelt die per Cross-Folder-Import
eingebundene Gesture Library (`../body-tracking/src/lib/...`) beim Build
vollständig in `news-app/dist/` mit ein (verifiziert: keine
Laufzeit-Referenzen auf `body-tracking/` im Output). Ein Kopieren der
Library-Dateien nach `news-app/lib/` (Option B) war daher nicht nötig —
das hätte nur eine zweite, unabhängig zu pflegende Kopie der Gesten
geschaffen.

## Accessibility-Kontext

Diese App wurde initial als Accessibility-Tool für **freihändige,
berührungslose Navigation** konzipiert — gedacht für Szenarien, in denen
Maus und Tastatur unpraktisch oder nicht nutzbar sind, z. B. für
Personen mit eingeschränkter Feinmotorik, im Kiosk-/Public-Display-
Kontext oder bei Distanz zum Bildschirm.

Im Verlauf der Implementierung hat sich gezeigt, dass sie treffender als
**alternative Eingabemodalität** beschrieben wird statt als vollständiges
Accessibility-Tool (siehe ADR-07): Sie ersetzt klassische
Peripheriegeräte durch Gestenerkennung, erfüllt aber nicht alle
Anforderungen an WCAG-Konformität — insbesondere fehlt eine vollständige
Screenreader-/ARIA-Integration. Die Pointer-Geste fokussiert seit dem
Point-to-select-Feature bereits Elemente programmatisch
(`element.focus()`), wodurch native Fokus-Ankündigungen von
Screenreadern grundsätzlich greifen; eine zusätzliche, gezieltere
ARIA-Live-Ankündigung ist vorgeschlagen, aber noch offen.

Die Gesten-Steuerung ist bewusst nah an vertrauten Interaktionsmustern
(Zeigen, Klicken, Scrollen) gehalten, damit sie sich in bestehende,
bereits barrierearme Seitenstrukturen (native `a`, `button`,
`tabindex="0"`) einfügt, statt eine eigene Interaktionslogik zu
erfinden.
