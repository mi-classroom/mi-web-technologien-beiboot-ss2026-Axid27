# 🎮 Keep it on the Plate

Ein mobiles Browser-Spiel, das komplett im Smartphone-Browser läuft. Der Spieler balanciert einen Ball auf einer rotierenden Platte, indem er das Gerät neigt (Gyroskop-Steuerung). Es gibt kein Backend und keinen Multiplayer – alles läuft lokal auf dem Gerät!

## 🚀 Voraussetzungen

Bevor du startest, stelle sicher, dass Folgendes auf deinem System installiert ist:
- [Node.js](https://nodejs.org/) (Version 20 oder neuer empfohlen)
- Ein Smartphone (iOS oder Android) zum Testen
- Dein Laptop/PC und dein Smartphone müssen sich im **selben WLAN-Netzwerk** befinden.

## 🛠️ Installation

1. Öffne ein Terminal und navigiere in das Projektverzeichnis:
   ```bash
   cd keep-it-on-the-plate
   ```

2. Installiere die benötigten Abhängigkeiten:
   ```bash
   npm install
   ```

## 📱 Spiel starten (Development Server)

Um das Spiel auf deinem Smartphone testen zu können, muss der Entwicklungsserver über HTTPS und im lokalen Netzwerk erreichbar sein. Dies wird automatisch durch das Plugin `vite-plugin-mkcert` geregelt.

Starte den Server mit:
```bash
npm run dev
```

Im Terminal wird nun eine lokale Netzwerk-URL angezeigt (z.B. `https://192.168.x.x:5173/`).

### Auf dem Smartphone testen:
1. Öffne Safari (iOS) oder Chrome (Android) auf deinem Smartphone.
2. Gib die im Terminal angezeigte **Network-URL** ein (inklusive `https://`).
3. **Wichtiger Hinweis zu HTTPS:** Da das Zertifikat lokal generiert wurde, wird dein Browser wahrscheinlich eine Warnung anzeigen (z.B. "Verbindung ist nicht privat").
   - Klicke auf **Details einblenden** (bzw. "Erweitert").
   - Wähle **Website trotzdem besuchen** (bzw. "Weiter zu 192.168...").
4. Tippe auf dem Bildschirm auf **Tap to Start**, um dem Browser die Berechtigung für die Gyroskop-Sensoren (Gerätebewegung) zu erteilen.
5. Halte das Smartphone waagerecht und balanciere den Ball!

## 💡 Tech Stack
- **Framework:** Svelte + Vite
- **Rendering:** Canvas 2D API (Game Loop + Drawing)
- **Sensorik:** `DeviceOrientationEvent` (beta, gamma, alpha)
- **Sicherheit (HTTPS):** `vite-plugin-mkcert` (Notwendig für die Gyroskop-Berechtigungen unter iOS)
