# ADR-02: Übergang von Rohdaten zu Gestenvokabular (Body Tracking Abstraktion)

## Status

In Progress

## Kontext

Nach dem erfolgreichen Proof of Concept für browserbasiertes Body Tracking (MediaPipe) liegt ein stabiler Datenstrom aus Körper-, Hand- und Gesichtspunkten in Echtzeit vor.

Die nächste Herausforderung besteht darin, diese Rohdaten nicht direkt zu konsumieren, sondern in **semantisch interpretierbare Interaktionen (Gesten)** zu überführen.

Ziel dieser Phase ist es, ein konsistentes **Gestenvokabular (Gesture Vocabulary)** zu definieren, das als Abstraktionsschicht zwischen Rohkoordinaten und späteren Anwendungssystemen dient.

Dabei stellt sich insbesondere die Frage:

> Wann wird eine Bewegung zu einer Geste?

## Entscheidungsgrundlage

Die Gestaltung des Gestenvokabulars basiert auf folgenden Designprinzipien:

* **Eindeutigkeit**: Gesten dürfen nicht leicht mit normalen Bewegungen verwechselt werden.
* **Bewegungsamplitude**: Mikrobewegungen sind auf Distanz nicht zuverlässig detektierbar.
* **Zeitliche Begrenzung**: Kurze Gesten sind robuster und reduzieren Ermüdung.
* **Intuitive Semantik**: Gesten sollen natürlich interpretierbar sein (z. B. „Wischen“ für Navigation).
* **Symmetrie**: Vorwärts-/Rückwärtsaktionen sollen spiegelbildlich funktionieren.
* **Zustandsarmut**: Minimierung komplexer Moduslogik zur Reduktion von Fehlern und False Positives.

Diese Prinzipien leiten sowohl das Design als auch die spätere Implementierung der Erkennung.

## Gestenvokabular (Interaktionsmodell)

Im Rahmen der Analyse wurden acht zentrale Interaktionsmuster definiert, die als Grundlage für die spätere Implementierung dienen.

### Navigation

| Interaktion | Nahbereich (Geste)                                                | Daten & Reliabilität                                         | Fernbereich (Geste)   | Daten & Reliabilität                       |
| ----------- | ----------------------------------------------------------------- | ------------------------------------------------------------ | --------------------- | ------------------------------------------ |
| Gehe vor    | „Pistolengeste“: ausgestreckter Zeigefinger + Daumen (linke Hand) | Hand-Landmarks: Stabilität von Daumen & Zeigefinger über ~1s | Arm zeigt nach rechts | Pose-Koordinaten, Stabilität > 1s im Raum  |
| Gehe zurück | Pistolengeste nach links                                          | Hand-Landmarks: Daumen & Zeigefinger stabil (~1s)            | Arm zeigt nach links  | Pose-Koordinaten, stabil im Tracking-Fence |

### Steuerung / Pointer

| Interaktion | Nahbereich (Geste)                                               | Daten & Reliabilität                | Fernbereich (Geste)                         | Daten & Reliabilität             |
| ----------- | ---------------------------------------------------------------- | ----------------------------------- | ------------------------------------------- | -------------------------------- |
| Pointer     | „Trump-Geste“: zwei ausgestreckte Finger (Zeiger + Steuerfinger) | Hand-Detection der Fingerpositionen | Ein Arm oben + offene Hand als Steuerfläche | Pose + Hand Landmarks kombiniert |

### Systemsteuerung

| Interaktion           | Nahbereich (Geste)                          | Daten & Reliabilität         | Fernbereich (Geste)  | Daten & Reliabilität                              |
| --------------------- | ------------------------------------------- | ---------------------------- | -------------------- | ------------------------------------------------- |
| Pause / Unterbrechung | Blick nach oben (aus Bildschirmfeld heraus) | Eye-Tracking (experimentell) | Rücken zur Kamera    | Face/Pose Detection: Verlust der Frontausrichtung |
| Start                 | Beide Daumen hoch                           | Hand-Landmarks stabil        | Beide Arme nach oben | Pose Detection robust                             |
| Stopp                 | Arme bilden X-Form                          | Pose Detection               | Arme X-Form          | Pose Detection stabil                             |

### Zoom / Skalierung

| Interaktion     | Nahbereich (Geste) | Daten & Reliabilität                        | Fernbereich (Geste)                    | Daten & Reliabilität                      |
| --------------- | ------------------ | ------------------------------------------- | -------------------------------------- | ----------------------------------------- |
| Zoom In (+200%) | Pinch-Geste        | Hand-Landmarks (Daumen/Zeigefinger Distanz) | Arme diagonal halten (1s)              | Pose-Koordinaten stabilisiert             |
| Zoom Out (50%)  | Reverse Pinch      | Hand-Landmarks                              | Arme diagonal → zur Körpermitte führen | Pose + relative Bewegung über Zeitfenster |

## Technische Ableitungen

Aus der Analyse ergeben sich folgende systemische Anforderungen:

* Einführung einer **zeitbasierten Stabilisierung (Sliding Window ~1s)** zur Reduktion von Noise
* Kombination aus **Hand- und Pose-Landmarks** für unterschiedliche Distanzbereiche
* Einführung eines zukünftigen **Gesture Recognition Layers** zwischen Rohdaten und UI-Logik
* Bedarf an **Multi-Signal-Fusion** (z. B. Hand + Pose + optional Face/Eye Tracking)

## Erkenntnisse

* Nah- und Fernbereich benötigen unterschiedliche Repräsentationen derselben Interaktion
* Gesten müssen redundant definierbar sein (Fallback zwischen Hand- und Pose-Modus)
* Einige Interaktionen (z. B. Pause via Blickrichtung) sind aktuell noch experimentell und datenabhängig unsicher
* Besonders robuste Signale entstehen bei großflächigen Körperbewegungen (Arme, Haltung)

## Konsequenz

* Das System wird nicht direkt auf MediaPipe-Rohdaten aufbauen, sondern eine **Abstraktionsschicht für Gesteninterpretation** einführen.
* Die Implementierung wird zunächst auf eine reduzierte Menge stabiler Gesten (MVP-Satz) heruntergebrochen.
* Unsichere Modalitäten (Eye-Tracking, Mehrsignal-Fusion) werden als spätere Erweiterungen behandelt.
