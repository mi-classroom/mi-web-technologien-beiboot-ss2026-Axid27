# The Daily Gesture — News App

Eine eigenständige, statische News-Demoseite. Sie dient als Testanwendung
für die Gesture Library aus `body-tracking/src/lib/` (Issue #4) — die
Seite selbst enthält kein Gesture-Tracking-Code, sondern konsumiert nur
die öffentliche API der Library.

## Starten

Da die Seite rein statisch ist (HTML/CSS/JS ohne Build-Step), reicht ein
lokaler HTTP-Server, zum Beispiel:

```bash
cd news-app
npx serve .
```

oder mit Python:

```bash
cd news-app
python3 -m http.server 8000
```

Anschließend im Browser öffnen (z.B. `http://localhost:8000`).

## Unterstützte Gesten

_Platzhalter — wird in Ticket 2/5 mit der Gesture-Library-Integration
ergänzt._
