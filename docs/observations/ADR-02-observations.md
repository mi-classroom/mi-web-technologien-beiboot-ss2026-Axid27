# Beobachtungen: Gesten-Implementierung (ADR-02)

## Kontext

Erste praktische Erprobung der implementierten Handgesten auf Basis von MediaPipe
Hand Landmarks. Beobachtet wurden zwei Gesten: die Pistolengeste (linke Hand,
„Go Forward") und die Pointer-Geste (beide Hände, Zeichenmodus).

---

## Auswahl der Gesten

### Pistolengeste — „Go Forward"

Die Pistolengeste wurde gewählt, weil sie geometrisch präzise definiert ist:
Daumen oben, Zeigefinger gestreckt, restliche Finger gefaltet. Diese Eindeutigkeit
macht sie gut geeignet für experimentelle Landmark-basierte Erkennung — die
Abgrenzung zu anderen Handpositionen ist klar.

### Pointer-Geste — Zeichenmodus

Die Pointer-Geste wurde gewählt, weil sie zwei Hände gleichzeitig einbezieht und
strukturell Ähnlichkeit zur Pistolengeste aufweist (isolierter Zeigefinger). Durch
diese Ähnlichkeit lässt sich die Robustheit des Erkennungssystems gut testen:
Werden beide Gesten zuverlässig unterschieden, auch wenn sie sich ähneln?

---

## Beobachtungen

### Pistolengeste

Die Geste erkennt zuverlässig und lässt sich schnell erneut auslösen. Der
Cooldown-Mechanismus verhindert versehentliche Mehrfachtrigger effektiv.

**Orientierungsabhängigkeit:**
- Aufrechte Hand (Zeigefinger nach oben, Daumen zur Seite): beste Erkennungsrate
- Innenseite oder Außenseite der Hand zur Kamera: funktioniert in beiden Fällen
- Seitlich gehaltene Hand (Zeigefinger zeigt nach links/rechts): Erkennung nur
  zuverlässig, wenn die Hand im Zentrum des Kamerabilds positioniert ist

Das deckt sich mit der dokumentierten Einschränkung des y-Koordinaten-Ansatzes
(→ `gesture-2d-landmark-assumptions.md`): bei stark seitlicher Orientierung
kollabieren die y-Abstände der Gelenkpunkte.

### Pointer-Geste

Überraschend stabile Erkennung. Die Geste bleibt auch bei zügigen Handbewegungen
aktiv und zeigt keine sichtbare Hysterese.

**Orientierungsunabhängigkeit:**
- Funktioniert in allen getesteten Ausrichtungen (Innen-/Außenseite, verschiedene
  Winkel)
- Robuster als die Pistolengeste, vermutlich weil nur Zeigefinger-Extension geprüft
  wird und keine zusätzliche Daumen-Bedingung existiert

**Interferenz:**
- Die Pistolengeste stört den Pointer-Modus nicht
- Simultane Aktivierung beider Gesten ist möglich: Pistolengeste (linke Hand)
  und Pointer-Modus (beide Hände) können gleichzeitig aktiv sein, ohne sich
  gegenseitig zu beeinflussen

---

## Fazit

Beide Gesten sind für einen Prototyp produktiv einsetzbar. Die größte Einschränkung
liegt in der orientierungsabhängigen Erkennung der Pistolengeste, die für robustere
Anwendungen eine 3D-basierte Auswertung erfordern würde. Die simultane Nutzbarkeit
beider Gesten ist ein positives, unerwartetes Ergebnis und eröffnet Möglichkeiten
für kombinierte Interaktionskonzepte.
