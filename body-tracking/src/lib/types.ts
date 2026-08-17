import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export interface GestureInput {
  leftHand: NormalizedLandmark[] | null;
  rightHand: NormalizedLandmark[] | null;
  pose: NormalizedLandmark[] | null;
  timestamp: number;
}

export interface GestureOutput {
  triggered: boolean;
  position?: { x: number; y: number };
  value?: number;
  metadata?: Record<string, unknown>;
}

export interface Gesture {
  update(input: GestureInput): GestureOutput;
  readonly state: string;
}

export type GestureEvent = {
  name: string;
  output: GestureOutput;
};
