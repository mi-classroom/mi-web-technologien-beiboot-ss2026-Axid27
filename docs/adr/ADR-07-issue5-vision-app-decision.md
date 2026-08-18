# ADR-07 — Issue #5: Entscheidung Weg A und Gesten-Überarbeitung

## Status
Accepted

## Kontext
Issue #5 bot zwei Wege: Weg A (Vision-Anwendung) oder Weg B
(technische Vertiefung). Die Basis aus Issue #4 war eine minimale
News-App mit vier Gesten. Für eine überzeugende Demo fehlten
Tiefe im Inhalt und Vollständigkeit im Interaktionssystem.

## Entscheidung
Weg A — Erweiterung der News-App zu einer vollständigen
Gesten-Navigations-Demo mit überarbeitetem Gesten-System.

## Begründung gegenüber Weg B
Weg B (z.B. MediaPipe-Kapselung, Robustheit bei schlechten
Lichtverhältnissen) wäre technisch wertvoller für die Library,
aber im Video schwerer demonstrierbar. Weg A erlaubt das
Gesamtkonzept kohärent zu Ende zu denken.

## Überarbeitetes Gesten-System

### Verworfene Gesten
PistolGesture (rechts) und PistolGestureLeft (links) wurden in
dieser Anwendung bewusst nicht registriert. Ursprünglich für
go-forward/go-back (Tab-Navigation) vorgesehen, wurden sie durch
ScrollGesture + Anchor-Navigation ersetzt. Begründung: Scroll
ist natürlicher für eine Newsseite als diskrete Tab-Schritte.
Die Klassen bleiben in der Library erhalten für andere
Anwendungsfälle.

### Neue Gesten und Tuning-Prozess
Alle neuen Gesten durchliefen mehrere Iterationen:

PointerGesture:
  Ursprünglich beide Hände → auf rechte Hand beschränkt.
  Begründung: Klare Handaufteilung (rechts = zeigen, links = handeln)
  verhindert Konflikte wenn mehrere Gesten gleichzeitig aktiv sind.
  Später zusätzlich: Sensitivitäts-Verstärkung (Gain um die Bildmitte)
  in der News-App ergänzt, damit weniger Handbewegung für dieselbe
  Cursor-Strecke nötig ist — bewusst im Konsumenten (nicht in der
  Library), da es ein Screen-Mapping-Detail und keine Eigenschaft
  der rohen Trackingdaten ist.

ScrollGesture:
  Zwei Ansätze evaluiert:
  - Ansatz A: Handbewegung detektieren (Geschwindigkeit der Bewegung)
  - Ansatz B: Joystick-Metapher (y-Position der Hand relativ zur Mitte)
  Ansatz B gewählt wegen Robustheit gegenüber Tracking-Jitter.
  Bewegungsdetektion reagiert empfindlich auf kleine Schwankungen,
  Positionsdetektion ist stabiler.
  DEAD_ZONE = 0.1 verhindert ungewolltes Scrollen in Ruheposition.
  Tuning: MAX_OFFSET wurde von 0.4 auf 0.2 gesenkt, damit eine
  kleinere Handbewegung bereits volle Scroll-Geschwindigkeit erreicht
  (vorher war ein unnatürlich weites Hochstrecken der Hand nötig).
  STABILIZE_MS wurde von 400ms auf 300ms reduziert. Die Erkennung der
  offenen Hand (isThumbExtended) wurde zusätzlich präzisiert: sie prüft
  jetzt die volle Kette tip→ip→mcp wie die übrigen vier Finger, statt
  nur tip vs. mcp — ein halb angewinkelter Daumen zählte vorher noch
  als "gestreckt", wodurch Scroll auch ohne vollständig geöffnete Hand
  aktivierte.

ToggleGesture:
  Erste Idee: Winken (laterale Handbewegung) als Start/Stopp-Geste.
  Verworfen wegen hohem False-Positive-Risiko — normale Armbewegungen
  können wie Winken aussehen, Abgrenzung zu anderen Bewegungen schwierig.
  Gewählt: Beide Hände offen, 2 Sekunden halten.
  STABILIZE_MS = 2000 von Beginn an so gewählt — eine bewusst lange
  Aktivierungsdauer, um dieses "Kill switch"-Gesture nicht versehentlich
  während normaler Nutzung anderer Gesten auszulösen.
  Fortschrittsanzeige (value 0.0–1.0) gibt dem Nutzer visuelles
  Feedback während des Haltens.
  COOLDOWN_MS = 1500 verhindert sofortiges Rück-Togglen.

ZoomGesture (Klick-Geste):
  Drei Iterationen:
  1. Ursprüngliche Form: Daumen und Zeigefinger bilden einen Kreis,
     andere Finger gefaltet.
  2. Geändert zu OK-Zeichen: Daumen+Zeigefinger berühren sich,
     andere drei Finger gestreckt.
  3. Weiter vereinfacht zu reinem Pinch: nur noch die Berührung von
     Daumen- und Zeigefinger-Tip wird geprüft, die Anforderung an die
     übrigen drei Finger entfällt vollständig. Begründung: Die
     OK-Zeichen-Grundhaltung (drei Finger dauerhaft gestreckt halten)
     war unnatürlich anstrengend für eine häufig wiederholte
     Klick-Aktion; ein einfacher Pinch ist die natürlichere
     Grundhaltung.
  TOUCH_THRESHOLD empirisch auf stabilen Wert kalibriert —
  abhängig von Kameraabstand.

## Konzeptuelle Einordnung
Die Anwendung wurde initial als Accessibility-Tool konzipiert.
Im Verlauf der Implementierung hat sich gezeigt, dass das System
treffender als alternative Eingabemodalität beschrieben wird:
Es ersetzt klassische Peripheriegeräte durch Gestenerkennung,
ohne die vollständigen Anforderungen an ein WCAG-konformes
Accessibility-Tool zu erfüllen (fehlende Screenreader-Integration,
keine vollständige ARIA-Implementierung).

Seit dem "Point-to-select"-Feature fokussiert die PointerGesture
bereits programmatisch das Element unter dem Cursor
(`element.focus()`), wodurch native Screenreader-Fokusankündigungen
grundsätzlich funktionieren. Eine zusätzliche, explizite ARIA-Live-
Ankündigung (die z. B. gezielteren Text als den reinen Accessible
Name liefern könnte) wurde vorgeschlagen, aber zum Zeitpunkt dieses
ADRs noch nicht final entschieden oder umgesetzt — offener Punkt,
kein abgeschlossener Trade-off.

## Bekannte Einschränkungen
Drag-Interaktionen (z.B. Slider) sind mit dem aktuellen
Trigger-basierten System nicht umsetzbar. Ein Drag braucht einen
anhaltenden gedrückt-Zustand (mousedown+mousemove+mouseup).
Das aktuelle System kennt nur einmalige Trigger-Events und
kontinuierliche Stream-Ausgaben — kein "halten während Bewegung".
Eine zukünftige Hold-Geste könnte das adressieren.

## Konsequenzen
Vollständige Neudefinition der Handaufteilung gegenüber Issue #3.
Gesten-System ist kohärenter und robuster als in Issue #4,
aber auf Kosten von Komplexität in der Erkennungslogik.
