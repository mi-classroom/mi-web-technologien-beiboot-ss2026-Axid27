# Browser-based Live Body Tracking — ML Exploration

**Academic project** | Web Technologien, TH Köln, SS 2026

## Purpose

A browser-based exploration demo that visualizes raw live body tracking data from a webcam using in-browser ML models. The goal is to observe, document, and reason about tracking quality, reliability, and performance — not to ship a production system.

## ML Approach

Pose estimation runs entirely in the browser using **[MediaPipe Tasks Vision](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker)** (`@mediapipe/tasks-vision`). The model produces 33 3D landmarks per person with per-point visibility scores. No server-side inference is involved.

See [ADR-002](docs/adr/ADR-002-ml-library-selection.md) for the full evaluation and rationale.

## Academic Context

This project is part of the accompanying project work for the Web Technologien module. All architectural decisions are documented as ADRs in [`docs/adr/`](docs/adr/).

## Project Structure

```
body-tracking/   Vite + TypeScript browser app, home of the Gesture Library (src/lib/)
news-app/        Standalone news demo app, controlled via the Gesture Library (see news-app/README.md)
docs/
  adr/           Architecture Decision Records
  observations/  Field notes on ML behavior
```

## Setup & Local Development

**Requirements:** Node.js 18+

```bash
cd body-tracking
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

## Build

```bash
cd body-tracking
npm run build
```

Output goes to `body-tracking/dist/`.

## News App Demo (Issue #4)

`news-app/` is a standalone news page controlled entirely via the Gesture
Library's public API — a real-world consumer used to stress-test the
library's API design. See [`news-app/README.md`](news-app/README.md) for
setup and supported gestures, and
[ADR-06](docs/adr/ADR-06-api-reflection-issue4.md) for the API findings
from that integration.

## Environment Variables

See [`body-tracking/.env.example`](body-tracking/.env.example) for available variables. Copy it to `body-tracking/.env.local` to override locally.

## Deployment

No deployment configured yet.

