# ADR-05 — Bewusste Duplizierung statt Vererbung

## Status
Accepted

## Kontext
PistolGestureLeft ist strukturell fast identisch mit PistolGesture.
Eine gemeinsame Basisklasse wäre technisch möglich.

## Entscheidung
Bewusste Duplizierung statt gemeinsamer Basisklasse oder
Higher-Order-Function.

## Begründung
KISS-Prinzip: Eine abstrakte Basisklasse würde Komplexität erhöhen
für ca. 30 Zeilen Code-Ersparnis. Beide Klassen können sich
unabhängig entwickeln, falls sich die Erkennungslogik für linke
und rechte Hand unterschiedlich entwickelt (z.B. andere Thresholds,
andere Trigger-Bedingungen je nach Anwendungskontext).

## Konsequenzen
Beide Dateien müssen gepflegt werden wenn sich die Pistol-Logik
grundlegend ändert. Bewusst akzeptiert.
