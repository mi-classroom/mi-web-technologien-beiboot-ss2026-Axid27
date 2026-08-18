# ADR-03 — Gesture Library Architecture

## Status
Accepted

## Kontext
Gesten waren direkt in main.ts und einzelnen Dateien ohne gemeinsames
Interface implementiert. Issue #3 fordert eine erweiterbare, testbare
Library-Struktur, die neue Gesten aufnehmen kann ohne bestehenden Code
zu verändern.

## Entscheidung
Registry-basierte GestureRecognizer-Klasse mit gemeinsamem Gesture-Interface.
Neue Gesten werden per register() hinzugefügt ohne Library-Code zu ändern.
Das GestureInput-Interface enthält immer alle verfügbaren Sensordaten
eines Frames — jede Geste extrahiert selbst was sie benötigt.

## Verworfene Alternativen
- Event-Emitter-Ansatz: zu viel Komplexität für den akademischen Kontext,
  schwerer erklärbar im Review
- Functional/Plugin-Ansatz: State-Management (Cooldown, EMA-Smoothing)
  schwieriger ohne Klassen abzubilden

## Konsequenzen
Open/Closed Principle umgesetzt. Polymorphismus durch Gesture-Interface
erzwungen. Leicht erklärbar und verteidigbar.

Skalierungsgrenze: Das GestureInput-Interface muss erweitert werden,
sobald neue Datentypen hinzukommen (z.B. Tiefenkamera, IMU-Sensoren,
zweiter Nutzer). Dies ist kein Fehler im Design, sondern eine bewusste
Entscheidung für Einfachheit im aktuellen Scope. Konsequenz daraus:
Das Gestenvokabular und alle Interaktionsmuster sollten frühzeitig und
vollständig definiert werden, bevor die Library-API eingefroren wird.
Nachträgliche Erweiterungen des Interfaces sind möglich, erfordern aber
Anpassungen in allen registrierten Gesten.

## Beobachtungen aus der Implementierung
- Hände sollten frontal zur Kamera gehalten werden. Seitlich gehaltene
  Hände verändern die y-Achsen-Verhältnisse der Landmarks, wodurch die
  isExtended()-Heuristik (lm[tip].y < lm[pip].y < lm[mcp].y) falsch
  feuert oder ausfällt. Dies ist eine bekannte Einschränkung der
  2D-Landmark-basierten Erkennung ohne Tiefendaten.
- Der TOUCH_THRESHOLD für die ZoomGesture (OK-Form) ist abhängig vom
  Kameraabstand und muss ggf. kalibriert werden.

## Update Issue #5 — Gesten-Tuning und Handaufteilung

Im Verlauf von Issue #5 wurde die Handaufteilung grundlegend
überarbeitet. Die ursprüngliche Architektur sah keine feste
Zuweisung von Gesten zu Händen vor — jede Geste definierte
selbst welche Hand(landmark)daten sie nutzt.

In Issue #5 wurde eine explizite Konvention eingeführt:
  Rechte Hand → Pointer/Cursor (zeigen)
  Linke Hand  → Aktionsgesten (handeln)

Diese Konvention ist nicht in der Library erzwungen, sondern
eine Anwendungsentscheidung der News-App. Die Library bleibt
hand-agnostisch — sie liefert leftHand und rightHand im
GestureInput, jede Geste entscheidet selbst.
