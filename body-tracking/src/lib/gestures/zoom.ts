import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { Gesture, GestureInput, GestureOutput } from '../types';

// Landmarks used: lm[4] (thumb tip) and lm[8] (index tip) form the "circle" —
// their distance is checked against CIRCLE_THRESHOLD. Middle/ring/pinky
// tip/pip/mcp are used to confirm those fingers are folded (not extended),
// so an open hand isn't mistaken for the zoom circle.
//
// CIRCLE_THRESHOLD is in normalized landmark units (0.0–1.0, fraction of
// frame width/height), matching MediaPipe's NormalizedLandmark coordinates.
//
// value: 1.0 in the output is a placeholder for "100% zoom" — there is no
// continuous zoom factor yet.
//
// TODO: Issue #4 — read right hand finger count for zoom factor

export type ZoomState = 'idle' | 'zoom_armed' | 'zoom_active';

const MIDDLE = { tip: 12, pip: 10, mcp: 9  } as const;
const RING   = { tip: 16, pip: 14, mcp: 13 } as const;
const PINKY  = { tip: 20, pip: 18, mcp: 17 } as const;

const CIRCLE_THRESHOLD = 0.06;
const STABILIZE_MS = 400;

// Assumes upright hand orientation — see docs/observations/gesture-2d-landmark-assumptions.md
function isExtended(lm: NormalizedLandmark[], tip: number, pip: number, mcp: number): boolean {
  return lm[tip].y < lm[pip].y && lm[pip].y < lm[mcp].y;
}

function distance(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Base shape: thumb tip and index tip close together (circle), other fingers folded.
function isZoomCircleShape(lm: NormalizedLandmark[]): boolean {
  return (
    distance(lm[4], lm[8]) < CIRCLE_THRESHOLD &&
    !isExtended(lm, MIDDLE.tip, MIDDLE.pip, MIDDLE.mcp) &&
    !isExtended(lm, RING.tip,   RING.pip,   RING.mcp) &&
    !isExtended(lm, PINKY.tip,  PINKY.pip,  PINKY.mcp)
  );
}

export class ZoomGesture implements Gesture {
  state: ZoomState = 'idle';
  private armedSince: number | null = null;

  /**
   * Call once per frame with the current gesture input. Reads the left-hand
   * landmarks. Returns { triggered: true, value: 1.0 } while the zoom circle
   * is held stably, { triggered: false } otherwise.
   */
  update(input: GestureInput): GestureOutput {
    const landmarks = input.leftHand;
    const now = performance.now();

    if (landmarks === null || !isZoomCircleShape(landmarks)) {
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
