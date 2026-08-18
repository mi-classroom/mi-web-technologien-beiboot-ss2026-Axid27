import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { Gesture, GestureInput, GestureOutput } from '../types';

// Gesture: both hands open (all five fingers extended) simultaneously,
// held for STABILIZE_MS = 2000ms (2 seconds), toggles gesture control
// on/off. Landmarks used: tip/pip/mcp of all five fingers per hand (see
// isOpenHand below).
//
// STABILIZE_MS = 2000 is deliberately long — a 2-second deliberate hold
// prevents this "kill switch" gesture from firing by accident while other
// gestures are in normal use.
//
// value exposes hold progress in [0.0, 1.0] while toggle_armed, so the app
// can render a loading indicator / progress bar during the hold.
//
// COOLDOWN_MS = 1500 after a trigger prevents an immediate re-toggle if the
// user keeps both hands open past the trigger moment.

export type ToggleState = 'idle' | 'toggle_armed' | 'cooldown';

const INDEX  = { tip: 8,  pip: 6,  mcp: 5  } as const;
const MIDDLE = { tip: 12, pip: 10, mcp: 9  } as const;
const RING   = { tip: 16, pip: 14, mcp: 13 } as const;
const PINKY  = { tip: 20, pip: 18, mcp: 17 } as const;

const STABILIZE_MS = 2000;
const COOLDOWN_MS = 1500;

function isExtended(lm: NormalizedLandmark[], tip: number, pip: number, mcp: number): boolean {
  return lm[tip].y < lm[pip].y && lm[pip].y < lm[mcp].y;
}

function isThumbExtended(lm: NormalizedLandmark[]): boolean {
  return lm[4].y < lm[2].y;
}

// Intentional local definition — see ADR-03 on duplication policy
function isOpenHand(lm: NormalizedLandmark[]): boolean {
  return (
    isThumbExtended(lm) &&
    isExtended(lm, INDEX.tip,  INDEX.pip,  INDEX.mcp) &&
    isExtended(lm, MIDDLE.tip, MIDDLE.pip, MIDDLE.mcp) &&
    isExtended(lm, RING.tip,   RING.pip,   RING.mcp) &&
    isExtended(lm, PINKY.tip,  PINKY.pip,  PINKY.mcp)
  );
}

export class ToggleGesture implements Gesture {
  readonly kind = 'trigger' as const;
  state: ToggleState = 'idle';
  private armedSince: number | null = null;
  private cooldownUntil = 0;

  /**
   * Call once per frame with the current gesture input. Reads both hand
   * landmarks. Returns { triggered: true } once after both hands have been
   * held open for STABILIZE_MS, { triggered: false, value: progress } while
   * held (progress in [0.0, 1.0]), { triggered: false } otherwise.
   */
  update(input: GestureInput): GestureOutput {
    const now = performance.now();

    if (this.state === 'cooldown') {
      if (now >= this.cooldownUntil) this.state = 'idle';
      return { triggered: false };
    }

    const bothOpen =
      input.leftHand !== null && isOpenHand(input.leftHand) &&
      input.rightHand !== null && isOpenHand(input.rightHand);

    if (!bothOpen) {
      this.armedSince = null;
      this.state = 'idle';
      return { triggered: false };
    }

    if (this.armedSince === null) this.armedSince = now;
    const elapsed = now - this.armedSince;

    if (elapsed >= STABILIZE_MS) {
      this.state = 'cooldown';
      this.cooldownUntil = now + COOLDOWN_MS;
      this.armedSince = null;
      return { triggered: true };
    }

    this.state = 'toggle_armed';
    return { triggered: false, value: elapsed / STABILIZE_MS };
  }
}
