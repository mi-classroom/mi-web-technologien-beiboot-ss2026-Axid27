import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { Gesture, GestureInput, GestureOutput } from '../types';

// Gesture: left hand with thumb and index finger extended, middle/ring/pinky
// folded (GO_BACK). Landmarks used: lm[4]/lm[2] (thumb tip/mcp), lm[8]/lm[6]/lm[5]
// (index tip/pip/mcp), plus tip/pip/mcp for middle, ring, and pinky.
// Index-extended is tracked separately below (not inside hasBackGestureShape)
// so that curling it — the trigger action — doesn't immediately break the
// shape gate; see hasBackGestureShape and the arming check in update().

export type GestureState = 'idle' | 'armed' | 'cooldown';

// Landmark index groups per finger.
const INDEX  = { tip: 8,  pip: 6,  mcp: 5  } as const;
const MIDDLE = { tip: 12, pip: 10, mcp: 9  } as const;
const RING   = { tip: 16, pip: 14, mcp: 13 } as const;
const PINKY  = { tip: 20, pip: 18, mcp: 17 } as const;

// Assumes upright hand orientation — see docs/observations/gesture-2d-landmark-assumptions.md
function isExtended(lm: NormalizedLandmark[], tip: number, pip: number, mcp: number): boolean {
  return lm[tip].y < lm[pip].y && lm[pip].y < lm[mcp].y;
}

function isThumbExtended(lm: NormalizedLandmark[]): boolean {
  return lm[4].y < lm[2].y;
}

// Base shape: thumb extended + non-trigger fingers folded. Index is checked
// separately so that curling it (the trigger action) doesn't immediately
// break the gesture.
function hasBackGestureShape(lm: NormalizedLandmark[]): boolean {
  return (
    isThumbExtended(lm) &&
    !isExtended(lm, MIDDLE.tip, MIDDLE.pip, MIDDLE.mcp) &&
    !isExtended(lm, RING.tip,   RING.pip,   RING.mcp) &&
    !isExtended(lm, PINKY.tip,  PINKY.pip,  PINKY.mcp)
  );
}

const STABILIZE_MS = 300;
const COOLDOWN_MS  = 800;

export class PistolGestureLeft implements Gesture {
  // Intentional duplication over inheritance.
  // See docs/adr/003-gesture-duplication.md

  state: GestureState = 'idle';
  private gestureStart: number | null = null;
  private cooldownUntil = 0;
  private prevIndexExtended = true;

  /**
   * Call once per frame with the current gesture input. Reads the left-hand
   * landmarks. Returns { triggered: true } exactly once per trigger event
   * (GO_BACK).
   */
  update(input: GestureInput): GestureOutput {
    const landmarks = input.leftHand;
    const now = performance.now();

    if (this.state === 'cooldown') {
      if (now >= this.cooldownUntil) this.state = 'idle';
      return { triggered: false };
    }

    if (landmarks === null || !hasBackGestureShape(landmarks)) {
      this.gestureStart = null;
      this.prevIndexExtended = true;
      this.state = 'idle';
      return { triggered: false };
    }

    const indexExtended = isExtended(landmarks, INDEX.tip, INDEX.pip, INDEX.mcp);

    // Arming requires index to be extended first. If the hand is in base shape
    // but index is already curled, wait until the user raises the index finger.
    if (this.gestureStart === null) {
      if (!indexExtended) return { triggered: false };
      this.gestureStart = now;
    }

    if (now - this.gestureStart < STABILIZE_MS) return { triggered: false };

    this.state = 'armed';

    // Trigger: index-finger transitions extended → curled while armed.
    if (this.prevIndexExtended && !indexExtended) {
      this.state = 'cooldown';
      this.cooldownUntil = now + COOLDOWN_MS;
      this.gestureStart = null;
      this.prevIndexExtended = true;
      return { triggered: true };
    }

    this.prevIndexExtended = indexExtended;
    return { triggered: false };
  }
}
