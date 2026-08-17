import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { Gesture, GestureInput, GestureOutput } from '../types';

// Gesture: left hand open (all five fingers extended) — joystick-style
// continuous scroll control. Landmarks used: lm[0] (wrist) for the
// vertical hand position that drives scroll direction/speed, plus
// tip/pip/mcp of all five fingers to detect the open-hand shape.
//
// DEAD_ZONE is the normalized distance from screen-center (0.5) within
// which the hand is treated as "centered" and no scrolling happens —
// without it, natural hand tremor near the center would cause jittery
// scroll direction flips.
//
// value is the normalized scroll speed/direction in [-MAX_SPEED, MAX_SPEED]:
// negative = hand above center = scroll up, positive = hand below center =
// scroll down.
//
// Joystick metaphor (continuous hand position -> continuous scroll speed,
// "hold to keep scrolling") was chosen over a discrete trigger because
// scrolling is inherently continuous, unlike a single click/activation.
// TODO: capture this rationale in a dedicated ADR for Issue #5.

export type ScrollState = 'idle' | 'scroll_armed' | 'scroll_active';

const INDEX  = { tip: 8,  pip: 6,  mcp: 5  } as const;
const MIDDLE = { tip: 12, pip: 10, mcp: 9  } as const;
const RING   = { tip: 16, pip: 14, mcp: 13 } as const;
const PINKY  = { tip: 20, pip: 18, mcp: 17 } as const;

const STABILIZE_MS = 300;
const DEAD_ZONE = 0.1;
const MAX_SPEED = 1.0;
const MAX_OFFSET = 0.2; // normalized offset from center treated as full speed — lower = less hand movement needed

function isExtended(lm: NormalizedLandmark[], tip: number, pip: number, mcp: number): boolean {
  return lm[tip].y < lm[pip].y && lm[pip].y < lm[mcp].y;
}

// Same monotonic tip->ip->mcp check as the other fingers (previously only
// checked tip vs. mcp, which let a half-curled thumb still count as
// "extended"), for a stricter, more natural fully-open-hand requirement.
function isThumbExtended(lm: NormalizedLandmark[]): boolean {
  return lm[4].y < lm[3].y && lm[3].y < lm[2].y;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Open-hand shape: all five fingers extended.
function isOpenHand(lm: NormalizedLandmark[]): boolean {
  return (
    isThumbExtended(lm) &&
    isExtended(lm, INDEX.tip,  INDEX.pip,  INDEX.mcp) &&
    isExtended(lm, MIDDLE.tip, MIDDLE.pip, MIDDLE.mcp) &&
    isExtended(lm, RING.tip,   RING.pip,   RING.mcp) &&
    isExtended(lm, PINKY.tip,  PINKY.pip,  PINKY.mcp)
  );
}

export class ScrollGesture implements Gesture {
  readonly kind = 'stream' as const;
  state: ScrollState = 'idle';
  private armedSince: number | null = null;

  /**
   * Call once per frame with the current gesture input. Reads the left-hand
   * landmarks. Returns { triggered: false, value } with value in
   * [-1.0, 1.0] (negative = scroll up, positive = scroll down) while
   * scroll_active, { triggered: false } otherwise.
   */
  update(input: GestureInput): GestureOutput {
    const landmarks = input.leftHand;
    const now = performance.now();

    if (landmarks === null || !isOpenHand(landmarks)) {
      this.armedSince = null;
      this.state = 'idle';
      return { triggered: false };
    }

    if (this.armedSince === null) this.armedSince = now;
    this.state = now - this.armedSince < STABILIZE_MS ? 'scroll_armed' : 'scroll_active';

    if (this.state !== 'scroll_active') {
      return { triggered: false };
    }

    const offset = landmarks[0].y - 0.5;
    const scrollValue = Math.abs(offset) < DEAD_ZONE
      ? 0
      : clamp(offset / MAX_OFFSET, -MAX_SPEED, MAX_SPEED);

    return { triggered: false, value: scrollValue };
  }
}
