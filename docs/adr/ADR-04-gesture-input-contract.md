# ADR-04 — GestureInput Contract

## Status
Accepted

## Kontext
Gesten benötigen unterschiedliche Landmark-Daten: manche eine Hand,
manche beide Hände, manche zusätzlich die Körperpose. Eine einheitliche
Schnittstelle ist Voraussetzung für den Polymorphismus der Registry.

## Entscheidung
GestureInput enthält immer alle verfügbaren Daten des aktuellen Frames
(leftHand, rightHand, pose, timestamp). Jede Geste extrahiert selbst
was sie benötigt und ignoriert den Rest.

## Verworfene Alternativen
Separate update()-Signaturen pro Geste: bricht Polymorphismus,
macht die Registry unmöglich da kein gemeinsames Interface existiert.

## Konsequenzen
Marginaler Overhead durch vollständige Datenübergabe pro Frame.
Klare, einheitliche Schnittstelle. ZoomGesture Phase 2 (Issue #4)
kann rightHand direkt aus dem bestehenden Input lesen ohne
Interface-Änderung.
