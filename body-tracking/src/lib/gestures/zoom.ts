import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { Gesture, GestureInput, GestureOutput } from '../types';

// Gesture: left hand pinch — thumb tip (lm[4]) and index tip (lm[8]) touch
// (small distance). No longer requires middle/ring/pinky to stay extended
// (previously an "OK-sign" shape) — a plain pinch is a more natural base
// hand posture to hold while triggering a click.
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

const TOUCH_THRESHOLD = 0.06;
const STABILIZE_MS = 400;

function distance(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Pinch shape: thumb tip and index tip touching.
function isPinchShape(lm: NormalizedLandmark[]): boolean {
  return distance(lm[4], lm[8]) < TOUCH_THRESHOLD;
}

export class ZoomGesture implements Gesture {
  state: ZoomState = 'idle';
  private armedSince: number | null = null;

  /**
   * Call once per frame with the current gesture input. Reads the left-hand
   * landmarks. Returns { triggered: true, value: 1.0 } while the pinch is
   * held stably, { triggered: false } otherwise.
   */
  update(input: GestureInput): GestureOutput {
    const landmarks = input.leftHand;
    const now = performance.now();

    if (landmarks === null || !isPinchShape(landmarks)) {
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
