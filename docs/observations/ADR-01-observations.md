# ADR-01: Beobachtungen zum Proof of Concept für Browser-basiertes Body Tracking

## Status

Accepted

## Kontext

Im Rahmen des ersten Proof of Concept wurde die Integration von MediaPipe in einer lokalen Vite-Anwendung evaluiert. Ziel war es, die Qualität, Stabilität und Performance der erfassten Körperdaten unter verschiedenen Bedingungen zu beobachten.

## Entscheidung

MediaPipe wird als Grundlage für die weitere Entwicklung des Body-Tracking-Systems verwendet. Die Ergebnisse des Proof of Concept zeigen, dass die Bibliothek für die geplanten Anwendungsfälle ausreichend performant und zuverlässig arbeitet.

## Beobachtungen

### Performance

Die Anwendung lief durchgehend flüssig. Das erkannte Körperskelett wurde auch bei schnellen und größeren Bewegungen in Echtzeit auf das Kamerabild projiziert. Während der Tests konnten keine wahrnehmbaren Verzögerungen festgestellt werden.

### Datenqualität

Die erkannten Körperlandmarks waren insgesamt stabil und konsistent. Das Tracking reagierte zuverlässig auf Bewegungen und lieferte auch bei Positionsänderungen kontinuierlich verwertbare Daten.

### Lichtverhältnisse

Die Erkennung funktionierte überraschend gut unter schlechten Lichtbedingungen. Obwohl die Bildqualität der Webcam sichtbar abnahm, blieb das Körpertracking weitgehend stabil.

### Distanz zur Kamera

Sowohl die Gesichtserkennung aus kurzer Distanz als auch die Körpererkennung aus größerer Entfernung funktionierten zuverlässig. Für die getesteten Distanzen konnten keine wesentlichen Qualitätsunterschiede festgestellt werden.

### Mehrpersonen-Erkennung

Während der Tests wurde nur eine Person gleichzeitig erkannt. Es ist derzeit unklar, ob dies eine Einschränkung der verwendeten Konfiguration oder der implementierten Lösung ist. Die Unterstützung mehrerer Personen muss in einem späteren Schritt untersucht werden.

## Konsequenzen

* MediaPipe eignet sich als technische Basis für die weitere Entwicklung.
* Zusätzliche Maßnahmen zur Performance-Optimierung sind aktuell nicht erforderlich.
* Die Unterstützung von Mehrpersonen-Tracking sollte als separates Forschungsthema bzw. zukünftiges Ticket betrachtet werden.
* Die beobachtete Robustheit gegenüber Lichtverhältnissen und Distanz reduziert die Anforderungen an die Nutzungsumgebung.
