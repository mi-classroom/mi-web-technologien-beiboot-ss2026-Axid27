# Gesture Detection — 2D Landmark Assumptions

## Kontext

Die Finger-Extension-Erkennung in `src/gestures/pistol.ts` basiert auf einem
y-Koordinaten-Vergleich der MediaPipe Hand Landmarks (normalisierte 2D-Bildkoordinaten,
y wächst nach unten).

## Annahme

Ein Finger gilt als **extended**, wenn die Landmarken in der Reihenfolge
`tip.y < pip.y < mcp.y` liegen — also jeder Gelenk-Punkt höher im Bild ist als der
darunter liegende.

```
isExtended = tip.y < pip.y  &&  pip.y < mcp.y
```

## Wann diese Annahme gilt

- Hand wird aufrecht vor der Kamera gehalten (Finger zeigen nach oben oder leicht zur Kamera)
- Daumen zeigt nach oben (`tip.y < mcp.y`)
- Typische Selfie-/Webcam-Interaktionspose

## Wann sie bricht

| Situation | Problem |
|---|---|
| Hand horizontal gehalten (Zeigefinger zeigt links/rechts) | y-Koordinaten der Gelenke liegen auf ähnlicher Höhe → Finger wird nicht als extended erkannt |
| Pistolengeste direkt zur Kamera (z-Achse) | Tiefe kollabiert in 2D → Zeigefinger sieht aus wie ein Punkt, nicht als extended erkannt |
| Stark gekippte oder gedrehte Hand | Projektion verzerrt die Gelenkabstände |

## Alternativer Ansatz (nicht implementiert)

MediaPipe liefert auch z-Werte (normalisierte Tiefenschätzung relativ zum Handgelenk).
Eine orientierungsunabhängige Erkennung könnte die 3D-Distanz zwischen Landmarks
verwenden:

```
extended = distance3D(tip, mcp) > distance3D(pip, mcp) * 1.4
```

Diese z-Werte sind jedoch Schätzungen und weniger stabil als x/y — besonders bei
schlechter Beleuchtung oder Verdeckung. Für eine erste Exploration ist der 2D-Ansatz
ausreichend und deutlich einfacher zu debuggen.

## Konsequenz für die Nutzung

Die Pistolengeste funktioniert zuverlässig, wenn der Nutzer die Hand aufrecht vor
die Kamera hält. Diese Einschränkung ist für den akademischen Prototypen dokumentiert
und akzeptiert.
