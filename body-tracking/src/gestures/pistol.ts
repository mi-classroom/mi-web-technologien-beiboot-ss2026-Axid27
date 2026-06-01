import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

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

function isThumbUp(lm: NormalizedLandmark[]): boolean {
  return lm[4].y < lm[2].y;
}

// Base shape: thumb up + non-trigger fingers folded. Index is checked separately
// so that curling it (the trigger action) doesn't immediately break the gesture.
function hasBasePistolShape(lm: NormalizedLandmark[]): boolean {
  return (
    isThumbUp(lm) &&
    !isExtended(lm, MIDDLE.tip, MIDDLE.pip, MIDDLE.mcp) &&
    !isExtended(lm, RING.tip,   RING.pip,   RING.mcp) &&
    !isExtended(lm, PINKY.tip,  PINKY.pip,  PINKY.mcp)
  );
}

const STABILIZE_MS = 300;
const COOLDOWN_MS  = 800;

export class PistolGesture {
  state: GestureState = 'idle';
  private gestureStart: number | null = null;
  private cooldownUntil = 0;
  private prevIndexExtended = true;

  /**
   * Call once per frame with the left-hand landmarks, or null when the hand
   * is not visible. Returns true exactly once per trigger event (GO_FORWARD).
   */
  update(landmarks: NormalizedLandmark[] | null): boolean {
    const now = performance.now();

    if (this.state === 'cooldown') {
      if (now >= this.cooldownUntil) this.state = 'idle';
      return false;
    }

    if (landmarks === null || !hasBasePistolShape(landmarks)) {
      this.gestureStart = null;
      this.prevIndexExtended = true;
      this.state = 'idle';
      return false;
    }

    const indexExtended = isExtended(landmarks, INDEX.tip, INDEX.pip, INDEX.mcp);

    // Arming requires index to be extended first. If the hand is in base shape
    // but index is already curled, wait until the user raises the index finger.
    if (this.gestureStart === null) {
      if (!indexExtended) return false;
      this.gestureStart = now;
    }

    if (now - this.gestureStart < STABILIZE_MS) return false;

    this.state = 'armed';

    // Trigger: index-finger transitions extended → curled while armed.
    if (this.prevIndexExtended && !indexExtended) {
      this.state = 'cooldown';
      this.cooldownUntil = now + COOLDOWN_MS;
      this.gestureStart = null;
      this.prevIndexExtended = true;
      return true;
    }

    this.prevIndexExtended = indexExtended;
    return false;
  }
}
