# The Daily Gesture — News App

Eine eigenständige News-Demoseite. Sie dient als Testanwendung für die
Gesture Library aus `body-tracking/src/lib/` (Issue #4) — die Seite
selbst enthält keine Gesten-Erkennungslogik, sondern konsumiert nur die
öffentlichen Exporte der Library (`GestureRecognizer`, `PistolGesture`,
`PistolGestureLeft`, `PointerGesture`, `ZoomGesture`).

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

| Geste | Ausführung | Wirkung |
| --- | --- | --- |
| **Go Forward** | Rechte Hand: Pistolen-Geste (Daumen hoch, Zeigefinger gestreckt), dann Zeigefinger einknicken | Fokus springt zum nächsten fokussierbaren Element (wie Tab) |
| **Go Back** | Linke Hand: Daumen + Zeigefinger gestreckt, restliche Finger angewinkelt, dann Zeigefinger einknicken | Fokus springt zum vorherigen fokussierbaren Element (wie Shift+Tab) |
| **Zoom / OK** | Linke Hand: Daumen-Tip und Zeigefinger-Tip berühren sich, restliche Finger gestreckt (OK-Zeichen), ca. 400ms halten | Aktiviert das aktuell fokussierte Element (Klick) |
| **Pointer** | Beide Hände: nur Zeigefinger gestreckt | Zeigt einen visuellen Cursor, der der rechten Hand folgt |

## Bekannte Einschränkungen

- Hände sollten frontal zur Kamera gehalten werden — seitlich gehaltene
  Hände verändern die y-Achsen-Verhältnisse der Landmarks, wodurch die
  Extended-Heuristiken der Library falsch feuern oder ausfallen können.
- Der `TOUCH_THRESHOLD` der Zoom-Geste ist auf einen mittleren
  Kameraabstand kalibriert und kann bei sehr naher oder sehr weiter
  Distanz zur Kamera ungenau werden.
- Schlechte Lichtverhältnisse verschlechtern die Erkennungsqualität von
  MediaPipe generell (siehe [ADR-01-Beobachtungen](../docs/observations/ADR-01-observations.md)).
- Es wird nur eine Person gleichzeitig unterstützt.

## Accessibility-Kontext

Diese App ist eine Demo für **freihändige, berührungslose Navigation**
als alternative Eingabemethode — gedacht für Szenarien, in denen Maus
und Tastatur unpraktisch oder nicht nutzbar sind, z. B. für Personen mit
eingeschränkter Feinmotorik, im Kiosk-/Public-Display-Kontext oder bei
Distanz zum Bildschirm. Die Gesten-Steuerung ist bewusst 1:1 auf die
Tastatur-Navigation (Tab / Shift+Tab / Aktivieren) abgebildet, damit sie
sich in bestehende, bereits barrierearme Seitenstrukturen (native `a`,
`button`, `tabindex="0"`) einfügt, statt eine eigene Interaktionslogik
zu erfinden.
