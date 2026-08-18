# Gesture Navigation System
## Browser-based gesture interaction — TH Köln Web Technologies SS2026

## Was ist das?
Ein browserbasiertes Gesten-Interaktionssystem bestehend aus:
- Einer wiederverwendbaren Gesture Library (TypeScript, MediaPipe)
- Einer Demo-Anwendung: "The Daily Gesture" — eine Newsseite
  die ausschließlich per Handgesten navigiert wird

Akademisches Projekt im Modul Web Technologien, TH Köln SS2026.

## Live Demo
https://mi-classroom.github.io/mi-web-technologien-beiboot-ss2026-Axid27/

## Voraussetzungen
- Node.js >= 18 (empfohlen: aktuelle LTS-Version)
- Moderner Browser — Chrome empfohlen (beste MediaPipe-Performance)
- Kamera erforderlich
- HTTPS oder localhost (Browser-Anforderung für Kamerazugriff)
- Gute Lichtverhältnisse, Hände frontal zur Kamera

## Projektstruktur
  body-tracking/   — Gesture Library + technische Tracking-Demo
  news-app/        — "The Daily Gesture" Navigations-Demo
  docs/adr/        — Architecture Decision Records

## Installation und Start

### Gesture Library Demo
  cd body-tracking
  npm install
  npm run dev
  → http://localhost:5173

### News-App (The Daily Gesture)
  cd news-app
  npm install
  npm run dev
  → http://localhost:5173

## Unterstützte Gesten

| Geste | Hand | Beschreibung |
|---|---|---|
| Pointer | Rechts | Zeigefinger extended — bewegt visuellen Cursor |
| OK / Klick | Links | Daumen+Zeigefinger berühren sich (Pinch) |
| Scroll | Links | Offene Hand — y-Position steuert Scroll-Richtung |
| Toggle | Beide | Beide Hände offen, 2 Sekunden halten — Steuerung an/aus |

## Bekannte Einschränkungen
- Hände frontal zur Kamera halten — seitliche Haltung
  beeinträchtigt Landmark-Erkennung (siehe ADR-03)
- Gute Lichtverhältnisse empfohlen
- Drag-Interaktionen (Slider) nicht unterstützt —
  kein anhaltender gedrückt-Zustand abbildbar (siehe ADR-07)
- Chrome für beste MediaPipe-GPU-Performance

## Selbst deployen
  npm install -g vercel
  vercel --prod
  → Vercel-Konfiguration liegt in vercel.json im Root

## AI-Nutzung
Dieses Projekt wurde mit Unterstützung von Claude (Anthropic)
entwickelt. Gesprächsprotokolle und Planungsdokumente sind
im Repository dokumentiert gemäß den Anforderungen des Moduls.

## Lizenz
Akademisches Projekt — TH Köln SS2026
