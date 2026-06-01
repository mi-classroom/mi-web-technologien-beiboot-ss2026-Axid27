# ADR-002 — ML Library Selection for Browser-Based Body Tracking

**Date:** 2026-05-21
**Status:** Accepted

---

## Context

This project requires in-browser, real-time body pose estimation from a webcam stream. The model must run entirely in the browser — no server-side inference. The selection criteria for this academic exploration project are:

- browser compatibility (Chrome, Firefox, Safari)
- setup complexity and number of dependencies
- runtime performance on consumer hardware
- documentation quality
- landmark quality (number of points, dimensionality, confidence scores)
- implementation simplicity and explainability

Two realistic options were evaluated: **MediaPipe Tasks Vision** and **TensorFlow.js with @tensorflow-models/pose-detection**.

---

## Options Evaluated

### Option A — MediaPipe Tasks Vision (`@mediapipe/tasks-vision`)

Google's higher-level ML solution library. Ships a unified `PoseLandmarker` API on top of a WASM + optional WebGL/WebGPU backend.

**Setup:** One npm package. Loads a WASM runtime and a `.task` model file (can be served from CDN or self-hosted).

```ts
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const vision = await FilesetResolver.forVisionTasks('...');
const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
  baseOptions: { modelAssetPath: '...' },
  runningMode: 'VIDEO',
});

const result = poseLandmarker.detectForVideo(videoElement, timestamp);
// result.landmarks[0] → array of 33 NormalizedLandmark { x, y, z, visibility }
```

| Criterion | Assessment |
|---|---|
| Browser compatibility | Good — WASM runs in all modern browsers |
| Setup complexity | Low — single package, simple API |
| Performance | High — WASM + GPU-accelerated where available |
| Documentation | Good — official Google docs, actively maintained |
| Landmark quality | 33 3D landmarks with per-point visibility score |
| Implementation simplicity | High — purpose-built for this exact use case |

**Drawbacks:** WASM + model files add ~5–8 MB to the initial load. Model must be fetched from CDN or bundled separately (not tree-shakeable).

---

### Option B — TensorFlow.js + pose-detection (`@tensorflow-models/pose-detection`)

A general-purpose ML framework for the browser. Pose estimation is provided via a separate model package that supports multiple backends (WebGL, WASM, CPU).

**Setup:** Requires composing multiple packages: `@tensorflow/tfjs-core`, a backend (`@tensorflow/tfjs-backend-webgl` or `-wasm`), and `@tensorflow-models/pose-detection`. Model choice (MoveNet, BlazePose, PoseNet) is a separate configuration decision.

```ts
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

const detector = await poseDetection.createDetector(
  poseDetection.SupportedModels.MoveNet
);
const poses = await detector.estimatePoses(videoElement);
// poses[0].keypoints → array of 17 Keypoint { x, y, score, name }
```

| Criterion | Assessment |
|---|---|
| Browser compatibility | Good — WebGL widely supported |
| Setup complexity | Medium — 3–4 packages, backend must be chosen explicitly |
| Performance | Good — WebGL backend is fast; MoveNet is the fastest available model |
| Documentation | Fragmented — split across TF.js core, backends, and model repos |
| Landmark quality | 17 keypoints (MoveNet) or 33 (BlazePose) — no unified default |
| Implementation simplicity | Medium — more moving parts, more configuration decisions |

**Drawbacks:** More dependencies, fragmented docs, requires explicit backend wiring. The "right" model choice (MoveNet vs BlazePose vs PoseNet) is a secondary decision that adds friction for an exploratory project.

---

## Decision

**Option A — MediaPipe Tasks Vision** is selected.

Reasons:

1. **Simpler setup.** One package vs. a manually assembled stack of 3–4 packages with explicit backend wiring.
2. **Better landmark quality out of the box.** 33 3D landmarks with per-point visibility scores vs. 17 keypoints from MoveNet (the TF.js default). For exploration, more data is more interesting.
3. **Single, well-maintained API.** `PoseLandmarker.detectForVideo()` maps directly to the use case; no extra configuration is needed.
4. **Academic explainability.** The MediaPipe pipeline (WASM runtime → model inference → normalized landmark output) is straightforward to trace and explain in a review.

TensorFlow.js would be the better choice if custom model training, fine-tuning, or framework flexibility were required. None of those apply here.

---

## Consequences

- `@mediapipe/tasks-vision` is added as a runtime dependency.
- The BlazePose Full model (`.task` file) will be loaded from the MediaPipe CDN at runtime. If self-hosting is required, the URL is configurable via `VITE_MODEL_URL` (see `.env.example`).
- WASM files are served from the same CDN package path. First load will fetch ~5–8 MB; subsequent loads are cached by the browser.
- Landmark coordinate system: x/y normalized to [0, 1] relative to the video frame; z is depth relative to the hip midpoint; visibility is [0, 1].
