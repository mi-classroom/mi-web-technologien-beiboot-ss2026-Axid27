import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { Gesture, GestureInput, GestureOutput } from '../types';

// Gesture: left hand OK-sign — thumb tip (lm[4]) and index tip (lm[8]) touch
// (small distance), while middle, ring, and pinky are extended. Landmarks
// used: lm[4]/lm[8] for the touch distance, plus tip/pip/mcp for middle,
// ring, and pinky to confirm they're extended.
//
// TOUCH_THRESHOLD is the normalized distance between lm[4] and lm[8]
// (0.0–1.0, fraction of frame width/height), matching MediaPipe's
// NormalizedLandmark coordinates.
//
// value: 1.0 in the output is a placeholder for "100% zoom" — there is no
// continuous zoom factor yet.
//
// TODO: Issue #4 — read right hand finger count for zoom factor

export type ZoomState = 'idle' | 'zoom_armed' | 'zoom_active';

const MIDDLE = { tip: 12, pip: 10, mcp: 9  } as const;
const RING   = { tip: 16, pip: 14, mcp: 13 } as const;
const PINKY  = { tip: 20, pip: 18, mcp: 17 } as const;

const TOUCH_THRESHOLD = 0.06;
const STABILIZE_MS = 400;

// Assumes upright hand orientation — see docs/observations/gesture-2d-landmark-assumptions.md
function isExtended(lm: NormalizedLandmark[], tip: number, pip: number, mcp: number): boolean {
  return lm[tip].y < lm[pip].y && lm[pip].y < lm[mcp].y;
}

function distance(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// OK-sign shape: thumb tip and index tip touching, other fingers extended.
function isOkShape(lm: NormalizedLandmark[]): boolean {
  return (
    distance(lm[4], lm[8]) < TOUCH_THRESHOLD &&
    isExtended(lm, MIDDLE.tip, MIDDLE.pip, MIDDLE.mcp) &&
    isExtended(lm, RING.tip,   RING.pip,   RING.mcp) &&
    isExtended(lm, PINKY.tip,  PINKY.pip,  PINKY.mcp)
  );
}

export class ZoomGesture implements Gesture {
  state: ZoomState = 'idle';
  private armedSince: number | null = null;

  /**
   * Call once per frame with the current gesture input. Reads the left-hand
   * landmarks. Returns { triggered: true, value: 1.0 } while the OK-sign is
   * held stably, { triggered: false } otherwise.
   */
  update(input: GestureInput): GestureOutput {
    const landmarks = input.leftHand;
    const now = performance.now();

    if (landmarks === null || !isOkShape(landmarks)) {
      this.armedSince = null;
      this.state = 'idle';
      return { triggered: false };
    }

    if (this.armedSince === null) this.armedSince = now;
    this.state = now - this.armedSince < STABILIZE_MS ? 'zoom_armed' : 'zoom_active';

    if (this.state === 'zoom_active') {
      return { triggered: true, value: 1.0 };
    }

    return { triggered: false };
  }
}
