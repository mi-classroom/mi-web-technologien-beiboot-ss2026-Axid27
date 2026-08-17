import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { Gesture, GestureInput, GestureOutput } from '../types';

// Gesture: right hand only, index finger extended, other fingers folded.
// The left hand is reserved for action gestures (Scroll, OK/Zoom, Toggle)
// so both hands can be used independently — pointing with the right hand
// no longer requires the left hand to also hold a shape.
export type PointerState = 'idle' | 'pointer_armed' | 'drawing_active';

const INDEX  = { tip: 8,  pip: 6,  mcp: 5  } as const;
const MIDDLE = { tip: 12, pip: 10, mcp: 9  } as const;
const RING   = { tip: 16, pip: 14, mcp: 13 } as const;
const PINKY  = { tip: 20, pip: 18, mcp: 17 } as const;
const STABILIZE_MS = 300;
const EMA_ALPHA = 0.6; // lower = smoother but more lag; raised for a more responsive cursor

function isExtended(lm: NormalizedLandmark[], tip: number, pip: number, mcp: number): boolean {
  return lm[tip].y < lm[pip].y && lm[pip].y < lm[mcp].y;
}

// Assumes upright hand — see docs/observations/gesture-2d-landmark-assumptions.md
// Only the index finger extended; other fingers folded to distinguish from open hand.
function isPointerShape(lm: NormalizedLandmark[]): boolean {
  return (
    isExtended(lm, INDEX.tip,  INDEX.pip,  INDEX.mcp) &&
    !isExtended(lm, MIDDLE.tip, MIDDLE.pip, MIDDLE.mcp) &&
    !isExtended(lm, RING.tip,   RING.pip,   RING.mcp) &&
    !isExtended(lm, PINKY.tip,  PINKY.pip,  PINKY.mcp)
  );
}

export class PointerGesture implements Gesture {
  state: PointerState = 'idle';
  private armedSince: number | null = null;
  private smoothX = 0;
  private smoothY = 0;
  private positionInitialized = false;

  /**
   * Call once per frame with the current gesture input. Reads the right-hand
   * landmarks. Returns an EMA-smoothed normalized position of the right
   * index tip when pointer_armed or drawing_active, no position when idle.
   */
  update(input: GestureInput): GestureOutput {
    const rightLandmarks = input.rightHand;
    const now = performance.now();

    const rightPointing = rightLandmarks !== null && isPointerShape(rightLandmarks);

    if (!rightPointing) {
      this.armedSince = null;
      this.positionInitialized = false;
      this.state = 'idle';
      return { triggered: false };
    }

    if (this.armedSince === null) this.armedSince = now;
    this.state = now - this.armedSince < STABILIZE_MS ? 'pointer_armed' : 'drawing_active';

    // EMA-smooth the right index tip (landmark 8).
    const tip = rightLandmarks![8];
    if (!this.positionInitialized) {
      this.smoothX = tip.x;
      this.smoothY = tip.y;
      this.positionInitialized = true;
    } else {
      this.smoothX = EMA_ALPHA * tip.x + (1 - EMA_ALPHA) * this.smoothX;
      this.smoothY = EMA_ALPHA * tip.y + (1 - EMA_ALPHA) * this.smoothY;
    }

    return { triggered: false, position: { x: this.smoothX, y: this.smoothY } };
  }
}
